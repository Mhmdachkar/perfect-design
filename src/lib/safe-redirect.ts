const DEFAULT_REDIRECT = "/dashboard";

/** Allow only same-app relative paths (no protocol-relative or external URLs). */
export function sanitizeRedirectPath(raw: string | undefined | null): string {
  if (!raw || typeof raw !== "string") return DEFAULT_REDIRECT;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return DEFAULT_REDIRECT;
  if (trimmed.includes("://")) return DEFAULT_REDIRECT;
  return trimmed;
}
