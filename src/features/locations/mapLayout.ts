import { positionForNewCard, type MapBounds, type Point } from '@/lib/map/geometry';

/** The map area is a fixed logical size; narrow screens scroll it. */
export const MAP_WIDTH = 1200;
export const MAP_HEIGHT = 700;
export const SQUARE_SIZE = 120;
export const MAP_BOUNDS: MapBounds = { width: MAP_WIDTH, height: MAP_HEIGHT };

const SPACING = 20;

export function positionForNewLocation(existingCount: number): Point {
  return positionForNewCard(MAP_BOUNDS, SQUARE_SIZE, SPACING, existingCount);
}
