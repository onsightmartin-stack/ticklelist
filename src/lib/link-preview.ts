import { youtubeId } from "@/lib/wall-media";

export interface LinkPreview {
  kind: "youtube" | "image" | "link";
  /** Full URL as written in the text. */
  url: string;
  /** YouTube video id, when kind is "youtube". */
  videoId?: string;
  /** Hostname shown on generic link cards. */
  host: string;
}

const URL_RE = /https?:\/\/[^\s<>"']+/gi;
const IMAGE_RE = /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i;

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

/** YouTube thumbnail for a video id (falls back gracefully in the browser). */
export const youtubeThumb = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

export const youtubeWatchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

/**
 * Finds the first previewable link inside a chunk of post text so the feed can
 * render a card instead of a bare URL. Only YouTube videos and direct image
 * links get rich previews; everything else becomes a compact link card.
 */
export const findPreview = (text: string): LinkPreview | null => {
  const urls = text.match(URL_RE);
  if (!urls) return null;

  for (const raw of urls) {
    const url = raw.replace(/[),.;!?]+$/, "");
    const host = hostOf(url);
    if (!host) continue;

    const vid = youtubeId(url);
    if (vid) return { kind: "youtube", url, videoId: vid, host };
    if (IMAGE_RE.test(url)) return { kind: "image", url, host };
  }

  const first = urls[0]!.replace(/[),.;!?]+$/, "");
  const host = hostOf(first);
  return host ? { kind: "link", url: first, host } : null;
};
