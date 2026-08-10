/**
 * Client-side image helpers.
 *
 * The store is localStorage, which holds roughly 5 MB for the whole origin, so
 * a 4 MB photo cannot go in as-is. Everything attached to a complaint is
 * downscaled to a JPEG data URL first: large enough to be a recognisable piece
 * of evidence on the officer's screen, small enough that a demo with a dozen
 * complaints still fits.
 *
 * When the real backend exists, the original `File` goes up as multipart to
 * POST /api/complaints and this downscale becomes a thumbnail step only.
 */

const MAX_EDGE = 1024;
const QUALITY = 0.72;

/**
 * Read a file into a downscaled JPEG data URL.
 *
 * Resolves to `null` rather than rejecting when the browser cannot decode the
 * file — a complaint that submits without its photo is a better outcome than a
 * submission that fails on an unreadable image.
 */
export function toStorableDataUrl(file, { maxEdge = MAX_EDGE, quality = QUALITY } = {}) {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    image.src = url;
  });
}

/** Human file size — "2.4 MB". */
export function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
