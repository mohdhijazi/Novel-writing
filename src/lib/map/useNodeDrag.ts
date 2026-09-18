import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

import { clampToBounds, type MapBounds, type Point } from './geometry';

/** Movement under this many pixels counts as a tap rather than a drag. */
const DRAG_THRESHOLD_PX = 4;

interface DragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  moved: boolean;
}

interface NodeDragOptions {
  mapRef: RefObject<HTMLDivElement | null>;
  position: Point;
  size: number;
  bounds: MapBounds;
  /** Called once, when the drag ends, with the final position. */
  onMoved: (x: number, y: number) => void;
  /** Called instead of onMoved when the pointer barely moved. */
  onTap: () => void;
}

/**
 * Drags a card around a board. The element is moved directly while dragging and
 * the position is written once on release, so a drag costs one save rather than
 * one per pointer move.
 */
export function useNodeDrag({ mapRef, position, size, bounds, onMoved, onTap }: NodeDragOptions) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const node = nodeRef.current;
    if (!node || event.button !== 0) {
      return;
    }
    const nodeBounds = node.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - nodeBounds.left,
      offsetY: event.clientY - nodeBounds.top,
      x: position.x,
      y: position.y,
      moved: false,
    };
    node.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const node = nodeRef.current;
    const map = mapRef.current;
    if (!drag || !node || !map || drag.pointerId !== event.pointerId) {
      return;
    }
    const mapBounds = map.getBoundingClientRect();
    const { x, y } = clampToBounds(
      bounds,
      size,
      event.clientX - mapBounds.left - drag.offsetX,
      event.clientY - mapBounds.top - drag.offsetY,
    );
    if (Math.abs(x - drag.x) + Math.abs(y - drag.y) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
    }
    drag.x = x;
    drag.y = y;
    node.style.left = `${String(x)}px`;
    node.style.top = `${String(y)}px`;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    if (drag.moved) {
      onMoved(drag.x, drag.y);
      return;
    }
    onTap();
  }

  return {
    nodeRef,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
