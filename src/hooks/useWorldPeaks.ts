import { useEffect, useState } from "react";

import { loadWorldPeaks, onWorldPeaksLoaded, worldPeaksLoaded } from "@/lib/peak-catalog";

/**
 * Lazily pull the ~6,000-peak world dataset into the catalog and re-render
 * once it lands. Returns a token to include in search memo dependencies.
 */
export const useWorldPeaks = (): number => {
  const [version, setVersion] = useState(() => (worldPeaksLoaded() ? 1 : 0));

  useEffect(() => {
    if (worldPeaksLoaded()) {
      setVersion(1);
      return;
    }
    const off = onWorldPeaksLoaded(() => setVersion((v) => v + 1));
    void loadWorldPeaks();
    return off;
  }, []);

  return version;
};
