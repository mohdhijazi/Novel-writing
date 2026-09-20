/** A file name that every operating system will accept. */
export function pdfFileName(title: string, fallback = 'Untitled'): string {
  const safe = title.replace(/[\\/:*?"<>|]/g, ' ').trim();
  return `${safe === '' ? fallback : safe}.pdf`;
}
