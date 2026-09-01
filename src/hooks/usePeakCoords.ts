import { useEffect, useState } from "react";
import { lookupPeakCoords, type PeakCoords } from "@/lib/peak-coords";

/** Resolve a summit's coordinates (Peakbagger first) for map links. */
export const usePeakCoords = (name: string | null | undefined) => {
  const [coords, setCoords] = useState<PeakCoords | null>(null);

  useEffect(() => {
    let alive = true;
    setCoords(null);
    if (!name) return;
    lookupPeakCoords(name).then((c) => {
      if (alive) setCoords(c);
    });
    return () => {
      alive = false;
    };
  }, [name]);

  return coords;
};
