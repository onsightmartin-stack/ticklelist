import { Youtube } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";


const CHANNEL_URL = "https://www.youtube.com/@onsightmartin?sub_confirmation=1";

interface Props {
  /** Optional context line, e.g. "Kilimanjaro, Tanzania". */
  context?: string | undefined;
  className?: string | undefined;
}

/**
 * Persistent subscribe card. Uses ?sub_confirmation=1 so YouTube opens the
 * channel with the subscribe dialog already up.
 */
const YouTubeCta = ({ context, className = "" }: Props) => (
  <div className={`bg-card border border-border rounded-lg p-5 ${className}`}>
    <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
      <Youtube className="w-5 h-5 text-red-500" aria-hidden="true" /> Follow the climbs
    </h3>
    <p className="text-sm text-muted-foreground mt-2">
      {context
        ? `Every summit — including ${context} — is filmed and posted on YouTube.`
        : "Every summit on the way to all 195 country highpoints is filmed and posted on YouTube."}
    </p>
    <TrackedLink
      href={CHANNEL_URL}
      kind="youtube_channel"
      trackLabel={context ? `Subscribe card — ${context}` : "Subscribe card"}
      className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-display font-bold tracking-wide text-white hover:bg-red-500 transition-colors"
    >
      <Youtube className="w-4 h-4" aria-hidden="true" /> Subscribe on YouTube
    </TrackedLink>

  </div>
);

export default YouTubeCta;
