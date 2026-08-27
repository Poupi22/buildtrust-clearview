/**
 * Storage-safe filename helpers.
 * Storage keys reject non-ASCII characters (e.g. French accents like é, è, ç),
 * so every filename must be normalized before building an upload path.
 */

/** Strip accents/diacritics and any character outside [a-zA-Z0-9._-]. */
export function sanitizeFileName(name: string, maxLength = 80): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return (cleaned || "file").slice(-maxLength);
}

/** Safe file extension (lowercase, ASCII only), defaults to "bin". */
export function safeFileExt(name: string): string {
  const ext = name.split(".").pop() ?? "";
  const cleaned = ext
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  return cleaned || "bin";
}
