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
