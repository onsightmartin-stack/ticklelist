import {
  BookOpen,
  Camera,
  Home,
  MessageSquare,
  Mountain,
  Compass,
  Trophy,
  Users,
  Tent,
  UserPlus,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface CommunityPage {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Requires a signed-in member. */
  auth: boolean;
  /** Tailwind gradient classes for the app-icon tile. */
  tint: string;
  /**
   * Utility pages (alerts, settings, following) live in the header menu only —
   * keeping them out of the swipe deck makes the carousel short and meaningful.
   */
  utility?: boolean;
}

/**
 * Ordered "home screen" of the community app. Swipe order and the zoomed-out
 * app-icon grid both read from this list, so they can never drift apart.
 * The deck wraps around, so Feed swipes right to Wall and left to Base Camp.
 */
export const COMMUNITY_PAGES: CommunityPage[] = [
  { to: "/community/intro", label: "Introduction", icon: BookOpen, auth: false, tint: "from-cyan-500/70 to-cyan-500/15" },
  { to: "/community", label: "Feed", icon: Home, auth: false, tint: "from-primary/70 to-primary/20" },
  { to: "/community/wall", label: "Wall", icon: MessageSquare, auth: false, tint: "from-pink-500/70 to-pink-500/15" },
  { to: "/community/photo-vote", label: "Photo Vote", icon: Camera, auth: false, tint: "from-fuchsia-500/70 to-fuchsia-500/15" },
  { to: "/community/ascents", label: "Ascents", icon: Mountain, auth: true, tint: "from-sky-500/70 to-sky-500/15" },
  { to: "/community/my-adventures", label: "My Adventures", icon: Compass, auth: true, tint: "from-lime-500/70 to-lime-500/15" },
  { to: "/community/adventures", label: "Adventures", icon: Compass, auth: true, tint: "from-emerald-500/70 to-emerald-500/15" },
  { to: "/community/leaderboard", label: "Leaderboard", icon: Trophy, auth: true, tint: "from-yellow-500/70 to-yellow-500/15" },
  { to: "/community/frontrunners", label: "Front Runners", icon: Trophy, auth: true, tint: "from-amber-400/70 to-amber-400/15" },
  { to: "/community/members", label: "Members", icon: Users, auth: true, tint: "from-violet-500/70 to-violet-500/15" },
  { to: "/community/basecamp", label: "Base Camp", icon: Tent, auth: true, tint: "from-teal-500/70 to-teal-500/15" },
  { to: "/community/following", label: "Following", icon: UserPlus, auth: true, tint: "from-rose-500/70 to-rose-500/15", utility: true },
  { to: "/community/notifications", label: "Alerts", icon: Bell, auth: true, tint: "from-orange-500/70 to-orange-500/15", utility: true },
  { to: "/community/settings", label: "Settings", icon: Settings, auth: true, tint: "from-slate-500/70 to-slate-500/15", utility: true },
];

/** Pages the current visitor may swipe between (utility pages excluded). */
export const visiblePages = (signedIn: boolean) =>
  COMMUNITY_PAGES.filter((p) => (signedIn || !p.auth) && !p.utility);

/** Index of the page matching a pathname, or -1. */
export const pageIndex = (pages: CommunityPage[], pathname: string) => {
  const clean = pathname.replace(/\/+$/, "") || "/community";
  let best = -1;
  let bestLen = -1;
  pages.forEach((p, i) => {
    if (clean === p.to || (p.to !== "/community" && clean.startsWith(`${p.to}/`))) {
      if (p.to.length > bestLen) {
        best = i;
        bestLen = p.to.length;
      }
    }
  });
  return best;
};

/** Wrap an index around the deck so the carousel is endless in both directions. */
export const wrapIndex = (length: number, i: number) =>
  length > 0 ? ((i % length) + length) % length : 0;

