import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import NativeHomeRedirect from "@/components/NativeHomeRedirect";
import InstallAppPrompt from "@/components/InstallAppPrompt";
import PostAuthRedirect from "@/components/PostAuthRedirect";
import Celebration from "@/components/Celebration";
import ThemeSync from "@/components/community/ThemeSync";
import NotFound from "@/pages/NotFound";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import appCss from "../styles.css?url";
import { themeBootstrapScript } from "@/lib/themes";
import { motionBootstrapScript } from "@/lib/motion";
import { useAnalyticsPageViews } from "@/lib/analytics";


/**
 * Current request host — read from the browser on the client and from the
 * request on the server. createIsomorphicFn keeps the server-only import out
 * of the client bundle.
 */
const currentHost = createIsomorphicFn()
  .client(() => window.location.host.toLowerCase())
  .server(async () => {
    const { getRequestHost } = await import("@tanstack/react-start/server");
    return (getRequestHost() ?? "").toLowerCase();
  });

/**
 * Canonical apex for the community domain. Visiting the www variant
 * permanently redirects here (308) so search engines consolidate link
 * equity onto the clean apex URL.
 */
const COMMUNITY_APEX_HOST = "ticklelist.org";
const COMMUNITY_WWW_HOST = "www.ticklelist.org";

/** Redirect the Android WebView before React paints. This also repairs older
 * APKs that do not yet carry the TicklelistApp user-agent suffix. */
const nativeRouteGuardScript = `(() => {
  try {
    const ua = navigator.userAgent || "";
    const androidWebView = /Android/i.test(ua) && /;\\s*wv\\)|\\bwv\\b|Version\\/4\\.0/i.test(ua);
    const nativeShell = /TicklelistApp/i.test(ua) || androidWebView;
    const allowed = /^\\/(community(?:\\/|$)|auth(?:\\/|$)|account(?:\\/|$))/.test(location.pathname);
    if (nativeShell && !allowed) location.replace("/community");
  } catch (_) {}
})();`;
const websiteJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Onsight Martin",
  url: "https://onsightmartin.com",
  description:
    "Martin Gårdling's country highpointing project — climbing the highest peak of every country on Earth.",
  author: {
    "@type": "Person",
    name: "Martin Gårdling",
    url: "https://www.youtube.com/@onsightmartin",
  },
});

const organizationJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Onsight Martin",
  url: "https://onsightmartin.com",
  logo: "https://onsightmartin.com/app-icon-512.png",
  description:
    "Martin Gårdling's project to climb the highest mountain of every country on Earth.",
  founder: {
    "@type": "Person",
    name: "Martin Gårdling",
    url: "https://www.youtube.com/@onsightmartin",
  },
  sameAs: [
    "https://www.youtube.com/@onsightmartin",
    "https://www.instagram.com/onsightmartin",
    "https://www.peakbagger.com/climber/climber.aspx?cid=42297",
  ],
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ location }) => {
    // www.ticklelist.org → ticklelist.org (308 permanent, preserve path)
    const host = await currentHost();
    if (host === COMMUNITY_WWW_HOST) {
      throw redirect({
        href: `https://${COMMUNITY_APEX_HOST}${location.href}`,
        statusCode: 308,
      });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, viewport-fit=cover" },
      { name: "theme-color", content: "#0a0c10" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Ticklelist" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "Onsight Martin — Climbing Every Country's Highest Peak" },
      {
        name: "description",
        content:
          "Martin Gårdling's quest to summit the highest mountain of every country. Track progress across 195 countries with difficulty ratings and climb dates.",
      },
      { name: "author", content: "Martin Gårdling" },
      {
        name: "google-site-verification",
        content: "x1iy3-qjceIvzqM-JForVsTnSFfro3TK4lT8tiC_Z-Q",
      },
      {
        name: "keywords",
        content:
          "country highpointing, highest peak every country, mountain climbing, Martin Gårdling, highpoint challenge, mountaineering, summit tracker, country high points list",
      },
      { property: "og:title", content: "Onsight Martin — Country Highpointing" },
      {
        property: "og:description",
        content: "Climbing the highest mountain of every country on Earth. Follow the journey.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://onsightmartin.com/" },
      { property: "og:image", content: "https://onsightmartin.com/og-image.jpg" },
      { property: "og:image:width", content: "1024" },
      { property: "og:image:height", content: "1024" },
      { property: "og:site_name", content: "Onsight Martin" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Onsight Martin — Country Highpointing" },
      {
        name: "twitter:description",
        content: "Climbing the highest mountain of every country on Earth. Follow the journey.",
      },
      { name: "twitter:image", content: "https://onsightmartin.com/og-image.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/app-icon-192.png" },
    ],
    scripts: [
      { type: "application/ld+json", children: websiteJsonLd },
      { type: "application/ld+json", children: organizationJsonLd },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: nativeRouteGuardScript }} />
        {/* Applied inline before first paint. Kept here (not in head.scripts)
            because untyped script entries are not emitted by HeadContent. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <script dangerouslySetInnerHTML={{ __html: motionBootstrapScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useAnalyticsPageViews();
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <AuthProvider>
            <NativeHomeRedirect />
            <InstallAppPrompt />
            <PostAuthRedirect />
            <Celebration />
            <ThemeSync />
            <Outlet />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

function RootErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  console.error(error);
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-xl font-bold">This page didn't load</h1>
        <p className="text-muted-foreground">
          Something went wrong on our end. You can try again or head back home.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a className="px-4 py-2 rounded-md border border-border" href="/">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
