import { useEffect, useRef, useState, type RefObject } from 'react';

import { anchorFor, type MapSide, type Point } from './geometry';

interface ConnectionDragOptions {
  mapRef: RefObject<HTMLDivElement | null>;
  size: number;
  /** Called when a drag from a card's handle ends on another card. */
  onConnect: (from: { id: string; side: MapSide }, toId: string) => void;
}

/**
 * Drags a line from a card's + handle onto another card. Cards are found by
 * their `data-node-id` attribute, so the drop target is whatever sits under the
 * pointer when it is released.
 */
export function useConnectionDrag({ mapRef, size, onConnect }: ConnectionDragOptions) {
  const startedRef = useRef<{ fromId: string; fromSide: MapSide } | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [preview, setPreview] = useState<{ from: Point; to: Point } | null>(null);

  // A drag that outlives this screen would leave listeners behind.
  useEffect(() => () => stopRef.current?.(), []);

  function startConnection(nodeId: string, side: MapSide, position: Point) {
    startedRef.current = { fromId: nodeId, fromSide: side };
    const anchor = anchorFor(position, side, size);
    setPreview({ from: anchor, to: anchor });

    function handleMove(event: PointerEvent) {
      const bounds = mapRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }
      const to = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      setPreview((current) => (current ? { from: current.from, to } : current));
    }

    function stop() {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      stopRef.current = null;
    }

    function handleUp(event: PointerEvent) {
      stop();
      const started = startedRef.current;
      startedRef.current = null;
      setPreview(null);
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-node-id]');
      const toId = target?.dataset.nodeId;
      if (started && toId !== undefined && toId !== started.fromId) {
        onConnect({ id: started.fromId, side: started.fromSide }, toId);
      }
    }

    stopRef.current = stop;
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }

  return { preview, startConnection };
}
