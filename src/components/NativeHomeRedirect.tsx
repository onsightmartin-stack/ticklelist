import { useEffect } from "react";
import { useLocation } from "@/lib/router-compat";
import { isNativeApp } from "@/lib/native";

/** Native shells can inject their bridge slightly after hydration. Also detect
 * Android WebView itself so older installed APKs work without the UA suffix. */
const looksNative = () => {
  if (typeof window === "undefined") return false;
  try {
    if (isNativeApp()) return true;
  } catch {
    /* bridge not ready */
  }
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (w.Capacitor?.isNativePlatform?.()) return true;
  const ua = navigator.userAgent;
  return /TicklelistApp/i.test(ua) || (/Android/i.test(ua) && /;\s*wv\)|\bwv\b|Version\/4\.0/i.test(ua));
};

/**
 * The Android app ships as the Ticklelist community app. Keep its WebView on
 * community/account routes even if Android restores an old marketing URL.
 */
const NativeHomeRedirect = () => {
  const location = useLocation();

  useEffect(() => {
    const isAppRoute =
      location.pathname.startsWith("/community") ||
      location.pathname.startsWith("/auth") ||
      location.pathname.startsWith("/account/");
    if (isAppRoute) return;
    let tries = 0;
    const go = () => {
      if (looksNative()) {
        // Hard replace: works even if the router hasn't finished hydrating.
        window.location.replace("/community");
        return true;
      }
      return false;
    };
    if (go()) return;
    const id = window.setInterval(() => {
      tries += 1;
      if (go() || tries > 20) window.clearInterval(id);
    }, 150);
    return () => window.clearInterval(id);
  }, [location.pathname]);

  return null;
};

export default NativeHomeRedirect;
