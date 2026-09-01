/**
 * Tiny haptic helper for the community app-style navigation.
 *
 * Uses the Vibration API where it exists (Android/Chrome); silently does
 * nothing on iOS Safari and desktop. Patterns are deliberately short so the
 * feedback reads as a tick, not a buzz. Respects the user's motion setting —
 * someone who asked for reduced motion gets no vibration either.
 */
import { motionAllowed } from "@/lib/motion";

type Pattern = "tick" | "select" | "zoom";

const PATTERNS: Record<Pattern, number | number[]> = {
  /** Threshold armed — the swipe will commit if released now. */
  tick: 8,
  /** Page changed. */
  select: 16,
  /** Zoomed out to the dashboard grid. */
  zoom: [10, 40, 18],
};

export const haptic = (pattern: Pattern = "tick") => {
  if (typeof window === "undefined") return;
  if (!motionAllowed()) return;
  const nav = window.navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  try {
    nav.vibrate?.(PATTERNS[pattern]);
  } catch {
    /* vibration blocked — visual feedback still plays */
  }
};
