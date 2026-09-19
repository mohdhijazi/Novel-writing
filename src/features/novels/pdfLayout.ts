/**
 * Page design for an exported novel, measured from the reference book:
 * EB Garamond, justified body with an indented first line, centred bold
 * chapter headings, and a page number in the bottom-right corner.
 *
 * Type sizes stay the same on every paper size — a novel is set at the same
 * size whatever it is printed on; only the page and its margins change.
 */

const MM = 72 / 25.4;
const INCH = 72;

export interface PaperSize {
  id: string;
  label: string;
  width: number;
  height: number;
}

/** The reference book's size, and the default. */
const A5: PaperSize = { id: 'a5', label: 'A5 — 148 × 210 mm', width: 148 * MM, height: 210 * MM };

/** Trim sizes novels are actually printed at, plus A4 for reading on screen. */
export const PAPER_SIZES: PaperSize[] = [
  A5,
  { id: 'b-format', label: 'B-format paperback — 129 × 198 mm', width: 129 * MM, height: 198 * MM },
  { id: 'a-format', label: 'A-format paperback — 110 × 178 mm', width: 110 * MM, height: 178 * MM },
  { id: 'demy', label: 'Demy — 135 × 216 mm', width: 135 * MM, height: 216 * MM },
  { id: 'royal', label: 'Royal — 156 × 234 mm', width: 156 * MM, height: 234 * MM },
  { id: 'us-trade', label: 'US trade — 6 × 9 in', width: 6 * INCH, height: 9 * INCH },
  { id: 'digest', label: 'Digest — 5.5 × 8.5 in', width: 5.5 * INCH, height: 8.5 * INCH },
  {
    id: 'mass-market',
    label: 'Mass market — 4.25 × 6.87 in',
    width: 4.25 * INCH,
    height: 6.87 * INCH,
  },
  { id: 'a4', label: 'A4 — 210 × 297 mm', width: 210 * MM, height: 297 * MM },
];

export const DEFAULT_PAPER_SIZE = A5;

/** Share of the page width left as a margin, taken from the reference book. */
const MARGIN_RATIO = 0.15;
/**
 * Lines longer than this are tiring to read, so a wide page gets wider margins
 * rather than a wider measure.
 */
const MAX_MEASURE = 340;

export interface Layout {
  width: number;
  height: number;
  margin: number;
  /** Width of the text block. */
  measure: number;
  /** Lowest baseline a line of body text may sit on. */
  textBottom: number;
}

export function layoutFor(paper: PaperSize): Layout {
  const margin = Math.max(paper.width * MARGIN_RATIO, (paper.width - MAX_MEASURE) / 2);
  return {
    width: paper.width,
    height: paper.height,
    margin,
    measure: paper.width - margin * 2,
    textBottom: paper.height - margin,
  };
}

export const BODY = {
  size: 11,
  lineHeight: 16,
  /** First line of each paragraph, in points. */
  indent: 18,
  /** Extra space between paragraphs. */
  spacing: 6,
};

export const HEADING = {
  size: 13,
  /** Between "Chapter I:" and the chapter's title. */
  gap: 22,
  /** Between the title and the first paragraph. */
  spaceBelow: 26,
  /** How far down a chapter's opening page the heading starts. */
  topOffset: 48,
};

export const TITLE_PAGE = {
  size: 24,
  /** How far down the page the title sits, as a share of the page height. */
  position: 0.38,
};

/**
 * A line is only stretched to the full measure when it already fills most of
 * it. Short lines — dialogue, a line break inside a paragraph — stay as they
 * are rather than being pulled apart.
 */
export const MIN_JUSTIFY_RATIO = 0.75;

export const PAGE_NUMBER = {
  size: 10,
  /** Baseline measured up from the bottom of the page. */
  bottomOffset: 40,
};

const ROMAN: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/** Chapter numbers are set as Roman numerals, as in the reference book. */
export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value <= 0) {
    return String(value);
  }
  let remaining = value;
  let roman = '';
  for (const [amount, numeral] of ROMAN) {
    while (remaining >= amount) {
      roman += numeral;
      remaining -= amount;
    }
  }
  return roman;
}

/** A file name that every operating system will accept. */
export function pdfFileName(title: string): string {
  const safe = title.replace(/[\\/:*?"<>|]/g, ' ').trim();
  return `${safe === '' ? 'Untitled novel' : safe}.pdf`;
}
