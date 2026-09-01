import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useLocation, useNavigate } from "@/lib/router-compat";

import PageSwitcher from "@/components/community/PageSwitcher";
import PageProgress from "@/components/community/PageProgress";
import SwipeArrows from "@/components/community/SwipeArrows";
import { pageIndex, visiblePages, wrapIndex, type CommunityPage } from "@/lib/community-pages";
import { useAuth } from "@/hooks/useAuth";
import { motionAllowed } from "@/lib/motion";
import { useMotionAllowed } from "@/hooks/useMotionAllowed";
import { haptic } from "@/lib/haptics";
import { useGamepad, rumble, type GamepadAction } from "@/hooks/useGamepad";

/** Horizontal distance (px) that counts as a page swipe. */
const SWIPE_DISTANCE = 70;
/** Max time between two taps for a double-tap (ms). */
const DOUBLE_TAP_MS = 320;
/** Max movement for a touch to still count as a tap (px). */
const TAP_SLOP = 12;
const HINT_KEY = "onsight-swipe-hint";

/** Elements whose own gestures must win over page swiping. */
const NO_SWIPE = [
  "input",
  "textarea",
  "select",
  "canvas",
  "iframe",
  "video",
  "[contenteditable='true']",
  "[draggable='true']",
  "[data-no-swipe]",
  "[role='slider']",
  "[role='dialog']",
  "[role='tablist']",
  "[data-radix-scroll-area-viewport]",
  ".leaflet-container",
  ".maplibregl-map",
  ".mapboxgl-map",
  ".no-swipe",
].join(", ");

/** A swipe must be this much more horizontal than vertical to count. */
const AXIS_RATIO = 1.6;
/** Movement before the axis is decided (px). */
const AXIS_LOCK = 14;

/**
 * True when an ancestor claims horizontal gestures for itself — either it
 * scrolls sideways, or it opts out via touch-action (pan-x / none / pinch-zoom).
 */
const ownsHorizontalGesture = (start: EventTarget | null, root: HTMLElement) => {
  let el = start instanceof Element ? start : null;
  while (el && el !== root) {
    const style = getComputedStyle(el);
    if (el.scrollWidth > el.clientWidth + 4) {
      const overflow = style.overflowX;
      if (overflow === "auto" || overflow === "scroll") return true;
    }
    const touch = style.touchAction;
    if (touch && touch !== "auto" && touch !== "pan-y" && touch !== "manipulation") return true;
    el = el.parentElement;
  }
  return false;
};

/** Page is pinch-zoomed, or a modal/sheet is open — leave gestures alone. */
const gesturesBlocked = () => {
  if (typeof window === "undefined") return true;
  const scale = window.visualViewport?.scale ?? 1;
  if (scale > 1.05) return true;
  return !!document.querySelector(
    "[role='dialog'][data-state='open'], [role='alertdialog'][data-state='open'], [data-swipe-block]",
  );
};

/**
 * Static preview of a neighbouring page, shown on the turning cube's side.
 * It mimics the real page chrome — tinted header with the page identity, then
 * a calm content skeleton — so the turn reads as a page, not a placeholder.
 */
const PageFace = ({ page }: { page: CommunityPage }) => {
  const Icon = page.icon;
  return (
    <div className="flex h-full w-full flex-col bg-background">
      <div className={`bg-gradient-to-br ${page.tint} px-5 pb-6 pt-8`}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm">
            <Icon className="h-5 w-5 text-foreground" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">Ticklelist</p>
            <p className="font-display text-xl tracking-wider text-foreground">{page.label}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-5 pt-5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border/50 bg-card/70 p-3"
            style={{ opacity: 1 - i * 0.22 }}
          >
            <div className="h-2.5 w-1/3 rounded-full bg-foreground/20" />
            <div className="mt-2 h-2 w-4/5 rounded-full bg-foreground/10" />
            <div className="mt-1.5 h-2 w-2/3 rounded-full bg-foreground/10" />
          </div>
        ))}
      </div>
    </div>
  );
};


/**
 * Phone-style navigation for the community: swipe left/right to move between
 * pages, double-tap to zoom out to a 3D grid of every page, tap an icon to
 * zoom back in. Touch only — mouse and keyboard keep the normal nav.
 */
const SwipeNavigator = ({ children }: { children: ReactNode }) => {

  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const location = useLocation();

  const pages = visiblePages(!!user);
  const index = pageIndex(pages, location.pathname);

  const [zoomedOut, setZoomedOut] = useState(false);
  const [enter, setEnter] = useState<"left" | "right" | "zoom" | null>(null);
  const [drag, setDrag] = useState(0);
  /** True while a committed swipe animates out to the page boundary. */
  const [snapping, setSnapping] = useState(false);
  /** One frame with transitions off, used to reset the cube after a commit. */
  const [instant, setInstant] = useState(false);
  const [hint, setHint] = useState(false);
  /** Direction whose swipe threshold is currently armed (drives the edge glow). */
  const [armed, setArmed] = useState<"left" | "right" | null>(null);
  /** Where the double-tap landed, for the zoom-out ripple. */
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  /** Stage width, used to size the cube so faces meet with no gap. */
  const [stageWidth, setStageWidth] = useState(360);

  const hostRef = useRef<HTMLDivElement | null>(null);

  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const axis = useRef<"none" | "x" | "y">("none");
  const lastTap = useRef(0);
  const armedRef = useRef<"left" | "right" | null>(null);
  /** Last move sample, for flick velocity. */
  const sample = useRef<{ x: number; t: number } | null>(null);


  // Keep the cube geometry in sync with the viewport width.
  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setStageWidth(el.getBoundingClientRect().width || 360);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // One-time coach mark for touch visitors — only on the welcome (feed) page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (location.pathname !== "/community") return;
    if (!window.matchMedia?.("(pointer: coarse)").matches) return;
    try {
      if (window.localStorage.getItem(HINT_KEY)) return;
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* storage unavailable — show it once for this session */
    }
    setHint(true);
    const id = window.setTimeout(() => setHint(false), 8000);
    return () => window.clearTimeout(id);
  }, [location.pathname]);

  const go = useCallback(
    (target: number, direction: "left" | "right" | "zoom") => {
      const page = pages[target];
      if (!page) return;
      setEnter(motionAllowed() ? direction : null);
      navigate(page.to);
    },
    [navigate, pages],
  );

  /**
   * Finish a committed swipe by carrying the cube all the way round to the
   * neighbouring face, then swapping in the real page with transitions off so
   * there is no visible snap-back.
   */
  const snapTo = useCallback(
    (target: number, direction: "left" | "right") => {
      const page = pages[target];
      if (!page) return;
      if (!motionAllowed()) {
        go(target, direction);
        return;
      }
      const width = stageWidth || 360;
      setSnapping(true);
      setDrag(direction === "left" ? -width : width);
      window.setTimeout(() => {
        setEnter(null);
        setInstant(true);
        setSnapping(false);
        setDrag(0);
        navigate(page.to);
        requestAnimationFrame(() => setInstant(false));
      }, 230);
    },
    [go, navigate, pages, stageWidth],
  );


  const cancelGesture = useCallback(() => {
    start.current = null;
    axis.current = "none";
    armedRef.current = null;
    setArmed(null);
    setDrag(0);
  }, []);

  // Any vertical page scroll during a gesture means the user is reading, not
  // swiping — drop the gesture immediately.
  useEffect(() => {
    const onScroll = () => {
      if (start.current && axis.current !== "x") cancelGesture();
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [cancelGesture]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (zoomedOut) return;
    // Multi-touch (pinch-zoom, two-finger pan) is never a page swipe.
    if (e.touches.length !== 1) {
      cancelGesture();
      return;
    }
    if (gesturesBlocked()) {
      start.current = null;
      return;
    }
    const touch = e.touches[0];
    if (!touch) return;
    const target = e.target as Element | null;
    if (target?.closest(NO_SWIPE)) {
      start.current = null;
      return;
    }
    start.current = { x: touch.clientX, y: touch.clientY, t: performance.now() };
    sample.current = { x: touch.clientX, t: performance.now() };
    axis.current = "none";
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // A second finger landed mid-gesture: hand it back to the browser (pinch).
    if (e.touches.length > 1) {
      cancelGesture();
      return;
    }
    const s = start.current;
    const touch = e.touches[0];
    if (!s || !touch) return;
    const dx = touch.clientX - s.x;
    const dy = touch.clientY - s.y;

    if (axis.current === "none") {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
      // Needs to be clearly horizontal, and nothing in between may claim the
      // gesture (sideways scrollers, maps, sliders, custom touch-action).
      const clearlyHorizontal = Math.abs(dx) > Math.abs(dy) * AXIS_RATIO;
      const host = hostRef.current;
      if (!clearlyHorizontal || (host && ownsHorizontalGesture(e.target, host))) {
        axis.current = "y";
        start.current = null;
        return;
      }
      axis.current = "x";
    }

    if (axis.current === "x") {
      sample.current = { x: touch.clientX, t: performance.now() };
      const canTurn = index >= 0 && pages.length > 1;
      const width = stageWidth || 360;
      // Track the finger 1:1 so the cube face stays under the thumb.
      const offset = canTurn ? dx : dx * 0.16;
      setDrag(Math.max(-width, Math.min(width, offset)));

      // Arm/disarm the commit threshold, with a haptic tick the moment it arms.
      let next: "left" | "right" | null = null;
      if (canTurn && Math.abs(dx) > SWIPE_DISTANCE) {
        next = dx < 0 ? "left" : "right";
      }
      if (next !== armedRef.current) {
        armedRef.current = next;
        setArmed(next);
        if (next) haptic("tick");
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const s = start.current;
    const last = sample.current;
    start.current = null;
    sample.current = null;
    if (!s) {
      setDrag(0);
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - s.x;
    const dy = touch.clientY - s.y;
    const elapsed = performance.now() - s.t;

    armedRef.current = null;
    setArmed(null);

    // A quick flick counts even when it did not travel the full distance.
    const flick =
      !!last && performance.now() - last.t < 120 && Math.abs(dx) > TAP_SLOP * 3 && Math.abs(dx) / Math.max(elapsed, 1) > 0.5;
    const committed = Math.abs(dx) > SWIPE_DISTANCE || flick;

    if (axis.current === "x" && committed && Math.abs(dx) > Math.abs(dy)) {
      if (index >= 0 && pages.length > 1) {
        haptic("select");
        if (dx < 0) snapTo(wrapIndex(pages.length, index + 1), "left");
        else snapTo(wrapIndex(pages.length, index - 1), "right");
      } else {
        setDrag(0);
      }
      axis.current = "none";
      lastTap.current = 0;
      return;
    }

    axis.current = "none";
    setDrag(0);

    // Double tap on the page background zooms out to the app grid.
    const isTap = Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP && elapsed < 300;
    if (!isTap) return;
    const target = e.target as Element | null;
    if (target?.closest("a, button, input, textarea, select, label, [role='button'], canvas")) {
      lastTap.current = 0;
      return;
    }
    const now = performance.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      setHint(false);
      haptic("zoom");
      setRipple({ x: touch.clientX, y: touch.clientY, id: now });
      setZoomedOut(true);
    } else {
      lastTap.current = now;
    }
  };

  // Controller navigation while the page is open: bumpers/D-pad move between
  // pages, Y/Menu (or A on a page) opens the dashboard grid.
  const onPadAction = useCallback(
    (action: GamepadAction) => {
      if (action === "left" && index >= 0 && pages.length > 1) {
        haptic("select");
        rumble(45, 0.3);
        go(wrapIndex(pages.length, index - 1), "right");
      } else if (action === "right" && index >= 0 && pages.length > 1) {
        haptic("select");
        rumble(45, 0.3);
        go(wrapIndex(pages.length, index + 1), "left");
      } else if (action === "menu" || action === "up") {
        haptic("zoom");
        rumble(70, 0.4);
        setZoomedOut(true);
      }
    },
    [go, index, pages.length],
  );

  useGamepad({ onAction: onPadAction, enabled: !zoomedOut });

  // Clear the entry animation once it has played.
  useEffect(() => {
    if (!enter) return;
    const id = window.setTimeout(() => setEnter(null), 320);
    return () => window.clearTimeout(id);
  }, [enter, location.pathname]);


  const pick = (page: CommunityPage, i: number) => {
    setZoomedOut(false);
    if (i !== index) go(i, "zoom");
  };

  const motionOk = useMotionAllowed();

  // Reduced motion: no perspective card-turn, just a plain slide/fade.
  const animation = !motionOk
    ? undefined
    : enter === "left"
      ? "swipe-in-left 0.42s cubic-bezier(0.22, 1, 0.36, 1)"
      : enter === "right"
        ? "swipe-in-right 0.42s cubic-bezier(0.22, 1, 0.36, 1)"
        : enter === "zoom"
          ? "zoom-in-page 0.36s cubic-bezier(0.22, 1, 0.36, 1)"
          : undefined;

  // While dragging, the whole stage turns like a cube: the page rotates the
  // same way the finger moves, and the neighbouring page face is already there
  // on the side that is coming around — no blank gap between pages.
  const width = stageWidth || 360;
  const half = Math.max(160, width / 2);
  const turning = motionOk && (drag !== 0 || snapping);
  // 1:1 mapping — dragging a full screen width turns the cube a full quarter.
  const rollAngle = motionOk ? Math.max(-90, Math.min(90, (drag / width) * 90)) : 0;
  const progress = Math.min(Math.abs(rollAngle) / 90, 1);
  const stageTransform = turning
    ? `translateZ(-${half}px) rotateY(${rollAngle}deg)`
    : !motionOk && drag
      ? `translateX(${Math.max(-40, Math.min(40, drag))}px)`
      : undefined;

  // The deck wraps: the first page's left neighbour is the last page, so you
  // can swipe both ways from the very start.
  const canWrap = index >= 0 && pages.length > 1;
  const prevIndex = canWrap ? wrapIndex(pages.length, index - 1) : -1;
  const nextIndex = canWrap ? wrapIndex(pages.length, index + 1) : -1;
  const prevPage = canWrap ? pages[prevIndex] : undefined;
  const nextPage = canWrap ? pages[nextIndex] : undefined;

  // Warm the neighbouring routes (loaders + code) so the swipe lands on a
  // painted page instead of a spinner.
  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      [prevPage?.to, nextPage?.to].forEach((to) => {
        if (!to) return;
        try {
          void Promise.resolve(router.preloadRoute({ to: to as never })).catch(() => undefined);
        } catch {
          /* preloading is best-effort */
        }
      });
    };
    const id = window.setTimeout(warm, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [router, prevPage?.to, nextPage?.to]);

  const transitionCurve = instant
    ? "none"
    : snapping
      ? "transform 0.23s cubic-bezier(0.32, 0.72, 0, 1)"
      : drag
        ? "none"
        : "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)";

  const faceStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    transform: `rotateY(${side === "left" ? -90 : 90}deg) translateZ(${half}px)`,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    // The incoming face lifts out of shadow as it turns towards the viewer.
    filter: `brightness(${0.55 + progress * 0.45})`,
  });

  return (
    <>
      <div
        className="flex-1 flex flex-col"
        style={motionOk ? { perspective: `${Math.max(900, half * 2.4)}px`, perspectiveOrigin: "50% 45%" } : undefined}
      >
        <div
          ref={hostRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={cancelGesture}
          style={{
            touchAction: "pan-y",
            transformStyle: motionOk ? "preserve-3d" : "flat",
            transformOrigin: "center center",
            transform: stageTransform,
            transition: transitionCurve,
            willChange: turning ? "transform" : undefined,
            position: "relative",
          }}
          className="flex-1 flex flex-col"
        >
          {/* Front face: the live page. */}
          <div
            style={{
              transform: turning ? `translateZ(${half}px)` : undefined,
              filter: turning ? `brightness(${1 - progress * 0.45})` : undefined,
              transition: instant ? "none" : "filter 0.23s ease",
              animation: drag || snapping ? undefined : animation,
            }}
            className="flex-1 flex flex-col"
          >
            {children}
          </div>


          {/* Side faces: a preview of the pages either side, so the cube never
              shows an empty edge while turning. */}
          {motionOk && turning && (
            <>
              {prevPage && drag > 0 && (
                <div style={faceStyle("left")} aria-hidden="true">
                  <PageFace page={prevPage} />
                </div>
              )}
              {nextPage && drag < 0 && (
                <div style={faceStyle("right")} aria-hidden="true">
                  <PageFace page={nextPage} />
                </div>
              )}
            </>

          )}
        </div>
      </div>


      {/* 3D edge arrows showing the pages either side of this one. */}
      {!zoomedOut && (
        <SwipeArrows
          prev={prevPage}
          next={nextPage}
          drag={drag}
          armed={armed}
          animate={motionOk}
        />
      )}


      {/* Edge glow + next-page label while a swipe is armed. */}
      {armed && (
        <div
          aria-hidden="true"
          className={`md:hidden pointer-events-none fixed inset-y-0 z-30 w-24 animate-fade-in ${
            armed === "left"
              ? "right-0 bg-gradient-to-l from-primary/35 to-transparent"
              : "left-0 bg-gradient-to-r from-primary/35 to-transparent"
          }`}
        >
          <span
            className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-primary/60 bg-card/95 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary shadow-lg ${
              armed === "left" ? "right-3" : "left-3"
            }`}
          >
            {(armed === "left" ? nextPage : prevPage)?.label}
          </span>
        </div>
      )}

      {/* Ripple from the double-tap point as the dashboard opens. */}
      {ripple && (
        <span
          key={ripple.id}
          aria-hidden="true"
          onAnimationEnd={() => setRipple(null)}
          className="pointer-events-none fixed z-[65] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/70 [animation:tap-ripple_0.45s_ease-out_forwards]"
          style={{ left: ripple.x, top: ripple.y }}
        />
      )}

      {hint && (
        <div className="md:hidden fixed inset-x-0 bottom-24 z-[60] flex justify-center px-6">
          <button
            type="button"
            onClick={() => setHint(false)}
            className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-card/95 px-4 py-3 text-left shadow-lg animate-fade-in backdrop-blur"
          >
            <span className="flex shrink-0 items-center gap-1.5">
              <ChevronLeft className="h-5 w-5 text-primary" strokeWidth={3} />
              <ChevronRight className="h-5 w-5 text-primary" strokeWidth={3} />
            </span>
            <span className="text-[11px] leading-tight text-muted-foreground">
              <span className="font-display tracking-wide text-foreground">Swipe to navigate</span>
              <br />
              Use the 3D arrows on the edges to swipe between pages · double-tap to see all
            </span>
          </button>
        </div>
      )}

      {!zoomedOut && <PageProgress pages={pages} index={index} armed={armed} />}

      <PageSwitcher
        pages={pages}
        activeIndex={index}
        open={zoomedOut}
        onClose={() => setZoomedOut(false)}
        onPick={pick}
      />
    </>
  );
};

export default SwipeNavigator;
