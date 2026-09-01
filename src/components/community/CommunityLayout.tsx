import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "@/lib/router-compat";
import { Menu, X, LogOut, Settings, User, KeyRound, Link2, Heart, ArrowLeft, Compass } from "lucide-react";

import ticklelistLogo from "@/assets/ticklelist-logo.png";
import { Button } from "@/components/ui/button";
import BottomTabBar from "@/components/community/BottomTabBar";
import MemberAvatar from "@/components/community/MemberAvatar";
import NotificationsBell from "@/components/community/NotificationsBell";
import UniversalSearch from "@/components/community/UniversalSearch";
import SwipeNavigator from "@/components/community/SwipeNavigator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import CrossSiteLink from "@/components/CrossSiteLink";
import { mainSiteHref, MAIN_SITE_NAME } from "@/lib/site-links";
import { cn } from "@/lib/utils";

const links = [
  { to: "/community/intro", label: "Introduction", auth: false },
  { to: "/community", label: "Feed", end: true, auth: false },
  { to: "/community/wall", label: "Wall", auth: false },
  { to: "/community/my-adventures", label: "My adventures", auth: true },
  { to: "/community/adventures", label: "Plan / Join adventures", auth: true },
  { to: "/community/ascents", label: "All ascents", auth: true },
  { to: "/community/list-builder", label: "List builder", auth: true },
  { to: "/community/leaderboard", label: "Leaderboard", auth: true },
  { to: "/community/members", label: "Members", auth: true },
  { to: "/community/basecamp", label: "Base Camp", auth: true },
  { to: "/community/following", label: "Following", auth: true },
  { to: "/community/help", label: "Help", auth: false },
  { to: "/community/support", label: "Support", auth: false },
];


const CommunityLayout = ({ children }: { children: ReactNode }) => {
  const { user, profile, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate("/community", { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "text-xs whitespace-nowrap transition-colors px-1.5 py-1 rounded-md",
      isActive ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground",
    );

  const visibleLinks = links.filter((l) => user || !l.auth);


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/community" className="flex items-center gap-2 shrink-0">
            <img src={ticklelistLogo} alt="Ticklelist logo" width={40} height={40} className="w-8 h-8" />
            <span className="font-display tracking-wider text-lg">Ticklelist</span>
          </Link>

          <nav className="hidden md:flex flex-nowrap items-center gap-0.5 ml-2 flex-1 min-w-0 overflow-x-auto scrollbar-none">
            {visibleLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>


          <div className="ml-auto flex items-center gap-2 shrink-0">
            {user && <UniversalSearch className="hidden sm:block md:hidden xl:block w-56 xl:w-64" />}
            {user && <div className="md:hidden"><NotificationsBell /></div>}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-full border border-border pl-1 pr-3 py-1 hover:bg-secondary transition-colors"
                    aria-label="Account menu"
                  >
                    <MemberAvatar
                      path={profile?.avatar_url ?? null}
                      name={profile?.display_name ?? "Climber"}
                      className="h-7 w-7"
                    />
                    <span className="hidden sm:inline text-xs text-muted-foreground max-w-[9rem] truncate">
                      {profile?.display_name ?? "Climber"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 bg-popover">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Signed in as</p>
                    <p className="text-sm font-display tracking-wider mt-1">{profile?.display_name ?? "Climber"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/community/members/${user.id}`)}>
                    <User className="w-4 h-4 mr-2" /> My profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/community/my-adventures")}>
                    <Compass className="w-4 h-4 mr-2" /> My adventures
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/community/settings")}>
                    <Settings className="w-4 h-4 mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/account/password")}>
                    <KeyRound className="w-4 h-4 mr-2" /> Change password
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/account/linked")}>
                    <Link2 className="w-4 h-4 mr-2" /> Linked accounts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <CrossSiteLink href={mainSiteHref("/")} className="flex items-center w-full cursor-pointer">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back to {MAIN_SITE_NAME}
                    </CrossSiteLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : loading ? (
              <div className="h-8 w-24 rounded-full bg-secondary animate-pulse" aria-hidden="true" />
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}


            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-border px-4 py-3 flex flex-col gap-1">
            {user && <UniversalSearch className="mb-2 sm:hidden" />}
            {visibleLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/community/notifications" className={linkClass} onClick={() => setOpen(false)}>
                  Notifications
                </NavLink>
                <NavLink to="/community/settings" className={linkClass} onClick={() => setOpen(false)}>
                  Settings
                </NavLink>
                <button
                  onClick={handleSignOut}
                  className="text-left text-sm px-2 py-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/auth" className={linkClass({ isActive: false })} onClick={() => setOpen(false)}>
                Sign in to unlock the community
              </Link>
            )}
          </div>
        )}

        <div className="border-t border-border bg-secondary/30">
          <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center gap-2 text-[11px]">
            {user && <UniversalSearch className="hidden md:block xl:hidden order-last ml-auto w-64 shrink-0" />}
            {user ? (
              <p className="text-muted-foreground truncate">
                <span className="uppercase tracking-[0.2em] text-primary">Signed in as</span>{" "}
                <Link to={`/community/members/${user.id}`} className="text-foreground hover:underline">
                  {profile?.display_name ?? "Climber"}
                </Link>
              </p>
            ) : loading ? (
              <p className="text-muted-foreground truncate">
                <span className="uppercase tracking-[0.2em] text-primary">Checking session…</span>
              </p>
            ) : (
              <p className="text-muted-foreground truncate">
                <span className="uppercase tracking-[0.2em] text-primary">Not signed in</span>{" "}
                <Link to="/auth" className="text-foreground hover:underline">
                  Sign in
                </Link>{" "}
                to see the feed, members and leaderboards.
              </p>
            )}
          </div>
        </div>

      </header>


      <SwipeNavigator>
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 pb-28 md:pb-8">{children}</main>
      </SwipeNavigator>

      <BottomTabBar />

      <footer className="hidden md:block border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>Ticklelist — a community by Onsight Martin.</p>
          <div className="flex items-center gap-4">
            <CrossSiteLink href={mainSiteHref("/")} className="hover:text-foreground transition-colors">
              {MAIN_SITE_NAME}
            </CrossSiteLink>
            <CrossSiteLink href={mainSiteHref("/where")} className="hover:text-foreground transition-colors">
              Where is Martin?
            </CrossSiteLink>
            <Link to="/community/support" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
              <Heart className="w-3 h-3" /> Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CommunityLayout;
