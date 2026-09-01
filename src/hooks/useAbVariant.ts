import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Lightweight, client-side A/B test harness.
 *
 * Assigns a visitor to one of `variants` (default ["A", "B"]) the first time
 * they hit a test, persists the choice in localStorage so they stay in the
 * same bucket on return visits, and fires a single `ab_exposure` GA4 event
 * tagged with the test name and chosen variant so conversions can be
 * compared in GA4.
 *
 * Renders the first variant on the server and first client paint (so there
 * is no hydration mismatch), then resolves the real bucket in an effect.
 */
const PREFIX = "om_ab_";

export function useAbVariant(test: string, variants: string[] = ["A", "B"]): string {
  const [variant, setVariant] = useState(variants[0]!);

  useEffect(() => {
    let v = variants[0]!;
    try {
      const stored = localStorage.getItem(PREFIX + test);
      if (stored && variants.includes(stored)) {
        v = stored;
      } else {
        v = variants[Math.floor(Math.random() * variants.length)]!;
        localStorage.setItem(PREFIX + test, v);
      }
    } catch {
      /* localStorage blocked — keep the default variant */
    }
    setVariant(v);
    trackEvent("ab_exposure", { test, variant: v });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test]);

  return variant;
}
