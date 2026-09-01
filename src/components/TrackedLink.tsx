import type { AnchorHTMLAttributes } from "react";
import { trackOutboundClick } from "@/lib/track-click";

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /** Click category, e.g. "youtube_video" or "youtube_channel". */
  kind: string;
  videoId?: string | null | undefined;
  /** Human label shown in the stats dashboard, e.g. the video or peak name. */
  trackLabel?: string | null | undefined;
}

/**
 * External link that records the click before opening, so the YouTube stats
 * page can show which links visitors actually use.
 */
const TrackedLink = ({ href, kind, videoId, trackLabel, onClick, children, ...rest }: Props) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => {
      trackOutboundClick({ kind, url: href, videoId, label: trackLabel });
      onClick?.(e);
    }}
    {...rest}
  >
    {children}
  </a>
);

export default TrackedLink;
