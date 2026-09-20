import type { jsPDF } from 'jspdf';

import { listOwnerImages } from '@/features/images/imagesRepository';
import { pdfFileName } from '@/lib/pdf/pdfFileName';

import { listDialogue } from './dialogueRepository';
import { sceneSlugline } from './types';
import type { DialogueLine, Scene, Shot } from './types';

/**
 * A scene as a working sheet: A4, Helvetica, one section per part of the scene
 * template, and nothing printed that was left empty. This is a production
 * document rather than a book, so it shares none of the novel's page design —
 * only the file-name helper.
 */
const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 56,
};
const MEASURE = PAGE.width - PAGE.margin * 2;
/** Lowest a block may start, leaving the page number its room. */
const BOTTOM = PAGE.height - PAGE.margin;

const TITLE = { size: 18, lineHeight: 22 };
const CONTEXT = { size: 9, lineHeight: 12 };
const SLUGLINE = { size: 11, lineHeight: 15 };
const SECTION = { size: 10, lineHeight: 14, spaceAbove: 20, spaceBelow: 10 };
const LABEL = { size: 8.5, lineHeight: 11 };
const BODY = { size: 10.5, lineHeight: 14, spaceBelow: 10 };
const SHOT = { indent: 14, spaceBelow: 12 };
const IMAGES = { columns: 3, gap: 8, maxHeight: 110, spaceAbove: 6 };
const PAGE_NUMBER = { size: 9, bottomOffset: 34 };

const INK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const RULE: [number, number, number] = [209, 213, 219];

interface Cursor {
  /** Top of the next block. Everything is drawn from the top down. */
  y: number;
}

function ensureSpace(doc: jsPDF, cursor: Cursor, needed: number): void {
  if (cursor.y + needed > BOTTOM) {
    doc.addPage();
    cursor.y = PAGE.margin;
  }
}

function wrap(doc: jsPDF, text: string, width: number): string[] {
  return doc.splitTextToSize(text, width) as string[];
}

function writeLines(
  doc: jsPDF,
  cursor: Cursor,
  lines: string[],
  x: number,
  lineHeight: number,
): void {
  for (const line of lines) {
    ensureSpace(doc, cursor, lineHeight);
    doc.text(line, x, cursor.y, { baseline: 'top' });
    cursor.y += lineHeight;
  }
}

function sectionHeading(doc: jsPDF, cursor: Cursor, title: string): void {
  // Enough room for the heading and the first line under it, so a heading is
  // never left alone at the foot of a page.
  ensureSpace(
    doc,
    cursor,
    SECTION.spaceAbove +
      SECTION.lineHeight +
      SECTION.spaceBelow +
      LABEL.lineHeight +
      BODY.lineHeight,
  );
  cursor.y += SECTION.spaceAbove;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(SECTION.size);
  doc.setTextColor(...INK);
  doc.text(title.toUpperCase(), PAGE.margin, cursor.y, { baseline: 'top', charSpace: 0.8 });
  cursor.y += SECTION.lineHeight;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.5);
  doc.line(PAGE.margin, cursor.y, PAGE.margin + MEASURE, cursor.y);
  cursor.y += SECTION.spaceBelow;
}

/** A labelled paragraph. Nothing is drawn when the field was left empty. */
function field(doc: jsPDF, cursor: Cursor, label: string, value: string, x = PAGE.margin): void {
  if (value.trim() === '') {
    return;
  }
  ensureSpace(doc, cursor, LABEL.lineHeight + BODY.lineHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(LABEL.size);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x, cursor.y, { baseline: 'top', charSpace: 0.6 });
  cursor.y += LABEL.lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(BODY.size);
  doc.setTextColor(...INK);
  const width = MEASURE - (x - PAGE.margin);
  for (const block of value.split(/\r?\n/)) {
    if (block.trim() !== '') {
      writeLines(doc, cursor, wrap(doc, block.trim(), width), x, BODY.lineHeight);
    }
  }
  cursor.y += BODY.spaceBelow;
}

async function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('That picture could not be read.'));
      }
    };
    reader.onerror = () => {
      reject(new Error('That picture could not be read.'));
    };
    reader.readAsDataURL(blob);
  });
}

interface PlacedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * The shot's pictures, laid out in rows and scaled to fit their cell. Pictures
 * this device has not fetched yet are simply left out.
 */
async function drawImages(doc: jsPDF, cursor: Cursor, blobs: Blob[], x: number): Promise<void> {
  const cellWidth =
    (MEASURE - (x - PAGE.margin) - IMAGES.gap * (IMAGES.columns - 1)) / IMAGES.columns;
  const placed: PlacedImage[] = [];
  for (const blob of blobs) {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(cellWidth / bitmap.width, IMAGES.maxHeight / bitmap.height);
    placed.push({
      dataUrl: await toDataUrl(blob),
      width: bitmap.width * scale,
      height: bitmap.height * scale,
    });
    bitmap.close();
  }

  cursor.y += IMAGES.spaceAbove;
  for (let start = 0; start < placed.length; start += IMAGES.columns) {
    const row = placed.slice(start, start + IMAGES.columns);
    const rowHeight = Math.max(...row.map((image) => image.height));
    ensureSpace(doc, cursor, rowHeight);
    let left = x;
    for (const image of row) {
      doc.addImage(image.dataUrl, 'JPEG', left, cursor.y, image.width, image.height);
      left += cellWidth + IMAGES.gap;
    }
    cursor.y += rowHeight + IMAGES.gap;
  }
}

/** A shot, then what it should show, then what is said over it. */
async function drawShots(doc: jsPDF, cursor: Cursor, shots: Shot[]): Promise<void> {
  const x = PAGE.margin + SHOT.indent;
  for (const shot of shots) {
    const parts = [`Shot ${String(shot.number)}`, shot.shotType, shot.camera].filter(
      (part) => part !== '',
    );
    ensureSpace(doc, cursor, BODY.lineHeight * 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(BODY.size);
    doc.setTextColor(...INK);
    doc.text(parts.join('  ·  '), PAGE.margin, cursor.y, { baseline: 'top' });
    cursor.y += BODY.lineHeight + 2;

    doc.setFont('helvetica', 'normal');
    if (shot.visual.trim() !== '') {
      writeLines(
        doc,
        cursor,
        wrap(doc, shot.visual.trim(), MEASURE - SHOT.indent),
        x,
        BODY.lineHeight,
      );
    }

    const images = await listOwnerImages(shot.id);
    const blobs = images.flatMap((image) => (image.blob === null ? [] : [image.blob]));
    if (blobs.length > 0) {
      await drawImages(doc, cursor, blobs, x);
    }

    drawDialogue(doc, cursor, await listDialogue(shot.id));
    cursor.y += SHOT.spaceBelow;
  }
}

/** Quotation marks a writer may have typed around a line themselves. */
const ALREADY_QUOTED = /^["“«].*["”»]$/s;

/** What is spoken, in quotes — unless the writer wrote their own. */
function quoted(spoken: string): string {
  return ALREADY_QUOTED.test(spoken) ? spoken : `“${spoken}”`;
}

/** The lines of one shot, set in under it. */
function drawDialogue(doc: jsPDF, cursor: Cursor, dialogue: DialogueLine[]): void {
  const x = PAGE.margin + SHOT.indent;
  const lineX = x + SHOT.indent;
  for (const line of dialogue) {
    const heading = [
      line.speaker.trim() === '' ? 'Unnamed' : line.speaker.toUpperCase(),
      line.delivery.trim() === '' ? '' : `(${line.delivery.trim()})`,
    ].filter((part) => part !== '');

    ensureSpace(doc, cursor, BODY.lineHeight * 2);
    cursor.y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(BODY.size);
    doc.setTextColor(...INK);
    doc.text(heading.join('  ·  '), x, cursor.y, { baseline: 'top' });
    cursor.y += BODY.lineHeight + 2;

    doc.setFont('helvetica', 'normal');
    if (line.line.trim() !== '') {
      writeLines(
        doc,
        cursor,
        wrap(doc, quoted(line.line.trim()), MEASURE - SHOT.indent * 2),
        lineX,
        BODY.lineHeight,
      );
    }
  }
}

function drawTitle(doc: jsPDF, cursor: Cursor, scene: Scene, context: string): void {
  const above = [scene.sceneCode, context].filter((part) => part !== '').join('  ·  ');
  if (above !== '') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(CONTEXT.size);
    doc.setTextColor(...MUTED);
    doc.text(above, PAGE.margin, cursor.y, { baseline: 'top', charSpace: 0.4 });
    cursor.y += CONTEXT.lineHeight + 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(TITLE.size);
  doc.setTextColor(...INK);
  writeLines(
    doc,
    cursor,
    wrap(doc, scene.title.trim() === '' ? `Scene ${String(scene.number)}` : scene.title, MEASURE),
    PAGE.margin,
    TITLE.lineHeight,
  );

  const slugline = sceneSlugline(scene);
  if (slugline !== '') {
    cursor.y += 4;
    doc.setFontSize(SLUGLINE.size);
    doc.setTextColor(...MUTED);
    writeLines(
      doc,
      cursor,
      wrap(doc, slugline.toUpperCase(), MEASURE),
      PAGE.margin,
      SLUGLINE.lineHeight,
    );
  }
}

function drawPageNumbers(doc: jsPDF): void {
  const pages = doc.getNumberOfPages();
  if (pages === 1) {
    return;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PAGE_NUMBER.size);
  doc.setTextColor(...MUTED);
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.text(
      `${String(page)} / ${String(pages)}`,
      PAGE.width - PAGE.margin,
      PAGE.height - PAGE_NUMBER.bottomOffset,
      { align: 'right', baseline: 'top' },
    );
  }
}

export interface SceneExport {
  scene: Scene;
  shots: Shot[];
  /** Where the scene sits, e.g. "The Long Winter · Episode 1 — The bell at dawn". */
  context: string;
}

/** Writes the scene out as a sheet and hands it to the browser to save. */
export async function exportScenePdf({ scene, shots, context }: SceneExport): Promise<void> {
  // Loaded on demand: the PDF library is far larger than the app itself.
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: [PAGE.width, PAGE.height] });
  const cursor: Cursor = { y: PAGE.margin };

  drawTitle(doc, cursor, scene, context);

  if (scene.charactersPresent.trim() !== '') {
    sectionHeading(doc, cursor, 'Characters present');
    field(doc, cursor, 'Names', scene.charactersPresent);
  }

  if ([scene.setting, scene.action, scene.mood].some((value) => value.trim() !== '')) {
    sectionHeading(doc, cursor, 'Visual description');
    field(doc, cursor, 'Setting', scene.setting);
    field(doc, cursor, 'Action', scene.action);
    field(doc, cursor, 'Mood / style', scene.mood);
  }

  if (shots.length > 0) {
    sectionHeading(doc, cursor, 'Shot breakdown');
    await drawShots(doc, cursor, shots);
  }

  if ([scene.sfx, scene.music].some((value) => value.trim() !== '')) {
    sectionHeading(doc, cursor, 'Sound');
    field(doc, cursor, 'SFX', scene.sfx);
    field(doc, cursor, 'Music / OST', scene.music);
  }

  if (
    [scene.newIdentities, scene.reusedAssets, scene.continuity].some((value) => value.trim() !== '')
  ) {
    sectionHeading(doc, cursor, 'Production notes');
    field(doc, cursor, 'New identities needed', scene.newIdentities);
    field(doc, cursor, 'Reused assets', scene.reusedAssets);
    field(doc, cursor, 'Continuity', scene.continuity);
  }

  drawPageNumbers(doc);
  doc.save(pdfFileName(scene.sceneCode || scene.title, 'Untitled scene'));
}
