/** Default timeout before treating a write as too slow and queueing locally. */
export const WRITE_TIMEOUT_MS = 15_000;

type NetworkListener = (online: boolean) => void;

const listeners = new Set<NetworkListener>();

function emit(online: boolean) {
  listeners.forEach((listener) => listener(online));
}

let initialized = false;

export function initNetworkListeners() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("online", () => emit(true));
  window.addEventListener("offline", () => emit(false));
}

export function isBrowserOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function subscribeNetworkStatus(listener: NetworkListener) {
  initNetworkListeners();
  listeners.add(listener);
  listener(isBrowserOnline());
  return () => listeners.delete(listener);
}

export function isRetryableNetworkError(err: unknown): boolean {
  if (!isBrowserOnline()) return true;
  if (err instanceof TypeError) return true;
  if (err instanceof DOMException && err.name === "AbortError") return true;

  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("failed to fetch") ||
    message.includes("load failed") ||
    message.includes("networkerror")
  );
}

export async function raceWithTimeout<T>(promise: Promise<T>, timeoutMs = WRITE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Request timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
