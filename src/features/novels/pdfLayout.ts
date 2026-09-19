/**
 * Page design for an exported novel, measured from the reference book:
 * A5 pages, EB Garamond, justified body with an indented first line, centred
 * bold chapter headings, and a page number in the bottom-right corner.
 */
export const PAGE = {
  /** A5 in points, the size the reference PDF uses. */
  width: 419.53,
  height: 595.28,
  margin: 63,
};

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

export const TEXT_WIDTH = PAGE.width - PAGE.margin * 2;
export const TEXT_BOTTOM = PAGE.height - PAGE.margin;

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
