import { useEffect, useState } from "react";
import { useLocation } from "@/lib/router-compat";
import useInstallPrompt from "@/hooks/useInstallPrompt";
import InstallGuide from "@/components/InstallGuide";
import { isOnCommunityOrigin } from "@/lib/site-links";

const DISMISS_KEY = "sc-install-dismissed-until-v2";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

const readSnoozed = () => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    // Legacy value from the old banner.
    if (raw === "1") return true;
    return Number(raw) > Date.now();
  } catch {
    return false;
  }
};

/**
 * Install banner shown on every route. Chromium fires beforeinstallprompt
 * (captured before mount), iOS Safari needs Share -> Add to Home Screen, and
 * Firefox/desktop Safari install from the browser menu.
 */
const InstallAppPrompt = () => {
  const { canShowCta, hasNativePrompt, method, install } = useInstallPrompt();
  const location = useLocation();
  const [snoozed, setSnoozed] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    setSnoozed(readSnoozed());
  }, []);

  // Community-only: never shown on the Onsight Martin marketing site.
  const onCommunity =
    location.pathname.startsWith("/community") || isOnCommunityOrigin();

  if (!onCommunity || snoozed || !canShowCta) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      /* storage unavailable — hide for this session only */
    }
    setSnoozed(true);
  };

  const hint = hasNativePrompt
    ? "Add the community app to your home screen."
    : method === "ios-share"
      ? "Tap Share, then \u201cAdd to Home Screen\u201d."
      : "Open your browser menu and choose \u201cInstall\u201d / \u201cAdd to Home Screen\u201d.";

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] sm:left-auto sm:right-4 sm:w-80">
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur p-3 shadow-lg">
        <div className="flex items-start gap-3">
          <img src="/app-icon-192.png" alt="" className="h-10 w-10 rounded-lg" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install Ticklelist</p>
            <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
            <p className="text-xs font-medium text-primary mt-1">
              Free for first downloads until 25/8 2026
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={dismiss}
            className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground"
          >
            Not now
          </button>
          <button
            onClick={() => setGuideOpen(true)}
            className="px-3 py-1.5 text-xs rounded-md border border-border text-foreground"
          >
            How to install
          </button>
          {hasNativePrompt && (
            <button
              onClick={async () => {
                const outcome = await install();
                if (outcome === "accepted") setSnoozed(true);
                else if (outcome === "unavailable") setGuideOpen(true);
              }}
              className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground font-medium"
            >
              Install
            </button>
          )}
        </div>
      </div>
      <InstallGuide open={guideOpen} onOpenChange={setGuideOpen} />

    </div>
  );
};

export default InstallAppPrompt;
