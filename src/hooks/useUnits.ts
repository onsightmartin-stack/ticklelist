import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { unitsForCountry, unitsForLocale, type UnitSystem } from "@/lib/units";

const STORAGE_KEY = "tl:units";
const EVENT = "tl:units-changed";

const readStored = (): UnitSystem | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "metric" || stored === "imperial" ? stored : null;
};

/**
 * Altitude units for the current member: a manual choice wins, then their
 * profile country, then the browser locale, defaulting to metres. Detection
 * runs after hydration so SSR and the first client render agree.
 */
export const useUnits = (): UnitSystem => {
  const { profile } = useAuth();
  const [units, setUnits] = useState<UnitSystem>("metric");

  const country = (profile as { country?: string | null } | null)?.country ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const resolve = () => {
      const stored = readStored();
      setUnits(stored ?? unitsForCountry(country) ?? unitsForLocale(navigator.language));
    };
    resolve();
    window.addEventListener(EVENT, resolve);
    return () => window.removeEventListener(EVENT, resolve);
  }, [country]);

  return units;
};

/** The explicit override, if the member picked one. */
export const useUnitsPreference = (): UnitSystem | null => {
  const [pref, setPref] = useState<UnitSystem | null>(null);
  useEffect(() => {
    const resolve = () => setPref(readStored());
    resolve();
    window.addEventListener(EVENT, resolve);
    return () => window.removeEventListener(EVENT, resolve);
  }, []);
  return pref;
};

/** Manual override used by the settings toggle. */
export const setStoredUnits = (units: UnitSystem | null) => {
  if (typeof window === "undefined") return;
  if (units) window.localStorage.setItem(STORAGE_KEY, units);
  else window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT));
};
