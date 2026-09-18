import { positionForNewCard, type MapBounds, type Point } from '@/lib/map/geometry';

/** The board is a fixed logical size; narrow screens scroll it. */
export const BOARD_WIDTH = 1200;
export const BOARD_HEIGHT = 700;
export const TICKET_SIZE = 130;
export const BOARD_BOUNDS: MapBounds = { width: BOARD_WIDTH, height: BOARD_HEIGHT };

const SPACING = 24;

export function positionForNewTicket(existingCount: number): Point {
  return positionForNewCard(BOARD_BOUNDS, TICKET_SIZE, SPACING, existingCount);
}
