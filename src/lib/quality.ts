/**
 * Graphics quality preference for the 3D climber avatars.
 *
 * Controls the renderer's internal resolution, whether the 3D stage backdrop
 * (sky, ground, ridge line) is drawn, and how many live WebGL canvases may run
 * at once. Saved per device — a phone and a laptop can differ.
 */
export type QualityPref = "auto" | "high" | "balanced" | "low";

export interface QualitySettings {
  /** Internal render scale — 1 = native, lower = chunkier but faster. */
  pixelScale: number;
  /** Max device pixel ratio taken into account. */
  maxDpr: number;
  /** Smooth edges (MSAA + smooth canvas scaling) instead of hard pixel steps. */
  antialias: boolean;
  /** Draw the 3D stage backdrop (sky, ground, ridge peaks). */
  backdrop: boolean;
  /** Number of ridge peaks in the backdrop. */
  ridgePeaks: number;
  /** How many live 3D avatars may share the page before falling back to flat art. */
  maxContexts: number;
}

export const QUALITY_OPTIONS: {
  id: QualityPref;
  name: string;
  description: string;
}[] = [
  {
    id: "auto",
    name: "Auto",
    description:
      "Starts from your device's capabilities, then measures the real frame rate while avatars spin and steps detail up or down to keep motion smooth.",
  },
  {
    id: "high",
    name: "High detail",
    description:
      "Full-resolution, anti-aliased avatars, full 3D stage backdrop and the most live models on screen. Best on a fast machine.",
  },
  {
    id: "balanced",
    name: "Balanced",
    description:
      "Slightly reduced resolution with smoothing and the stage backdrop kept. Smooth on most laptops and newer phones.",
  },
  {
    id: "low",
    name: "Performance",
    description:
      "Lowest resolution, no 3D backdrop and fewer live models — smoothest motion on slower or older devices.",
  },
];

const PRESETS: Record<Exclude<QualityPref, "auto">, QualitySettings> = {
  high: { pixelScale: 1, maxDpr: 2, antialias: true, backdrop: true, ridgePeaks: 8, maxContexts: 10 },
  balanced: { pixelScale: 0.75, maxDpr: 2, antialias: true, backdrop: true, ridgePeaks: 6, maxContexts: 8 },
  low: { pixelScale: 0.5, maxDpr: 1.5, antialias: false, backdrop: false, ridgePeaks: 0, maxContexts: 3 },
};

export const DEFAULT_QUALITY: QualityPref = "auto";
export const QUALITY_STORAGE_KEY = "onsight-quality";
export const QUALITY_EVENT = "onsight-quality-change";

export const isQualityPref = (value: unknown): value is QualityPref =>
  typeof value === "string" && QUALITY_OPTIONS.some((o) => o.id === value);

export const getStoredQuality = (): QualityPref => {
  if (typeof window === "undefined") return DEFAULT_QUALITY;
  try {
    const stored = window.localStorage.getItem(QUALITY_STORAGE_KEY);
    return isQualityPref(stored) ? stored : DEFAULT_QUALITY;
  } catch {
    return DEFAULT_QUALITY;
  }
};

export const setQuality = (pref: QualityPref) => {
  try {
    window.localStorage.setItem(QUALITY_STORAGE_KEY, pref);
  } catch {
    /* storage unavailable — preference still applies for this session */
  }
  window.dispatchEvent(new CustomEvent(QUALITY_EVENT, { detail: pref }));
};

/** Best guess for the current device when the preference is "auto". */
export const detectQuality = (): Exclude<QualityPref, "auto"> => {
  if (typeof window === "undefined") return "balanced";
  const nav = window.navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  if (memory <= 3 || cores <= 3) return "low";
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  if (coarse || memory <= 6 || cores <= 6) return "balanced";
  return "high";
};

export const AUTO_TIER_EVENT = "onsight-quality-auto";
const AUTO_TIER_KEY = "onsight-quality-auto-tier";

type AutoTier = Exclude<QualityPref, "auto">;
const TIER_ORDER: AutoTier[] = ["low", "balanced", "high"];

/** Frame-rate thresholds for stepping the auto tier down / up. */
const DOWNGRADE_FPS = 40;
const UPGRADE_FPS = 56;
/** Consecutive samples needed before the tier moves. */
const DOWN_SAMPLES = 2;
const UP_SAMPLES = 4;

let autoTier: AutoTier | null = null;
let slowStreak = 0;
let fastStreak = 0;

/** Current tier used when the preference is "auto" (device guess + measured FPS). */
export const getAutoTier = (): AutoTier => {
  if (autoTier) return autoTier;
  if (typeof window === "undefined") return "balanced";
  try {
    const stored = window.sessionStorage.getItem(AUTO_TIER_KEY);
    if (stored && TIER_ORDER.includes(stored as AutoTier)) {
      autoTier = stored as AutoTier;
      return autoTier;
    }
  } catch {
    /* ignore */
  }
  autoTier = detectQuality();
  return autoTier;
};

const applyAutoTier = (tier: AutoTier) => {
  if (tier === getAutoTier()) return;
  autoTier = tier;
  slowStreak = 0;
  fastStreak = 0;
  try {
    window.sessionStorage.setItem(AUTO_TIER_KEY, tier);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(AUTO_TIER_EVENT, { detail: tier }));
};

/**
 * Force the auto tier to a measured value (used by the one-tap benchmark) so
 * live renderers re-init immediately instead of waiting for FPS samples.
 */
export const setAutoTier = (tier: AutoTier) => {
  slowStreak = 0;
  fastStreak = 0;
  applyAutoTier(tier);
};

/**
 * Feed a measured frame rate from a live 3D avatar. When the preference is
 * "auto", sustained slow frames step the tier down and sustained smooth frames
 * step it back up; renderers listening to AUTO_TIER_EVENT re-init at the new level.
 */

export const reportAvatarFps = (fps: number) => {
  if (typeof window === "undefined") return;
  if (getStoredQuality() !== "auto") return;
  if (!Number.isFinite(fps) || fps <= 0) return;

  const current = getAutoTier();
  const index = TIER_ORDER.indexOf(current);

  if (fps < DOWNGRADE_FPS) {
    fastStreak = 0;
    slowStreak += 1;
    if (slowStreak >= DOWN_SAMPLES && index > 0) applyAutoTier(TIER_ORDER[index - 1]!);
    return;
  }
  if (fps > UPGRADE_FPS) {
    slowStreak = 0;
    fastStreak += 1;
    if (fastStreak >= UP_SAMPLES && index < TIER_ORDER.length - 1) {
      applyAutoTier(TIER_ORDER[index + 1]!);
    }
    return;
  }
  slowStreak = 0;
  fastStreak = 0;
};

export const qualitySettings = (pref: QualityPref = getStoredQuality()): QualitySettings =>
  PRESETS[pref === "auto" ? getAutoTier() : pref];
