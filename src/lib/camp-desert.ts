/**
 * The Desert Range: hot, dry and unforgiving. Walk in and a dehydration clock
 * starts. Double-tap ↓ anywhere on the sand to dig for water — a well buys you
 * another minute, and you can go back and drink from it again once it refills.
 * Let the clock hit zero and you collapse and are dragged to the next zone.
 */

/** Seconds before you collapse from thirst, with nothing to drink. */
export const DEHYDRATION_SECONDS = 90;

/** Seconds a dig / a drink from your well adds to the clock. */
export const WATER_SECONDS = 60;

/** The clock never goes above this, however much you drink. */
export const MAX_HYDRATION_SECONDS = 180;

/** How long (ms) before the well seeps full enough to drink again. */
export const WELL_REFILL_MS = 20_000;

/** How close (world px) you must stand to your well to drink from it. */
export const WELL_RADIUS = 120;

/** Below this many seconds left, the climber blinks red. */
export const PARCHED_SECONDS = 10;
