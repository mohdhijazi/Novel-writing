import type { jsPDF } from 'jspdf';

import { listChapters } from './chaptersRepository';
import { listParagraphs } from './paragraphsRepository';
import {
  BODY,
  HEADING,
  PAGE,
  PAGE_NUMBER,
  TEXT_BOTTOM,
  TEXT_WIDTH,
  pdfFileName,
  toRoman,
} from './pdfLayout';
import type { Novel } from './types';

const FONT_FILE = 'EBGaramond.ttf';
const FONT_NAME = 'EBGaramond';

/** Fetched once per session; the file is only needed when exporting. */
let fontPromise: Promise<string | null> | null = null;

async function loadFontBase64(): Promise<string | null> {
  fontPromise ??= (async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}fonts/${FONT_FILE}`);
      if (!response.ok) {
        return null;
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = '';
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return btoa(binary);
    } catch {
      return null;
    }
  })();
  return fontPromise;
}

/**
 * Registers EB Garamond, the reference book's typeface. Falls back to the
 * built-in serif when the font cannot be fetched — offline, say — so an export
 * never fails for want of it.
 */
async function registerBookFont(doc: jsPDF): Promise<string> {
  const base64 = await loadFontBase64();
  if (base64 === null) {
    return 'times';
  }
  doc.addFileToVFS(FONT_FILE, base64);
  doc.addFont(FONT_FILE, FONT_NAME, 'normal');
  return FONT_NAME;
}

/**
 * Draws one line stretched to the full measure, by widening the gaps between
 * words. Used for every line of a paragraph except the last.
 */
function drawJustified(doc: jsPDF, line: string, x: number, y: number, width: number): void {
  const words = line.split(' ').filter((word) => word !== '');
  if (words.length < 2) {
    doc.text(line, x, y);
    return;
  }
  const wordsWidth = words.reduce((total, word) => total + doc.getTextWidth(word), 0);
  const gap = (width - wordsWidth) / (words.length - 1);
  let cursor = x;
  for (const word of words) {
    doc.text(word, cursor, y);
    cursor += doc.getTextWidth(word) + gap;
  }
}

interface Cursor {
  y: number;
}

function newPage(doc: jsPDF, cursor: Cursor): void {
  doc.addPage();
  cursor.y = PAGE.margin + BODY.lineHeight;
}

function drawParagraph(doc: jsPDF, text: string, cursor: Cursor): void {
  const trimmed = text.trim();
  if (trimmed === '') {
    return;
  }
  // The first line is shorter, to leave room for the indent.
  const [firstLine = ''] = doc.splitTextToSize(trimmed, TEXT_WIDTH - BODY.indent) as string[];
  const rest = trimmed.slice(firstLine.length).trim();
  const restLines = rest === '' ? [] : (doc.splitTextToSize(rest, TEXT_WIDTH) as string[]);
  const lines = [firstLine, ...restLines];

  for (const [index, line] of lines.entries()) {
    if (cursor.y > TEXT_BOTTOM) {
      newPage(doc, cursor);
    }
    const isFirst = index === 0;
    const isLast = index === lines.length - 1;
    const x = PAGE.margin + (isFirst ? BODY.indent : 0);
    const width = TEXT_WIDTH - (isFirst ? BODY.indent : 0);
    if (isLast) {
      doc.text(line, x, cursor.y);
    } else {
      drawJustified(doc, line, x, cursor.y, width);
    }
    cursor.y += BODY.lineHeight;
  }
  cursor.y += BODY.spacing;
}

function drawChapterHeading(doc: jsPDF, font: string, number: number, title: string): void {
  const centre = PAGE.width / 2;
  // The reference book sets headings bold; the variable font ships one weight,
  // so they are drawn with a light outline to carry the same weight on paper.
  doc.setFont(font, 'normal');
  doc.setFontSize(HEADING.size);
  doc.setLineWidth(0.4);
  doc.text(`Chapter ${toRoman(number)}:`, centre, PAGE.margin + HEADING.topOffset, {
    align: 'center',
    renderingMode: 'fillThenStroke',
  });
  if (title.trim() !== '') {
    doc.text(title, centre, PAGE.margin + HEADING.topOffset + HEADING.gap, {
      align: 'center',
      renderingMode: 'fillThenStroke',
      maxWidth: TEXT_WIDTH,
    });
  }
  doc.setLineWidth(0);
  doc.setFontSize(BODY.size);
}

function drawPageNumbers(doc: jsPDF): void {
  const pages = doc.getNumberOfPages();
  doc.setFontSize(PAGE_NUMBER.size);
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.text(String(page), PAGE.width - PAGE.margin, PAGE.height - PAGE_NUMBER.bottomOffset, {
      align: 'right',
    });
  }
}

/**
 * Writes the novel out as a PDF in the reference book's style and hands it to
 * the browser to save. Returns how many chapters were written.
 */
export async function exportNovelPdf(novel: Novel): Promise<number> {
  // Loaded on demand: the PDF library is far larger than the app itself.
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: [PAGE.width, PAGE.height] });
  const font = await registerBookFont(doc);
  doc.setFont(font, 'normal');
  doc.setFontSize(BODY.size);

  const chapters = await listChapters(novel.id);
  const cursor: Cursor = { y: 0 };

  for (const [index, chapter] of chapters.entries()) {
    if (index > 0) {
      doc.addPage();
    }
    drawChapterHeading(doc, font, chapter.number, chapter.title);
    cursor.y = PAGE.margin + HEADING.topOffset + HEADING.gap + HEADING.spaceBelow;

    for (const paragraph of await listParagraphs(chapter.id)) {
      drawParagraph(doc, paragraph.text, cursor);
    }
  }

  drawPageNumbers(doc);
  doc.save(pdfFileName(novel.title));
  return chapters.length;
}
