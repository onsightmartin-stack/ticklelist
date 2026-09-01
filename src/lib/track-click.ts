import { logOutboundClick } from "@/lib/click-track.functions";

export interface ClickInfo {
  /** e.g. "youtube_video", "youtube_channel", "youtube_search", "support" */
  kind: string;
  url: string;
  videoId?: string | null | undefined;
  label?: string | null | undefined;
}

/** Extracts a YouTube video id from watch/embed/short links. */
export const videoIdFromUrl = (url: string): string | null => {
  const m =
    url.match(/[?&]v=([\w-]{6,20})/) ||
    url.match(/youtu\.be\/([\w-]{6,20})/) ||
    url.match(/\/embed\/([\w-]{6,20})/);
  return m?.[1] ?? null;
};

/**
 * Fire-and-forget click logging. Never blocks or breaks navigation — the link
 * opens in a new tab regardless of whether the log call succeeds.
 */
export const trackOutboundClick = (info: ClickInfo) => {
  if (typeof window === "undefined") return;
  void logOutboundClick({
    data: {
      kind: info.kind,
      url: info.url,
      videoId: info.videoId ?? videoIdFromUrl(info.url),
      label: info.label ?? null,
      pagePath: window.location.pathname,
    },
  }).catch(() => {
    /* analytics is best-effort */
  });
};
