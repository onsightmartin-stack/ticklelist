const STORAGE_KEY = "sc:recent-peaks";
const MAX_RECENT = 6;

/** Reads the recently used peak keys (most recent first). SSR-safe. */
export const getRecentPeakKeys = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_RECENT);
  } catch {
    return [];
  }
};

/** Pushes a peak key to the front of the recents list. */
export const rememberPeakKey = (key: string): string[] => {
  if (typeof window === "undefined" || !key) return [];
  const next = [key, ...getRecentPeakKeys().filter((k) => k !== key)].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — recents are a convenience only */
  }
  return next;
};

export const clearRecentPeakKeys = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};
