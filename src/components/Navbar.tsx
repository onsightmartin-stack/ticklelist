import { useState } from "react";
import { Mountain, Instagram, Youtube, Menu, X } from "lucide-react";
import { Link, useLocation } from "@/lib/router-compat";
import { useVisitorCount } from "@/hooks/useVisitorCount";
import CrossSiteLink from "@/components/CrossSiteLink";
import { communityHref, COMMUNITY_NAME } from "@/lib/site-links";

const navLinks = [
  { href: "/#progress", label: "Progress" },
  { to: "/featured", label: "Featured Peaks" },
  { to: "/guides", label: "Guides" },
  { to: "/other-peaks", label: "Other Peaks" },
  { to: "/latest", label: "Latest Climbs" },
  { to: "/team", label: "Team" },
  { to: "/where", label: "Where is Martin?" },
  { to: "/balkan-route", label: "Balkan Route" },
  { to: "/support", label: "Support" },
  { href: "/#about", label: "About" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const visitorCount = useVisitorCount();

  const renderLink = (link: (typeof navLinks)[number], className: string, onClick?: () => void) => {
    if ("external" in link && link.external) {
      return (
        <CrossSiteLink key={link.label} href={link.href!} className={className} {...(onClick ? { onClick } : {})}>
          {link.label}
        </CrossSiteLink>
      );
    }
    if (link.to) {
      return (
        <Link key={link.label} to={link.to} className={className} onClick={onClick}>
          {link.label}
        </Link>
      );
    }
    // If we're not on the index page, use full path for hash links
    const href = location.pathname === "/" ? link.href!.replace("/#", "#") : link.href!;
    return (
      <a key={link.label} href={href} className={className} onClick={onClick}>
        {link.label}
      </a>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center gap-2 py-3 px-4">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 font-display text-base sm:text-lg tracking-wider text-foreground">
          <Mountain className="w-5 h-5 shrink-0 text-primary" />
          <span className="truncate">Onsight Martin</span>
        </Link>
        <span className="hidden xl:inline shrink-0 text-[10px] tracking-[0.25em] uppercase text-foreground font-display">
          Climbing the highest mountain of every country on Earth.
        </span>
        {/* Desktop nav links — single nowrap row, only at lg+ */}
        <div className="hidden lg:flex flex-1 min-w-0 flex-nowrap items-center justify-center gap-x-3 gap-y-0">
          {navLinks.map(link =>
            renderLink(link, "whitespace-nowrap text-sm text-muted-foreground hover:text-foreground transition-colors")
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 ml-auto">
          {visitorCount !== null && (
            <span className="text-[8px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.15em] uppercase text-foreground font-display shrink-0">
              Visitor #{visitorCount.toLocaleString()}
            </span>
          )}
          <CrossSiteLink
            href={communityHref("/")}
            className="hidden sm:inline-flex shrink-0 items-center rounded-full border border-primary/60 px-3 py-1 text-sm text-primary hover:bg-primary/10 transition-colors"
          >
            {COMMUNITY_NAME}
          </CrossSiteLink>
          <a href="https://www.youtube.com/@onsightmartin" target="_blank" rel="noopener noreferrer" aria-label="Onsight Martin on YouTube" title="Onsight Martin on YouTube" className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
            <Youtube className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">Onsight Martin on YouTube</span>
          </a>
          <a href="https://www.instagram.com/onsightmartin" target="_blank" rel="noopener noreferrer" aria-label="Onsight Martin on Instagram" title="Onsight Martin on Instagram" className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
            <Instagram className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">Onsight Martin on Instagram</span>
          </a>
          <button onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} className="lg:hidden shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-background border-t border-border px-4 py-4 flex flex-col gap-3">
          <CrossSiteLink
            href={communityHref("/")}
            className="text-sm text-primary hover:underline py-1"
            onClick={() => setOpen(false)}
          >
            {COMMUNITY_NAME} — the climbing community
          </CrossSiteLink>
          {navLinks.map(link =>
            renderLink(link, "text-sm text-muted-foreground hover:text-foreground transition-colors py-1", () => setOpen(false))
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
