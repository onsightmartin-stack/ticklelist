import { useEffect, useState } from "react";

import {
  DEFINITIONS_EVENT,
  defaultDefinitions,
  getDefinitions,
  readStoredDefinitions,
  reloadPresets,
  setDefinitions,
  type Definitions,
} from "@/lib/definitions";

/**
 * The member's chosen challenge definitions (country list, Seven Summits).
 * Starts from the defaults so SSR matches, then hydrates from storage.
 */
export const useDefinitions = (): [Definitions, (next: Partial<Definitions>) => void] => {
  const [defs, setDefs] = useState<Definitions>(defaultDefinitions);

  useEffect(() => {
    const sync = () => setDefs(getDefinitions());
    reloadPresets();
    setDefinitions(readStoredDefinitions());
    sync();
    window.addEventListener(DEFINITIONS_EVENT, sync);
    return () => window.removeEventListener(DEFINITIONS_EVENT, sync);
  }, []);

  return [defs, setDefinitions];
};
