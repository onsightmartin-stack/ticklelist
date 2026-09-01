import { useEffect, useState } from "react";
import { Hand, Maximize2, ZoomIn, X } from "lucide-react";

const HINT_KEY = "onsight-basecamp-hint";

/**
 * One-time coach mark shown on Base Camp explaining how to pan, zoom, and
 * reset the view. Dismissed by tap, auto-hides after 12 s, and never shows
 * again once dismissed (localStorage guard).
 */
const BaseCampHint = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(HINT_KEY)) return;
    } catch {
      /* storage unavailable — show once per session */
    }
    setShow(true);
    const id = window.setTimeout(() => setShow(false), 12000);
    return () => window.clearTimeout(id);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-4">
      <div
        role="status"
        onClick={dismiss}
        className="pointer-events-auto flex max-w-md cursor-pointer items-start gap-3 rounded-2xl border border-primary/40 bg-card/95 px-4 py-3 shadow-lg backdrop-blur animate-fade-in"
      >
        <Hand className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="text-[11px] leading-tight text-muted-foreground">
          <span className="font-display tracking-wide text-foreground">
            Explore base camp
          </span>
          <br />
          <span className="inline-flex items-center gap-1">
            <Hand className="h-3.5 w-3.5" /> Drag to walk around
          </span>{" "}
          ·{" "}
          <span className="inline-flex items-center gap-1">
            <ZoomIn className="h-3.5 w-3.5" /> Scroll or pinch to zoom
          </span>{" "}
          ·{" "}
          <span className="inline-flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5" /> Reset view with the button
            bottom-right
          </span>
          <br />
          <span className="mt-1 inline-block text-[10px] uppercase tracking-[0.18em] text-primary/80">
            Tap to close
          </span>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss hint"
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default BaseCampHint;
