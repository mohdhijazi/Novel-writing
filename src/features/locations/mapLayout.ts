import type { LocationSide } from './types';

/** The map area is a fixed logical size; narrow screens scroll it. */
export const MAP_WIDTH = 1200;
export const MAP_HEIGHT = 700;
export const SQUARE_SIZE = 120;

const SPACING = 20;
const COLUMNS = Math.floor(MAP_WIDTH / (SQUARE_SIZE + SPACING));

/** Keeps a square inside the map, on whole pixels — browser zoom yields fractions. */
export function clampToMap(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.round(Math.min(Math.max(x, 0), MAP_WIDTH - SQUARE_SIZE)),
    y: Math.round(Math.min(Math.max(y, 0), MAP_HEIGHT - SQUARE_SIZE)),
  };
}

/** Lays new squares out in a grid so they never land on top of each other. */
export function positionForNewLocation(existingCount: number): { x: number; y: number } {
  const column = existingCount % COLUMNS;
  const row = Math.floor(existingCount / COLUMNS);
  return clampToMap(
    SPACING + column * (SQUARE_SIZE + SPACING),
    SPACING + row * (SQUARE_SIZE + SPACING),
  );
}

export interface Point {
  x: number;
  y: number;
}

/** Where a connection meets a square, in map coordinates. */
export function anchorFor(location: Point, side: LocationSide): Point {
  const half = SQUARE_SIZE / 2;
  switch (side) {
    case 'top':
      return { x: location.x + half, y: location.y };
    case 'bottom':
      return { x: location.x + half, y: location.y + SQUARE_SIZE };
    case 'left':
      return { x: location.x, y: location.y + half };
    case 'right':
      return { x: location.x + SQUARE_SIZE, y: location.y + half };
  }
}

/**
 * The side of the square at `target` that faces `source`, so a line always
 * lands on the near edge. `target` is the square's top-left corner.
 */
export function sideFacing(source: Point, target: Point): LocationSide {
  const dx = source.x - (target.x + SQUARE_SIZE / 2);
  const dy = source.y - (target.y + SQUARE_SIZE / 2);
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dy >= 0 ? 'bottom' : 'top';
}
