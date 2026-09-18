/** Shared geometry for the board-style screens: the location map and relations. */

export interface Point {
  x: number;
  y: number;
}

export interface MapBounds {
  width: number;
  height: number;
}

/** Which edge of a card a line leaves from or arrives at. */
export type MapSide = 'top' | 'right' | 'bottom' | 'left';

export const MAP_SIDES: MapSide[] = ['top', 'right', 'bottom', 'left'];

/** Keeps a card inside the board, on whole pixels — browser zoom yields fractions. */
export function clampToBounds(bounds: MapBounds, size: number, x: number, y: number): Point {
  return {
    x: Math.round(Math.min(Math.max(x, 0), bounds.width - size)),
    y: Math.round(Math.min(Math.max(y, 0), bounds.height - size)),
  };
}

/** Where a line meets a card, in board coordinates. */
export function anchorFor(position: Point, side: MapSide, size: number): Point {
  const half = size / 2;
  switch (side) {
    case 'top':
      return { x: position.x + half, y: position.y };
    case 'bottom':
      return { x: position.x + half, y: position.y + size };
    case 'left':
      return { x: position.x, y: position.y + half };
    case 'right':
      return { x: position.x + size, y: position.y + half };
  }
}

/**
 * The side of the card at `target` that faces `source`, so a line always lands
 * on the near edge. `target` is the card's top-left corner.
 */
export function sideFacing(source: Point, target: Point, size: number): MapSide {
  const dx = source.x - (target.x + size / 2);
  const dy = source.y - (target.y + size / 2);
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dy >= 0 ? 'bottom' : 'top';
}

/** Lays new cards out in a grid so they never land on top of each other. */
export function positionForNewCard(
  bounds: MapBounds,
  size: number,
  spacing: number,
  existingCount: number,
): Point {
  const columns = Math.max(1, Math.floor(bounds.width / (size + spacing)));
  const column = existingCount % columns;
  const row = Math.floor(existingCount / columns);
  return clampToBounds(
    bounds,
    size,
    spacing + column * (size + spacing),
    spacing + row * (size + spacing),
  );
}
