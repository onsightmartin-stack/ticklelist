// Client-side session policy: "remember me", idle auto-logout and sign-in throttling.

const REMEMBER_KEY = "sc.remember_me";
const TAB_SENTINEL = "sc.tab_alive";
const THROTTLE_KEY = "sc.signin_attempts";
const LAST_ID_KEY = "sc.last_identifier";

/** Idle timeout before automatic sign-out. */
export const IDLE_TIMEOUT_MS = {
  remembered: 30 * 24 * 60 * 60 * 1000, // 30 days
  transient: 30 * 60 * 1000, // 30 minutes
};

export const getRememberMe = () => localStorage.getItem(REMEMBER_KEY) === "1";

/**
 * Whether the "keep me signed in" box starts ticked.
 * Desktop browsers (Firefox, Chrome, Safari on a personal machine) default to
 * on; touch devices keep the safer opt-in. A previous explicit choice wins.
 */
export const rememberMeDefault = () => {
  const stored = localStorage.getItem(REMEMBER_KEY);
  if (stored === "1") return true;
  if (stored === "0") return false;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return !coarse;
};

/** Identifier (username or email) of the last successful sign-in, if remembered. */
export const getLastIdentifier = () => localStorage.getItem(LAST_ID_KEY) ?? "";

export const setRememberMe = (value: boolean) => {
  localStorage.setItem(REMEMBER_KEY, value ? "1" : "0");
  if (!value) {
    sessionStorage.setItem(TAB_SENTINEL, "1");
    localStorage.removeItem(LAST_ID_KEY);
  }
};

/** Store the identifier so the sign-in form prefills next visit. */
export const rememberIdentifier = (identifier: string) => {
  if (getRememberMe() && identifier.trim()) localStorage.setItem(LAST_ID_KEY, identifier.trim());
};


/**
 * True when a session exists but the browser was fully closed since sign-in
 * and the user did NOT ask to be remembered.
 */
export const shouldDropTransientSession = () => {
  if (getRememberMe()) return false;
  const alive = sessionStorage.getItem(TAB_SENTINEL) === "1";
  sessionStorage.setItem(TAB_SENTINEL, "1");
  return !alive;
};

export const idleLimitMs = () =>
  getRememberMe() ? IDLE_TIMEOUT_MS.remembered : IDLE_TIMEOUT_MS.transient;

/* ---------------- sign-in throttling ---------------- */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

type ThrottleState = { attempts: number[]; lockedUntil?: number | undefined };

const readThrottle = (): ThrottleState => {
  try {
    const raw = localStorage.getItem(THROTTLE_KEY);
    if (!raw) return { attempts: [] };
    const parsed = JSON.parse(raw) as ThrottleState;
    return { attempts: parsed.attempts ?? [], lockedUntil: parsed.lockedUntil };
  } catch {
    return { attempts: [] };
  }
};

const writeThrottle = (state: ThrottleState) =>
  localStorage.setItem(THROTTLE_KEY, JSON.stringify(state));

/** Returns remaining lockout in ms, or 0 when sign-in is allowed. */
export const signInLockoutRemaining = (): number => {
  const { lockedUntil } = readThrottle();
  if (!lockedUntil) return 0;
  const left = lockedUntil - Date.now();
  return left > 0 ? left : 0;
};

/** Record a failed attempt. Returns remaining attempts before lockout. */
export const recordFailedSignIn = (): { remaining: number; lockedMs: number } => {
  const now = Date.now();
  const state = readThrottle();
  const attempts = [...state.attempts.filter((t) => now - t < WINDOW_MS), now];
  if (attempts.length >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_MS;
    writeThrottle({ attempts, lockedUntil });
    return { remaining: 0, lockedMs: LOCKOUT_MS };
  }
  writeThrottle({ attempts });
  return { remaining: MAX_ATTEMPTS - attempts.length, lockedMs: 0 };
};

export const clearSignInAttempts = () => localStorage.removeItem(THROTTLE_KEY);

export const formatDuration = (ms: number) => {
  const mins = Math.ceil(ms / 60000);
  return mins <= 1 ? "a minute" : `${mins} minutes`;
};
