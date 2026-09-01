import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/** True when running inside the native Android/iOS shell (Capacitor). */
export const isNativeApp = () => Capacitor.isNativePlatform();

export const nativePlatform = () => Capacitor.getPlatform();

/**
 * Open an external link. In the native app this uses the in-app browser so we
 * never navigate the app WebView away from the community.
 */
export const openExternal = async (url: string) => {
  if (isNativeApp()) {
    await Browser.open({ url, presentationStyle: "popover" });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
};
