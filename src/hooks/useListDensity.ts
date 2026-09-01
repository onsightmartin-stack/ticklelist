import { useCallback, useEffect, useState } from "react";

export type ListDensity = "small" | "medium" | "large";

const PREFIX = "onsight-density:";
const VALUES: ListDensity[] = ["small", "medium", "large"];

/**
 * Per-device list density preference (small / medium / large rows).
 * Defaults to "small" for long lists (>7 items) so everything stays reachable,
 * then hydrates from localStorage after mount so SSR markup matches.
 */
export function useListDensity(
  key: string,
  itemCount: number,
): [ListDensity, (next: ListDensity) => void] {
  const fallback: ListDensity = itemCount > 7 ? "small" : "large";
  const [stored, setStored] = useState<ListDensity | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFIX + key) as ListDensity | null;
      if (raw && VALUES.includes(raw)) setStored(raw);
    } catch {
      /* storage unavailable */
    }
  }, [key]);

  const update = useCallback(
    (next: ListDensity) => {
      setStored(next);
      try {
        window.localStorage.setItem(PREFIX + key, next);
      } catch {
        /* storage unavailable */
      }
    },
    [key],
  );

  return [stored ?? fallback, update];
}
