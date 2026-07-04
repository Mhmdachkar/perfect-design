/** Default timeout before treating a write as too slow and queueing locally. */
export const WRITE_TIMEOUT_MS = 15_000;

/** How long to treat the connection as slow after a timeout (ms). */
const DEGRADED_TTL_MS = 45_000;

type NetworkListener = (online: boolean) => void;
type ConnectionQualityListener = (poor: boolean) => void;

const listeners = new Set<NetworkListener>();
const qualityListeners = new Set<ConnectionQualityListener>();

let initialized = false;
let degradedUntil = 0;
let degradedTimer: ReturnType<typeof setTimeout> | undefined;

function emit(online: boolean) {
  listeners.forEach((listener) => listener(online));
  emitConnectionQuality();
}

function isDegradedByTimeout() {
  return Date.now() < degradedUntil;
}

/** True after a request timed out — used for offline fallbacks, not navigator heuristics. */
export function isSlowConnection() {
  return isDegradedByTimeout();
}

/** Banner visibility: offline, or a request recently timed out. */
export function shouldShowOfflineBanner() {
  return !isBrowserOnline() || isDegradedByTimeout();
}

/** @deprecated Use shouldShowOfflineBanner for UI; kept for subscribers. */
export function isPoorConnection() {
  return shouldShowOfflineBanner();
}

export function markConnectionDegraded(durationMs = DEGRADED_TTL_MS) {
  degradedUntil = Date.now() + durationMs;
  if (degradedTimer) clearTimeout(degradedTimer);
  degradedTimer = setTimeout(() => {
    degradedTimer = undefined;
    emitConnectionQuality();
  }, durationMs);
  emitConnectionQuality();
}

function emitConnectionQuality() {
  const poor = shouldShowOfflineBanner();
  qualityListeners.forEach((listener) => listener(poor));
}

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

export function subscribeConnectionQuality(listener: ConnectionQualityListener) {
  initNetworkListeners();
  qualityListeners.add(listener);
  listener(shouldShowOfflineBanner());
  return () => qualityListeners.delete(listener);
}

export function isRetryableNetworkError(err: unknown): boolean {
  if (!isBrowserOnline()) return true;
  if (isTimeoutError(err)) return true;
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

export function isTimeoutError(err: unknown) {
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return message.includes("timeout") || message.includes("timed out");
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
