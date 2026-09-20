/**
 * The sections of a world. The slug is the part that appears in the URL.
 * `separated` pushes a tab to the far end of the row, away from the content
 * tabs — the calendar configures the world rather than holding entries.
 */
export const WORLD_TABS = [
  { slug: 'novels', label: 'Novels' },
  { slug: 'films', label: 'Films' },
  { slug: 'characters', label: 'Characters' },
  { slug: 'locations', label: 'Locations' },
  { slug: 'events', label: 'Events' },
  { slug: 'ideas', label: 'Ideas' },
  { slug: 'relations', label: 'Relations' },
  { slug: 'calendar', label: 'Calendar', separated: true },
] as const;

export type WorldTabSlug = (typeof WORLD_TABS)[number]['slug'];

export const DEFAULT_WORLD_TAB: WorldTabSlug = 'novels';

export function findWorldTab(slug: string | undefined) {
  return WORLD_TABS.find((tab) => tab.slug === slug);
}
