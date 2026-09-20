/**
 * Turns a file the user picked into the picture the app stores.
 *
 * Pictures are kept in IndexedDB and copied to Drive, so a 6 MB photo straight
 * from a phone would cost storage on both and slow every sync. Each one is
 * scaled to fit a sensible box and re-encoded as JPEG, which is small, quick to
 * decode and understood everywhere.
 */

/** Longest side of a stored picture, in pixels. */
const MAX_EDGE = 1400;
const QUALITY = 0.85;

const IMAGE_MIME_TYPE = 'image/jpeg';
export const IMAGE_EXTENSION = 'jpg';

/** Above this, the file is refused rather than spending a minute decoding it. */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export class ImageRejected extends Error {}

export async function prepareImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new ImageRejected('That file is not a picture.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageRejected('That picture is larger than 25 MB.');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageRejected('That picture could not be read. Try a JPEG or PNG.');
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context === null) {
    bitmap.close();
    throw new ImageRejected('That picture could not be read.');
  }
  // JPEG has no transparency, so anything see-through would come out black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encoded = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, IMAGE_MIME_TYPE, QUALITY);
  });
  if (encoded === null) {
    throw new ImageRejected('That picture could not be read.');
  }

  // A small JPEG can come out of the encoder larger than it went in; when
  // nothing was resized, the original is the better copy to keep.
  if (scale === 1 && file.type === IMAGE_MIME_TYPE && file.size <= encoded.size) {
    return file;
  }
  return encoded;
}
