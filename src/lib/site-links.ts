/**
 * Cross-site link config.
 *
 * Ticklelist (the community) and Onsight Martin (the main site) are two
 * separate experiences. They are cross-linked, never merged.
 *
 * Set VITE_COMMUNITY_URL (e.g. https://ticklelist.org) once the community
 * lives on its own domain — every "Community" link then points off-site and
 * opens in a new tab. Without it, links stay on the in-app /community path.
 */

const raw = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\/+$/, "") : "");

export const COMMUNITY_ORIGIN = raw(import.meta.env['VITE_COMMUNITY_URL']);
export const MAIN_SITE_ORIGIN = raw(import.meta.env['VITE_MAIN_SITE_URL']) || "https://onsightmartin.com";

/** True when the community is served from its own domain. */
export const COMMUNITY_IS_EXTERNAL = COMMUNITY_ORIGIN.length > 0;

/** Hostnames that serve the community (bare + www). Empty when no community domain is set. */
export function communityHostnames(): string[] {
  if (!COMMUNITY_ORIGIN) return [];
  try {
    const h = new URL(COMMUNITY_ORIGIN).hostname.toLowerCase();
    return [h, `www.${h}`];
  } catch {
    return [];
  }
}

/** True when the current page is being served from the community domain. */
export function isOnCommunityOrigin(): boolean {
  if (!COMMUNITY_IS_EXTERNAL || typeof window === "undefined") return false;
  try {
    return new URL(COMMUNITY_ORIGIN).host === window.location.host;
  } catch {
    return false;
  }
}

/** Link to a page inside the community (path relative to /community). */
export function communityHref(path = "/"): string {
  const p = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return COMMUNITY_IS_EXTERNAL ? `${COMMUNITY_ORIGIN}${p || "/"}` : `/community${p}`;
}

/** Link to a page on the main Onsight Martin site. */
export function mainSiteHref(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return COMMUNITY_IS_EXTERNAL || isOnCommunityOrigin() ? `${MAIN_SITE_ORIGIN}${p}` : p;
}

export const COMMUNITY_NAME = "Ticklelist";
export const MAIN_SITE_NAME = "Onsight Martin";
