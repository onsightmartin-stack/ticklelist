import type { CommunityPage } from "@/lib/community-pages";

interface Props {
  pages: CommunityPage[];
  index: number;
  /** Direction whose swipe threshold is armed, for previewing the target dot. */
  armed: "left" | "right" | null;
}

/**
 * Tiny phone-style page dots so it is clear where you are in the community
 * page order and which page a swipe will land on.
 */
const PageProgress = ({ pages, index, armed }: Props) => {
  if (index < 0 || pages.length < 2) return null;

  const target =
    armed === "left" ? index + 1 : armed === "right" ? index - 1 : index;
  const current = pages[index];

  return (
    <div
      className="md:hidden pointer-events-none fixed inset-x-0 bottom-[4.5rem] z-[54] flex flex-col items-center gap-1.5"
      role="status"
      aria-live="polite"
      aria-label={`Page ${index + 1} of ${pages.length}: ${current?.label ?? ""}`}
    >
      <span className="rounded-full bg-card/80 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
        {index + 1} / {pages.length}
      </span>
      <div className="flex items-center gap-1.5 rounded-full bg-card/70 px-2.5 py-1.5 backdrop-blur">
        {pages.map((page, i) => {
          const active = i === index;
          const isTarget = i === target && target !== index;
          return (
            <span
              key={page.to}
              aria-hidden="true"
              className={`rounded-full transition-all duration-200 ${
                active
                  ? "h-1.5 w-5 bg-primary"
                  : isTarget
                    ? "h-1.5 w-3 bg-primary/70"
                    : "h-1.5 w-1.5 bg-muted-foreground/40"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PageProgress;
