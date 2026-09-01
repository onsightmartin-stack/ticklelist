import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { youtubeThumb, youtubeWatchUrl, type LinkPreview } from "@/lib/link-preview";
import { cn } from "@/lib/utils";

interface Props {
  preview: LinkPreview;
  className?: string;
}

/**
 * Renders an inline preview card for a link found in post text: a YouTube
 * thumbnail that plays in place, a direct image, or a compact link chip.
 */
const LinkPreviewCard = ({ preview, className }: Props) => {
  const [playing, setPlaying] = useState(false);
  const [broken, setBroken] = useState(false);

  if (preview.kind === "youtube" && preview.videoId) {
    return (
      <div className={cn("mt-3 overflow-hidden rounded-md border border-border", className)}>
        {playing ? (
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${preview.videoId}?autoplay=1`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Play YouTube video"
            className="group relative block aspect-video w-full"
          >
            <img
              src={youtubeThumb(preview.videoId)}
              alt="YouTube video thumbnail"
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-background/20 transition-colors group-hover:bg-background/40">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/85 border border-border">
                <Play className="w-6 h-6 text-primary fill-current" />
              </span>
            </span>
          </button>
        )}
        <a
          href={youtubeWatchUrl(preview.videoId)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-primary"
        >
          <ExternalLink className="w-3 h-3" /> Watch on YouTube
        </a>
      </div>
    );
  }

  if (preview.kind === "image" && !broken) {
    return (
      <a
        href={preview.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("mt-3 block overflow-hidden rounded-md border border-border", className)}
      >
        <img
          src={preview.url}
          alt={`Shared image from ${preview.host}`}
          loading="lazy"
          onError={() => setBroken(true)}
          className="w-full max-h-[520px] object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mt-3 flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:border-primary/50",
        className,
      )}
    >
      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{preview.host}</span>
      <span className="truncate opacity-60">{preview.url}</span>
    </a>
  );
};

export default LinkPreviewCard;
