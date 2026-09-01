import { useCallback, useEffect, useState } from "react";

const PREFIX = "onsight-view:";

/**
 * Remembers a per-device view preference (e.g. compact vs detailed lists).
 * Starts from the default so SSR markup matches, then hydrates from storage.
 */
export function useViewPref(
  key: string,
  defaultValue: boolean,
): [boolean, (next: boolean | ((current: boolean) => boolean)) => void] {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PREFIX + key);
      if (stored === "1" || stored === "0") setValue(stored === "1");
    } catch {
      /* storage unavailable */
    }
  }, [key]);

  const update = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      setValue((current) => {
        const resolved = typeof next === "function" ? next(current) : next;
        try {
          window.localStorage.setItem(PREFIX + key, resolved ? "1" : "0");
        } catch {
          /* storage unavailable */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update];
}
