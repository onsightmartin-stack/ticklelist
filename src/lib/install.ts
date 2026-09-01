/**
 * Install (A2HS) detection utilities.
 *
 * `beforeinstallprompt` often fires before React mounts, so we capture it at
 * module load and replay it to subscribers. Everything else is feature
 * detection — no user-agent sniffing except where a browser has no API
 * (iOS/desktop Safari, Firefox) and we must fall back to instructions.
 */

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallMethod = "prompt" | "ios-share" | "menu";

export type InstallState = {
  /** Native prompt available right now. */
  deferred: BeforeInstallPromptEvent | null;
  /** App already installed / running installed. */
  installed: boolean;
  /** How the user can install in this browser. */
  method: InstallMethod;
  /** Browser can install at all. */
  supported: boolean;
};

const isBrowser = typeof window !== "undefined";

export const isStandalone = (): boolean => {
  if (!isBrowser) return false;
  const mq = (q: string) => typeof window.matchMedia === "function" && window.matchMedia(q).matches;
  return (
    mq("(display-mode: standalone)") ||
    mq("(display-mode: minimal-ui)") ||
    mq("(display-mode: fullscreen)") ||
    mq("(display-mode: window-controls-overlay)") ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith("android-app://")
  );
};

export const isIosLike = (): boolean => {
  if (!isBrowser) return false;
  const ua = window.navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
};

/** Browsers that fire beforeinstallprompt (Chromium family). */
const supportsPromptApi = (): boolean => isBrowser && "onbeforeinstallprompt" in window;

/** Firefox / Safari desktop can install manually from the browser menu. */
const supportsManualInstall = (): boolean => {
  if (!isBrowser) return false;
  const ua = window.navigator.userAgent;
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isSafari || /firefox|fxios/i.test(ua);
};

export const detectMethod = (): InstallMethod => {
  if (isIosLike()) return "ios-share";
  if (supportsPromptApi()) return "prompt";
  return "menu";
};

export type BrowserKind =
  | "chrome-android"
  | "chrome-desktop"
  | "edge-desktop"
  | "safari-ios"
  | "safari-desktop"
  | "firefox"
  | "samsung"
  | "other";

/** Best-effort browser identification, used only to pick instruction copy. */
export const detectBrowser = (): BrowserKind => {
  if (!isBrowser) return "other";
  const ua = window.navigator.userAgent;
  const android = /android/i.test(ua);
  if (isIosLike()) return "safari-ios";
  if (/samsungbrowser/i.test(ua)) return "samsung";
  if (/edg\//i.test(ua)) return "edge-desktop";
  if (/firefox|fxios/i.test(ua)) return "firefox";
  if (/chrome|crios|chromium/i.test(ua)) return android ? "chrome-android" : "chrome-desktop";
  if (/^((?!chrome|android|crios|fxios).)*safari/i.test(ua)) return "safari-desktop";
  return "other";
};


export const canInstall = (): boolean =>
  isBrowser && (supportsPromptApi() || isIosLike() || supportsManualInstall());

// --- capture the event as early as possible -------------------------------

let captured: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<(s: InstallState) => void>();

export const getInstallState = (): InstallState => ({
  deferred: captured,
  installed: installed || isStandalone(),
  method: isBrowser ? detectMethod() : "prompt",
  supported: canInstall(),
});

const emit = () => {
  const state = getInstallState();
  listeners.forEach((fn) => fn(state));
};

export const subscribeInstall = (fn: (s: InstallState) => void): (() => void) => {
  listeners.add(fn);
  fn(getInstallState());
  return () => listeners.delete(fn);
};

export const clearDeferred = () => {
  captured = null;
  emit();
};

export const promptInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
  const event = captured;
  if (!event) return "unavailable";
  captured = null;
  emit();
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome;
  } catch {
    return "unavailable";
  }
};

if (isBrowser) {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    captured = event as BeforeInstallPromptEvent;
    installed = false;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    captured = null;
    installed = true;
    emit();
  });
  // Some browsers only flip display-mode after launch; keep state honest.
  if (typeof window.matchMedia === "function") {
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", () => emit());
  }
}
