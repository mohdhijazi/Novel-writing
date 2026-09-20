import type { jsPDF } from 'jspdf';

import { pdfFileName } from '@/lib/pdf/pdfFileName';

import { listParagraphs } from './paragraphsRepository';
import {
  BODY,
  HEADING,
  MIN_JUSTIFY_RATIO,
  PAGE_NUMBER,
  TITLE_PAGE,
  layoutFor,
  toRoman,
  type Layout,
  type PaperSize,
} from './pdfLayout';
import type { Chapter, Novel } from './types';

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
 * Draws one line stretched to the full measure by widening the gaps between
 * words — but only when the line nearly fills the measure already. A line that
 * ends early, as dialogue does, is left alone.
 */
function drawLine(doc: jsPDF, line: string, x: number, y: number, width: number): void {
  const words = line.split(' ').filter((word) => word !== '');
  if (words.length < 2 || doc.getTextWidth(line) < width * MIN_JUSTIFY_RATIO) {
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

function drawBlock(doc: jsPDF, layout: Layout, text: string, cursor: Cursor): void {
  // The first line is shorter, to leave room for the indent.
  const [firstLine = ''] = doc.splitTextToSize(text, layout.measure - BODY.indent) as string[];
  const rest = text.slice(firstLine.length).trim();
  const restLines = rest === '' ? [] : (doc.splitTextToSize(rest, layout.measure) as string[]);
  const lines = [firstLine, ...restLines];

  for (const [index, line] of lines.entries()) {
    if (cursor.y > layout.textBottom) {
      doc.addPage();
      cursor.y = layout.margin + BODY.lineHeight;
    }
    const isFirst = index === 0;
    const isLast = index === lines.length - 1;
    const x = layout.margin + (isFirst ? BODY.indent : 0);
    const width = layout.measure - (isFirst ? BODY.indent : 0);
    if (isLast) {
      doc.text(line, x, cursor.y);
    } else {
      drawLine(doc, line, x, cursor.y, width);
    }
    cursor.y += BODY.lineHeight;
  }
  cursor.y += BODY.spacing;
}

/**
 * A paragraph the writer broke into several lines — dialogue, most often — is
 * set as separate indented paragraphs, the way a book would.
 */
function drawParagraph(doc: jsPDF, layout: Layout, text: string, cursor: Cursor): void {
  for (const block of text.split(/\r?\n/)) {
    const trimmed = block.trim();
    if (trimmed !== '') {
      drawBlock(doc, layout, trimmed, cursor);
    }
  }
}

function drawTitlePage(doc: jsPDF, layout: Layout, title: string): void {
  doc.setFontSize(TITLE_PAGE.size);
  doc.setLineWidth(0.5);
  doc.text(title, layout.width / 2, layout.height * TITLE_PAGE.position, {
    align: 'center',
    renderingMode: 'fillThenStroke',
    maxWidth: layout.measure,
  });
  doc.setLineWidth(0);
  doc.setFontSize(BODY.size);
}

function drawChapterHeading(doc: jsPDF, layout: Layout, number: number, title: string): void {
  const centre = layout.width / 2;
  // The reference book sets headings bold; the variable font ships one weight,
  // so they are drawn with a light outline to carry the same weight on paper.
  doc.setFontSize(HEADING.size);
  doc.setLineWidth(0.4);
  doc.text(`Chapter ${toRoman(number)}:`, centre, layout.margin + HEADING.topOffset, {
    align: 'center',
    renderingMode: 'fillThenStroke',
  });
  if (title.trim() !== '') {
    doc.text(title, centre, layout.margin + HEADING.topOffset + HEADING.gap, {
      align: 'center',
      renderingMode: 'fillThenStroke',
      maxWidth: layout.measure,
    });
  }
  doc.setLineWidth(0);
  doc.setFontSize(BODY.size);
}

/** A title page counts as page one of the book but carries no number. */
function drawPageNumbers(doc: jsPDF, layout: Layout, firstNumbered: number): void {
  doc.setFontSize(PAGE_NUMBER.size);
  for (let page = firstNumbered; page <= doc.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    doc.text(
      String(page - firstNumbered + 1),
      layout.width - layout.margin,
      layout.height - PAGE_NUMBER.bottomOffset,
      { align: 'right' },
    );
  }
}

export interface ExportOptions {
  paper: PaperSize;
  includeTitlePage: boolean;
}

/**
 * Writes the chosen chapters out as a PDF in the reference book's style — a
 * page per chapter, optionally opening with a title page — and hands it to the
 * browser to save.
 */
export async function exportNovelPdf(
  novel: Novel,
  chapters: Chapter[],
  options: ExportOptions,
): Promise<void> {
  // Loaded on demand: the PDF library is far larger than the app itself.
  const { jsPDF } = await import('jspdf');
  const layout = layoutFor(options.paper);
  const doc = new jsPDF({ unit: 'pt', format: [layout.width, layout.height] });
  const font = await registerBookFont(doc);
  doc.setFont(font, 'normal');
  doc.setFontSize(BODY.size);

  if (options.includeTitlePage) {
    drawTitlePage(doc, layout, novel.title);
  }

  const cursor: Cursor = { y: 0 };
  for (const [index, chapter] of chapters.entries()) {
    // The first chapter uses the page already there unless a title page took it.
    if (options.includeTitlePage || index > 0) {
      doc.addPage();
    }
    drawChapterHeading(doc, layout, chapter.number, chapter.title);
    cursor.y = layout.margin + HEADING.topOffset + HEADING.gap + HEADING.spaceBelow;

    for (const paragraph of await listParagraphs(chapter.id)) {
      drawParagraph(doc, layout, paragraph.text, cursor);
    }
  }

  drawPageNumbers(doc, layout, options.includeTitlePage ? 2 : 1);
  doc.save(pdfFileName(novel.title, 'Untitled novel'));
}
