/** The sections of a world. The slug is the part that appears in the URL. */
export const WORLD_TABS = [
  { slug: 'novels', label: 'Novels' },
  { slug: 'characters', label: 'Characters' },
  { slug: 'locations', label: 'Locations' },
  { slug: 'calendar', label: 'Calendar' },
  { slug: 'events', label: 'Events' },
  { slug: 'ideas', label: 'Ideas' },
  { slug: 'links', label: 'Links' },
] as const;

export type WorldTabSlug = (typeof WORLD_TABS)[number]['slug'];

export const DEFAULT_WORLD_TAB: WorldTabSlug = 'novels';

export function findWorldTab(slug: string | undefined) {
  return WORLD_TABS.find((tab) => tab.slug === slug);
}
