export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-()+\s]/g, "_").slice(0, 180);
}

export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return "File exceeds 50 MB limit";
  if (file.type && !ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
    return "File type not allowed";
  }
  return null;
}
