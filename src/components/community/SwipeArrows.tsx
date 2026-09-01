import { ChevronLeft, ChevronRight } from "lucide-react";

import type { CommunityPage } from "@/lib/community-pages";

interface Props {
  prev?: CommunityPage | undefined;
  next?: CommunityPage | undefined;
  /** Current horizontal drag offset in px (negative = swiping left). */
  drag: number;
  /** Direction whose commit threshold is armed. */
  armed: "left" | "right" | null;
  /** Whether the entry glide animation should play. */
  animate: boolean;
}

/**
 * Chunky 3D chevrons parked on the screen edges so it is obvious the page can
 * be swiped left and right. They tilt in perspective, light up while a swipe
 * is armed, and lean with the drag like a physical control.
 */
const Arrow = ({
  side,
  page,
  drag,
  armed,
  animate,
}: {
  side: "left" | "right";
  page: CommunityPage;
  drag: number;
  armed: boolean;
  animate: boolean;
}) => {
  const dir = side === "left" ? 1 : -1;
  // Lean into the swipe: the arrow you're heading toward pushes out.
  const lean = Math.max(-10, Math.min(10, drag * 0.18)) * -dir;
  const Icon = side === "left" ? ChevronLeft : ChevronRight;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-1/2 z-30 -translate-y-1/2 md:hidden ${
        side === "left" ? "left-1" : "right-1"
      }`}
      style={{ perspective: "420px" }}
    >
      <div
        className="flex flex-col items-center gap-1"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${dir * 32 + lean}deg) translateZ(0)`,
          transition: "transform 0.18s ease-out",
          animation: animate
            ? `arrow-float-${side} 2.6s ease-in-out infinite`
            : undefined,
        }}
      >
        <span
          className={`relative grid h-11 w-11 place-items-center rounded-2xl border transition-colors duration-200 ${
            armed
              ? "border-primary bg-primary/30 text-primary"
              : "border-primary/40 bg-card/70 text-primary/80"
          }`}
          style={{
            boxShadow: armed
              ? `${dir * -6}px 6px 0 0 hsl(var(--primary) / 0.35), 0 10px 24px -8px hsl(var(--primary) / 0.7)`
              : `${dir * -5}px 5px 0 0 hsl(var(--primary) / 0.18), 0 8px 18px -10px rgb(0 0 0 / 0.8)`,
            backdropFilter: "blur(4px)",
          }}
        >
          <Icon className="h-6 w-6" strokeWidth={3} />
        </span>
        <span className="max-w-[74px] truncate rounded-full bg-background/70 px-2 py-[2px] text-center text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          {page.label}
        </span>
      </div>
    </div>
  );
};

const SwipeArrows = ({ prev, next, drag, armed, animate }: Props) => (
  <>
    {prev && (
      <Arrow side="left" page={prev} drag={drag} armed={armed === "right"} animate={animate} />
    )}
    {next && (
      <Arrow side="right" page={next} drag={drag} armed={armed === "left"} animate={animate} />
    )}
  </>
);

export default SwipeArrows;
