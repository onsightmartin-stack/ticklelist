/**
 * The Death Zone: one screen of the Base Camp ring world sits at 8,000 m on a
 * wind-scoured col. The moment you arrive, altitude sickness starts a 30 second
 * countdown. Two ways out: walk off the col to a lower zone, or double-tap up
 * at the foot of the ladder to climb the serac and crack open the oxygen cache,
 * which buys you ten minutes. Leave the zone and the sickness clears entirely.
 */

/** Seconds of consciousness you have on arrival, with no bottled oxygen. */
export const HYPOXIA_SECONDS = 30;

/** Seconds you get once the oxygen bottle is open. */
export const OXYGEN_SECONDS = 600;

/** Below this many seconds left, the climber blinks red. */
export const CRITICAL_SECONDS = 10;

/** World-space foot of the ladder lashed to the serac. */
export const LADDER_X = 1350;
export const LADDER_BASE_Y = 830;

/** Where the oxygen cache sits, on top of the serac. */
export const LADDER_TOP_Y = 520;

/** How close (world px) you must stand to the ladder to start climbing. */
export const LADDER_RADIUS = 130;

/** Two taps of "up" within this many ms count as a double-tap. */
export const DOUBLE_TAP_MS = 450;

export const nearLadder = (x: number, y: number) =>
  Math.abs(x - LADDER_X) <= LADDER_RADIUS && y >= LADDER_BASE_Y - 140;

/** mm:ss for the HUD clock. */
export const formatCountdown = (s: number) =>
  `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

/**
 * Once the oxygen is flowing, the cold takes over: a five minute hypothermia
 * clock. Duck into the abandoned high camp tent to reset it, and hunt down the
 * down suit dumped on the col for an extra minute.
 */
export const HYPOTHERMIA_SECONDS = 300;

/** The most the hypothermia clock can ever hold. */
export const MAX_HYPOTHERMIA_SECONDS = 420;

/** Extra seconds the down suit buys you. */
export const DOWN_SUIT_SECONDS = 60;

/** The abandoned tent (matches the one drawn in the Death Zone scene). */
export const TENT_X = 756;
export const TENT_Y = 812;
export const TENT_RADIUS = 110;

/** Where the down suit lies on the col. */
export const SUIT_X = 300;
export const SUIT_Y = 836;
export const SUIT_RADIUS = 90;

/** Don't spam the "you warmed up" toast more often than this (ms). */
export const TENT_COOLDOWN_MS = 8_000;
