import { Link } from "@/lib/router-compat";
import { Mountain, ArrowRight } from "lucide-react";
import { ascentLinkForCountry } from "@/lib/peak-match";

interface Props {
  country: string | null | undefined;
  peakName?: string | undefined;
  /** "card" renders a boxed CTA, "inline" a compact button. */
  variant?: "card" | "inline";
  className?: string | undefined;
}

/**
 * "Match me to this peak" — opens the community summit log with this exact
 * peak pre-selected, so a visitor coming from YouTube can log or plan it.
 */
const MatchMeCta = ({ country, peakName, variant = "card", className = "" }: Props) => {
  const href = ascentLinkForCountry(country);
  if (!href) return null;

  if (variant === "inline") {
    return (
      <Link
        to={href}
        className={`inline-flex items-center justify-center gap-2 border border-primary/50 text-primary px-4 py-2 rounded-sm font-display tracking-wider text-sm hover:bg-primary hover:text-primary-foreground transition-colors ${className}`}
      >
        <Mountain className="w-4 h-4" aria-hidden="true" /> Match me to this peak
      </Link>
    );
  }

  return (
    <div className={`bg-card border border-primary/30 rounded-lg p-5 ${className}`}>
      <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
        <Mountain className="w-5 h-5 text-primary" aria-hidden="true" /> Climbed it? Planning it?
      </h3>
      <p className="text-sm text-muted-foreground mt-2">
        Log {peakName ?? "this summit"} in the Ticklelist — the form opens with the peak already
        filled in, and you can find others heading there.
      </p>
      <Link
        to={href}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-display font-bold tracking-wide text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Match me to this peak <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  );
};

export default MatchMeCta;
