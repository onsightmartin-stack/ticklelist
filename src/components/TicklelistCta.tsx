import { CheckCircle2, ListChecks, Users } from "lucide-react";
import CrossSiteLink from "@/components/CrossSiteLink";
import { communityHref, COMMUNITY_NAME } from "@/lib/site-links";
import { trackEvent } from "@/lib/analytics";

interface Props {
  /** Optional context line, e.g. "Climbed Kilimanjaro?" */
  headline?: string;
  /** Where the CTA sits — appended as ?ref= so we can see what converts. */
  source?: string;
  className?: string;
  /**
   * A/B variant for the `ticklelist_cta_copy` test. The page owning the CTA
   * assigns the variant via useAbVariant() and passes it down so the
   * exposure event is recorded once and the copy + click tag stay in sync.
   */
  variant?: "A" | "B";
}

/**
 * Conversion block: turns a reader of a peak/guide page into a Ticklelist
 * member. Rendered near the bottom of long content pages (variant A) or
 * higher up the page (variant B) depending on the A/B assignment.
 */
const TicklelistCta = ({
  headline,
  source = "onsightmartin",
  className = "",
  variant = "A",
}: Props) => {
  const href = `${communityHref("/")}${communityHref("/").includes("?") ? "&" : "?"}ref=${encodeURIComponent(source)}`;
  const isB = variant === "B";

  const handleClick = () => {
    trackEvent("ticklelist_cta_click", { source, variant });
  };

  const resolvedHeadline =
    headline ??
    (isB ? `Join the climbers on ${COMMUNITY_NAME}` : `Keep your own tick list on ${COMMUNITY_NAME}`);
  const subCopy = isB
    ? "Tick summits, map your country count and follow climbers chasing the same peaks as you. Free — sign up in under a minute."
    : "Log the summits you've climbed, build bucket lists, follow other climbers and watch your country count grow. Free, and built by climbers for climbers.";
  const ctaLabel = isB ? "Build your tick list now" : "Start your tick list — it's free";

  return (
    <section className={`rounded-xl border border-primary/40 bg-primary/5 p-6 ${className}`}>
      <h2 className="font-display text-lg tracking-wide text-foreground">
        {resolvedHeadline}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{subCopy}</p>
      <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Tick ascents with dates & photos
        </li>
        <li className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Track challenge lists & goals
        </li>
        <li className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Follow climbers, share trips
        </li>
      </ul>
      <CrossSiteLink
        href={href}
        onClick={handleClick}
        className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        {ctaLabel}
      </CrossSiteLink>
    </section>
  );
};

export default TicklelistCta;
