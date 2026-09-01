import { useCallback, useEffect, useRef, useState } from "react";
import { X, Gamepad2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CommunityPage } from "@/lib/community-pages";
import { useGamepad, rumble, type GamepadAction } from "@/hooks/useGamepad";
import { haptic } from "@/lib/haptics";

interface PageSwitcherProps {
  pages: CommunityPage[];
  activeIndex: number;
  open: boolean;
  onClose: () => void;
  onPick: (page: CommunityPage, index: number) => void;
}

/**
 * Zoomed-out home screen, Xbox dashboard style: one big hero tile for the
 * focused page followed by a horizontally snapping rail of smaller tiles,
 * each angled in 3D. Opened by double-tapping the page, closed by picking a
 * tile (zoom in) or the backdrop.
 */
const PageSwitcher = ({ pages, activeIndex, open, onClose, onPick }: PageSwitcherProps) => {
  const [focus, setFocus] = useState(Math.max(activeIndex, 0));
  /** Which block the controller/keyboard focus lives in. */
  const [zone, setZone] = useState<"hero" | "rail">("rail");
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setFocus(Math.max(activeIndex, 0));
      setZone("rail");
    }
  }, [open, activeIndex]);

  const move = useCallback(
    (delta: number) => {
      setFocus((f) => {
        const next = Math.min(Math.max(f + delta, 0), pages.length - 1);
        if (next !== f) {
          haptic("tick");
          rumble(35, 0.22);
        }
        return next;
      });
    },
    [pages.length],
  );

  const openFocused = useCallback(() => {
    const page = pages[focus];
    if (!page) return;
    haptic("select");
    rumble(80, 0.5);
    onPick(page, focus);
  }, [focus, onPick, pages]);

  /** Shared handling for D-pad/stick, A/B and the arrow keys. */
  const handleAction = useCallback(
    (action: GamepadAction) => {
      if (action === "left") move(-1);
      else if (action === "right") move(1);
      else if (action === "up") setZone("hero");
      else if (action === "down") setZone("rail");
      else if (action === "confirm") openFocused();
      else if (action === "back" || action === "menu") {
        rumble(40, 0.25);
        onClose();
      }
    },
    [move, onClose, openFocused],
  );

  const padConnected = useGamepad({ onAction: handleAction, enabled: open });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleAction("back");
      else if (e.key === "ArrowRight") handleAction("right");
      else if (e.key === "ArrowLeft") handleAction("left");
      else if (e.key === "ArrowUp") handleAction("up");
      else if (e.key === "ArrowDown") handleAction("down");
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleAction("confirm");
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleAction]);

  // Keep the focused tile centred in the rail.
  useEffect(() => {
    if (!open) return;
    const rail = railRef.current;
    const tile = rail?.children[focus] as HTMLElement | undefined;
    if (!rail || !tile) return;
    rail.scrollTo({
      left: tile.offsetLeft - rail.clientWidth / 2 + tile.clientWidth / 2,
      behavior: "smooth",
    });
  }, [focus, open]);


  if (!open) return null;

  const hero = pages[focus] ?? pages[0];
  if (!hero) return null;
  const HeroIcon = hero.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="All community pages"
      className="fixed inset-0 z-[70] bg-background/90 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div className="flex h-full flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Ticklelist</p>
            <h2 className="font-display text-xl tracking-wider">Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            {padConnected && (
              <span className="flex items-center gap-1 rounded-full border border-primary/60 bg-primary/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-primary">
                <Gamepad2 className="h-3.5 w-3.5" aria-hidden="true" />
                Controller
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close page switcher"
              className="rounded-full border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Hero tile — the currently focused page, blown up like the Xbox home block. */}
        <div className="px-5 pt-5" style={{ perspective: "1100px" }}>
          <button
            type="button"
            onClick={() => onPick(hero, focus)}
            onMouseEnter={() => setZone("hero")}
            data-focused={zone === "hero" ? "true" : undefined}
            className={cn(
              "group relative w-full overflow-hidden rounded-xl border bg-gradient-to-br p-5 text-left shadow-2xl shadow-primary/20 transition-all duration-300 active:scale-[0.98] outline-none",
              hero.tint,
              zone === "hero"
                ? "border-primary ring-4 ring-primary/60 ring-offset-2 ring-offset-background scale-[1.01]"
                : "border-primary/40",
            )}
            style={{ transform: "rotateX(4deg)", transformStyle: "preserve-3d" }}
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-foreground/10" aria-hidden="true" />
            <div className="relative flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-background/40 backdrop-blur-sm">
                <HeroIcon className="h-8 w-8 text-foreground" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/70">
                  {focus === activeIndex ? "You are here" : "Jump to"}
                </p>
                <p className="font-display text-2xl tracking-wider truncate">{hero.label}</p>
                <p className="text-xs text-foreground/70">
                  {padConnected ? "Press A to open" : "Tap to open"}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Tile rail — snapping, angled, Metro-style blocks. */}
        <div className="flex-1 overflow-hidden pt-6" style={{ perspective: "1200px" }}>
          <div
            ref={railRef}
            className="flex h-full items-start gap-3 overflow-x-auto px-5 pb-10 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ transformStyle: "preserve-3d" }}
          >
            {pages.map((page, i) => {
              const Icon = page.icon;
              const focused = i === focus;
              const selected = focused && zone === "rail";
              const current = i === activeIndex;
              return (
                <button
                  key={page.to}
                  type="button"
                  onClick={() => {
                    setZone("rail");
                    if (focused) onPick(page, i);
                    else setFocus(i);
                  }}
                  className={cn(
                    "relative snap-center shrink-0 rounded-lg border bg-gradient-to-br p-3 text-left transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    page.tint,
                    focused
                      ? "h-36 w-36 border-primary shadow-xl shadow-primary/25"
                      : "h-28 w-28 border-border/70 opacity-70",
                    selected && "ring-4 ring-primary/70 ring-offset-2 ring-offset-background",
                  )}
                  style={{
                    transform: focused
                      ? "translateZ(60px) rotateY(0deg)"
                      : `translateZ(0px) rotateY(${i < focus ? 16 : -16}deg)`,
                  }}
                  aria-current={current ? "page" : undefined}
                  aria-selected={focused}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-background/40">
                    <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
                  </span>
                  <span className="mt-3 block font-display text-sm tracking-wider">{page.label}</span>
                  {current && (
                    <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-foreground/70">
                      Current
                    </span>
                  )}
                  {selected && (
                    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-[11px] font-bold text-background">
                      A
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {padConnected ? (
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-5 pb-8 text-center text-[11px] text-muted-foreground">
            <span>D-pad / stick — move</span>
            <span>
              <span className="mr-1 inline-grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[9px] font-bold text-background">
                A
              </span>
              open
            </span>
            <span>
              <span className="mr-1 inline-grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[9px] font-bold text-background">
                B
              </span>
              close
            </span>
          </p>
        ) : (
          <p className="px-5 pb-8 text-center text-[11px] text-muted-foreground">
            Swipe the rail or use ←/→ · tap a tile to select, tap again to open · controller: D-pad
            to move, A to open, B to close
          </p>
        )}

      </div>
    </div>
  );
};

export default PageSwitcher;
