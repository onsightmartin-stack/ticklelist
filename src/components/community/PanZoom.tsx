import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Minus, Plus, Maximize2, Frame } from "lucide-react";
import { motionAllowed } from "@/lib/motion";

interface Props {
  /** Intrinsic size of the world being displayed. */
  worldWidth: number;
  worldHeight: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Extra zoom allowed beyond the fitted scale. */
  maxScaleFactor?: number;
  minScaleFactor?: number;
  /** When set, pan/zoom is remembered in localStorage under this key. */
  storageKey?: string;
  /** Show the zoom/fit/reset control cluster (bottom-right). Default true. */
  showControls?: boolean;
}

interface SavedView {
  /** zoom expressed as a multiple of the fitted scale, so it survives resizes */
  f: number;
  /** world-space point shown at the centre of the viewport */
  cx: number;
  cy: number;
}

const readSaved = (key?: string): SavedView | null => {
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as SavedView;
    if ([v?.f, v?.cx, v?.cy].every((n) => typeof n === "number" && Number.isFinite(n))) return v;
  } catch {
    /* ignore unreadable storage */
  }
  return null;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Wheel / pinch zoom + drag pan viewport for a fixed-size world.
 * The world always covers the viewport, so you can never pan into empty space.
 */
const PanZoom = ({
  worldWidth,
  worldHeight,
  children,
  className = "",
  style,
  maxScaleFactor = 4,
  minScaleFactor = 1,
  storageKey,
  showControls = true,
}: Props) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // Scale at which the world exactly covers the viewport.
  const fit = size.w && size.h ? Math.max(size.w / worldWidth, size.h / worldHeight) : 1;
  const minZoom = fit * minScaleFactor;
  const maxZoom = fit * maxScaleFactor;

  const clampOffset = useCallback(
    (o: { x: number; y: number }, z: number) => {
      const w = worldWidth * z;
      const h = worldHeight * z;
      return {
        x: clamp(o.x, Math.min(0, size.w - w), Math.max(0, size.w - w)),
        y: clamp(o.y, Math.min(0, size.h - h), Math.max(0, size.h - h)),
      };
    },
    [size.w, size.h, worldWidth, worldHeight],
  );

  // Track viewport size.
  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry?.contentRect;
      if (r) setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const restore = useCallback(
    (v: SavedView) => {
      if (!size.w || !size.h) return false;
      const f = Math.max(size.w / worldWidth, size.h / worldHeight);
      const z = clamp(f * v.f, f * minScaleFactor, f * maxScaleFactor);
      setZoom(z);
      setOffset(clampOffset({ x: size.w / 2 - v.cx * z, y: size.h / 2 - v.cy * z }, z));
      return true;
    },
    [size.w, size.h, worldWidth, worldHeight, clampOffset, minScaleFactor, maxScaleFactor],
  );

  const reset = useCallback(() => {
    if (!size.w || !size.h) return;
    const z = Math.max(size.w / worldWidth, size.h / worldHeight);
    setZoom(z);
    // Start centred horizontally, anchored to the ground at the bottom.
    setOffset(clampOffset({ x: (size.w - worldWidth * z) / 2, y: size.h - worldHeight * z }, z));
    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    }
  }, [size.w, size.h, worldWidth, worldHeight, clampOffset, storageKey]);

  // --- Smooth pan/zoom tween for the "Fit to view" / "Reset view" buttons ---
  const rafRef = useRef<number | null>(null);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  const cancelAnim = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  /** Animate the viewport to `target` (zoom + offset) over ~450ms with ease-out. */
  const tweenTo = useCallback(
    (target: { z: number; x: number; y: number }, duration = 450) => {
      if (!size.w || !size.h) return;
      // Respect the global motion preference: jump instantly when motion is off.
      if (!motionAllowed()) {
        setZoom(target.z);
        setOffset(clampOffset({ x: target.x, y: target.y }, target.z));
        return;
      }
      const startZ = zoomRef.current;
      const start = offsetRef.current;
      const dz = target.z - startZ;
      const dx = target.x - start.x;
      const dy = target.y - start.y;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const e = ease(t);
        const z = startZ + dz * e;
        setOffset(clampOffset({ x: start.x + dx * e, y: start.y + dy * e }, z));
        setZoom(z);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [size.w, size.h, clampOffset],
  );

  /** Animated version of `reset` for the toolbar button (keeps init instant). */
  const resetAnimated = useCallback(() => {
    if (!size.w || !size.h) return;
    const z = Math.max(size.w / worldWidth, size.h / worldHeight);
    tweenTo({ z, x: (size.w - worldWidth * z) / 2, y: size.h - worldHeight * z });
    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    }
  }, [size.w, size.h, worldWidth, worldHeight, tweenTo, storageKey]);

  /** Fit the entire world inside the viewport, centred on both axes. */
  const fitView = useCallback(() => {
    if (!size.w || !size.h) return;
    const z = Math.max(size.w / worldWidth, size.h / worldHeight);
    tweenTo({ z, x: (size.w - worldWidth * z) / 2, y: (size.h - worldHeight * z) / 2 });
  }, [size.w, size.h, worldWidth, worldHeight, tweenTo]);

  const inited = useRef(false);
  useEffect(() => {
    if (!size.w || !size.h) return;
    if (inited.current) {
      setOffset((o) => clampOffset(o, zoom));
      return;
    }
    inited.current = true;
    const saved = readSaved(storageKey);
    if (saved && restore(saved)) return;
    reset();
  }, [size.w, size.h, reset, restore, clampOffset, zoom, storageKey]);

  // Persist the current view (debounced) so revisits resume where you left off.
  useEffect(() => {
    if (!storageKey || !inited.current || !size.w || !size.h || !zoom) return;
    const t = window.setTimeout(() => {
      const f = Math.max(size.w / worldWidth, size.h / worldHeight);
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            f: zoom / f,
            cx: (size.w / 2 - offset.x) / zoom,
            cy: (size.h / 2 - offset.y) / zoom,
          } satisfies SavedView),
        );
      } catch {
        /* storage full or blocked */
      }
    }, 250);
    return () => window.clearTimeout(t);
  }, [storageKey, zoom, offset.x, offset.y, size.w, size.h, worldWidth, worldHeight]);

  /** Zoom to `next`, keeping the point (px, py) in viewport space still. */
  const zoomTo = useCallback(
    (next: number, px: number, py: number) => {
      setZoom((z) => {
        const target = clamp(next, minZoom, maxZoom);
        const k = target / z;
        setOffset((o) => clampOffset({ x: px - (px - o.x) * k, y: py - (py - o.y) * k }, target));
        return target;
      });
    },
    [clampOffset, minZoom, maxZoom],
  );

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const zoomToRef = useRef(zoomTo);
  zoomToRef.current = zoomTo;

  // Native non-passive wheel listener (React's onWheel is passive).
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnim();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      zoomToRef.current(
        zoomRef.current * Math.exp(-dy * 0.0018),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Pointer drag + two-finger pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);

  const local = (e: React.PointerEvent) => {
    const rect = hostRef.current?.getBoundingClientRect();
    return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
  };

  /** Distance travelled since pointer-down, used to swallow drag-clicks. */
  const moved = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    cancelAnim();
    moved.current = 0;
    pointers.current.set(e.pointerId, local(e));
    if (pointers.current.size === 1) setDragging(true);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      if (a && b) {
        pinch.current = {
          dist: Math.hypot(a.x - b.x, a.y - b.y),
          cx: (a.x + b.x) / 2,
          cy: (a.y + b.y) / 2,
        };
      }
      setDragging(false);
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const now = local(e);
    pointers.current.set(e.pointerId, now);

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      if (pinch.current.dist > 0) zoomTo(zoom * (dist / pinch.current.dist), cx, cy);
      pinch.current = { dist, cx, cy };
      return;
    }

    if (!dragging) return;
    const dx = now.x - prev.x;
    const dy = now.y - prev.y;
    moved.current += Math.abs(dx) + Math.abs(dy);
    if (dx || dy) setOffset((o) => clampOffset({ x: o.x + dx, y: o.y + dy }, zoom));
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  };

  const zoomButton = (factor: number) => zoomTo(zoom * factor, size.w / 2, size.h / 2);

  return (
    <div
      ref={hostRef}
      className={`relative overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"} ${className}`}
      style={{ touchAction: "none", overscrollBehavior: "contain", ...style }}
      onPointerDown={onPointerDown}
      onClickCapture={(e) => {
        if (moved.current > 8) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={endPointer}
      data-no-swipe
    >
      <div
        style={{
          width: worldWidth,
          height: worldHeight,
          transformOrigin: "0 0",
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
          willChange: "transform",
        }}
      >
        {children}
      </div>

      {showControls && (
        <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1">
          {[
            { icon: Plus, label: "Zoom in", action: () => zoomButton(1.35) },
            { icon: Minus, label: "Zoom out", action: () => zoomButton(1 / 1.35) },
            { icon: Frame, label: "Fit to view", action: fitView },
            { icon: Maximize2, label: "Reset view", action: resetAnimated },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={action}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/25 bg-slate-950/70 text-slate-100 backdrop-blur transition-colors hover:bg-slate-950/90"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PanZoom;
