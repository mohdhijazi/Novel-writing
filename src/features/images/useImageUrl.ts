import { useEffect, useMemo } from 'react';

/**
 * A URL for bytes held on the device. The browser keeps an object URL alive
 * until it is revoked, so each one is released as soon as the bytes change or
 * the view goes. It is made while rendering rather than in an effect, so the
 * picture is there on the first paint instead of one render later.
 */
export function useImageUrl(blob: Blob | null): string | null {
  const url = useMemo(() => (blob === null ? null : URL.createObjectURL(blob)), [blob]);

  useEffect(() => {
    if (url === null) {
      return;
    }
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}
