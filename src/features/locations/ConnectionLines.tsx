import styles from './ConnectionLines.module.css';
import { MAP_HEIGHT, MAP_WIDTH, anchorFor, sideFacing, type Point } from './mapLayout';
import type { Connection, Location } from './types';

interface ConnectionLinesProps {
  connections: Connection[];
  locationsById: Map<string, Location>;
  /** The line being dragged from a + handle, if any. */
  preview: { from: Point; to: Point } | null;
}

export function ConnectionLines({ connections, locationsById, preview }: ConnectionLinesProps) {
  return (
    <svg
      className={styles.overlay}
      width={MAP_WIDTH}
      height={MAP_HEIGHT}
      viewBox={`0 0 ${String(MAP_WIDTH)} ${String(MAP_HEIGHT)}`}
      aria-hidden="true"
    >
      {connections.map((connection) => {
        const from = locationsById.get(connection.fromId);
        const to = locationsById.get(connection.toId);
        if (!from || !to) {
          return null;
        }
        const start = anchorFor(from, connection.fromSide);
        const end = anchorFor(to, sideFacing(start, to));
        return (
          <line
            key={connection.id}
            className={styles.line}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
          />
        );
      })}

      {preview && (
        <line
          className={styles.preview}
          x1={preview.from.x}
          y1={preview.from.y}
          x2={preview.to.x}
          y2={preview.to.y}
        />
      )}
    </svg>
  );
}
