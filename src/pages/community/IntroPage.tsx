import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Bell,
  Camera,
  Compass,
  Home,
  ListChecks,
  MapPin,
  MessageSquare,
  Mountain,
  Palette,
  Search,
  Smartphone,
  Sparkles,
  Tent,
  Trophy,
  Users,
} from "lucide-react";
import Seo from "@/components/Seo";
import CommunityLayout from "@/components/community/CommunityLayout";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/hooks/useAuth";

interface Feature {
  icon: LucideIcon;
  title: string;
  to?: string;
  body: string;
  how: string[];
}

const sections: { heading: string; blurb: string; features: Feature[] }[] = [
  {
    heading: "Start here",
    blurb: "The three things you'll use every day.",
    features: [
      {
        icon: Search,
        title: "Search anything",
        body:
          "The search bar at the top searches over a million summits worldwide plus places, landmarks and members. It's fuzzy, so typos and half-remembered names still find the peak.",
        how: [
          "Type a summit, a country, a landmark or a member name.",
          "Pick a suggestion to log it straight away, or open its page.",
          "Elevation shows in metres or feet automatically, based on your country.",
        ],
      },
      {
        icon: Mountain,
        title: "Log an ascent",
        to: "/community/ascents",
        body:
          "Every climb you tick feeds your XP, your badges, your lists and the rankings. Quick Add asks only what and when — everything else is optional.",
        how: [
          "Quick Add: search the peak, set the date, done.",
          "Dates can be an exact day, a month and year, or just a year.",
          "\"Add more info\" holds notes, photos, partners, guiding and oxygen.",
          "Duplicates on the same day are blocked automatically.",
        ],
      },
      {
        icon: MapPin,
        title: "Log a place",
        to: "/community/adventures",
        body:
          "Not everything is a summit. Countries visited, sightseeing spots, oceans swum and poles reached all count towards Explorer XP.",
        how: [
          "Add places the same way you add ascents.",
          "Climbing a country high point marks that country as visited automatically.",
        ],
      },
    ],
  },
  {
    heading: "Your progress",
    blurb: "Where your ticks turn into numbers, levels and bragging rights.",
    features: [
      {
        icon: Compass,
        title: "My Adventures",
        to: "/community/my-adventures",
        body:
          "Your personal hub: total ascents, country high points, countries visited, and every tick list you're chipping away at.",
        how: [
          "Tabs for ascents, places, lists and mixed challenges.",
          "Tap any list to expand it and see exactly which entries you've ticked.",
          "Sort by latest, highest or alphabetical, and switch list density (small fits ~70 rows on a screen).",
          "Edit or delete anything — XP recalculates instantly.",
        ],
      },
      {
        icon: ListChecks,
        title: "Lists & challenges",
        to: "/community/my-adventures",
        body:
          "UN member high points, mainland high points, the 82 Alpine 4000ers, Colorado 14ers, the 8000ers, Indonesia's volcanoes, Sweden's tiny mountains, the Seven Wonders, the Explorers Grand Slam and many more.",
        how: [
          "Each list shows progress, a map of its peaks and the full definition.",
          "Completing a list is worth a large XP bonus.",
        ],
      },
      {
        icon: Sparkles,
        title: "XP, levels and titles",
        body:
          "Two ladders run side by side: Climbing XP from summits (height and difficulty weighted) and Explorer XP from places and continents. Both run to level 100.",
        how: [
          "Higher and harder peaks are worth more.",
          "Finishing lists and reaching all continents give big bonuses.",
          "Titles unlock as you climb the ladder.",
        ],
      },
      {
        icon: Award,
        title: "Badges",
        body:
          "Automatic badges for milestones and honour badges you claim with a story — Rescue Hero, Daredevil and friends.",
        how: [
          "Open a badge to see exactly what qualifies and which items you already have.",
          "Honour badges are claimed with a short write-up and reviewed.",
        ],
      },
      {
        icon: BarChart3,
        title: "My analytics",
        body:
          "Charts of your climbing: winter ascents, altitude bands, seasons, countries and how it all trends over time.",
        how: ["Open it from My Adventures once you have a few ascents logged."],
      },
    ],
  },
  {
    heading: "The community",
    blurb: "Other people, and how you find and follow them.",
    features: [
      {
        icon: Home,
        title: "Feed",
        to: "/community",
        body: "The live stream of what everyone has been up to — new ascents, places and posts.",
        how: ["Cheer an ascent to congratulate someone; they get a notification."],
      },
      {
        icon: MessageSquare,
        title: "Wall",
        to: "/community/wall",
        body:
          "Longer posts: trip reports, photos, videos and questions. Replies, reactions, bookmarks and @mentions all work.",
        how: [
          "Attach a related peak so the post shows up on that peak's page.",
          "Sort and filter the wall to find what you care about.",
        ],
      },
      {
        icon: Trophy,
        title: "Leaderboard & Front Runners",
        to: "/community/frontrunners",
        body:
          "The Leaderboard ranks overall climbing. Front Runners ranks a single board — UN high points, mainland high points, countries visited, any list or challenge — and shows where you stand.",
        how: [
          "Pick a board, then search for yourself or a friend.",
          "Every list and goal has a \"Front runners\" link straight to its ranking.",
        ],
      },
      {
        icon: Users,
        title: "Members & following",
        to: "/community/members",
        body:
          "Browse profiles, follow climbers you like, and compare your ticks with theirs.",
        how: [
          "Profiles show four pinned goals — tap a goal to compare their ticks with yours side by side.",
          "You can see who visited your profile last.",
        ],
      },
      {
        icon: Tent,
        title: "Base Camp",
        to: "/community/basecamp",
        body: "A 3D camp where every member stands as their own low-poly climber. Tap a figure to open their profile.",
        how: ["Pan and zoom around camp; quality adapts to your device."],
      },
      {
        icon: Camera,
        title: "Photo vote",
        to: "/community/photo-vote",
        body: "Members vote on summit photos, and the winner becomes the hero image on that peak's page.",
        how: ["Rounds run for 30 days, then the winning photo is promoted."],
      },
    ],
  },
  {
    heading: "Make it yours",
    blurb: "Settings, imports and the app.",
    features: [
      {
        icon: Palette,
        title: "Profile & themes",
        to: "/community/settings",
        body:
          "Pin up to four goals to your profile, build a 3D avatar in Avatar Studio and pick a theme — Steampunk, Flower Power, Hobbit, Cyberpunk and more.",
        how: [
          "Goals: pick your own, or hit \"Suggest goals for me\".",
          "Your theme follows you across devices.",
        ],
      },
      {
        icon: Mountain,
        title: "Import from Peakbagger",
        body: "Bring your whole climbing history across in one go, all years included.",
        how: [
          "Paste your Peakbagger climber page or ID.",
          "Optional from/to year range if you only want part of it.",
        ],
      },
      {
        icon: Bell,
        title: "Notifications",
        to: "/community/notifications",
        body: "Cheers, comments, replies, mentions and new followers, with per-type switches.",
        how: ["Tune what you get in notification preferences."],
      },
      {
        icon: Smartphone,
        title: "On your phone",
        body: "Install Ticklelist as an app. On mobile you can swipe between pages like a 3D cube.",
        how: ["Use the install prompt, or your browser's \"Add to Home Screen\"."],
      },
    ],
  },
];

const IntroPage = () => {
  const { user } = useAuth();

  return (
    <CommunityLayout>
      <Seo
        title="Introduction — how Ticklelist works"
        description="A guide to every Ticklelist feature: logging ascents and places, XP and levels, badges, tick lists, rankings, the wall, Base Camp, themes and the mobile app."
      />

      <header className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl tracking-wider">Introduction</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Ticklelist is a tick list for your whole adventuring life — summits, countries, landmarks and oceans. Log what
          you've done, watch the XP and badges stack up, and see where you stand against everyone else. Here's what's on
          the site and how each part works.
        </p>
        {!user && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/auth"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-display tracking-wider text-primary-foreground"
            >
              Create an account
            </Link>
            <Link
              to="/community"
              className="rounded-full border border-border px-4 py-1.5 text-sm font-display tracking-wider hover:text-primary"
            >
              Look around first
            </Link>
          </div>
        )}
      </header>

      <nav aria-label="Sections" className="mb-8 flex flex-wrap gap-2">
        {sections.map((s) => (
          <a
            key={s.heading}
            href={`#${s.heading.toLowerCase().replace(/\s+/g, "-")}`}
            className="rounded-full border border-border px-3 py-1 text-xs font-display tracking-wider text-muted-foreground hover:text-primary"
          >
            {s.heading}
          </a>
        ))}
      </nav>

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.heading} id={section.heading.toLowerCase().replace(/\s+/g, "-")}>
            <h2 className="font-display text-lg tracking-wider">{section.heading}</h2>
            <p className="text-sm text-muted-foreground">{section.blurb}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {section.features.map((f) => {
                const Icon = f.icon;
                return (
                  <article key={f.title} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <h3 className="font-display text-sm tracking-wider">
                        {f.to ? (
                          <Link to={f.to} className="hover:text-primary">
                            {f.title}
                          </Link>
                        ) : (
                          f.title
                        )}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                    <ul className="mt-2 space-y-1">
                      {f.how.map((h) => (
                        <li key={h} className="flex gap-2 text-xs text-muted-foreground">
                          <span className="text-primary">›</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted-foreground">
        Still stuck on something? Post it on the{" "}
        <Link to="/community/wall" className="text-primary hover:underline">
          Wall
        </Link>{" "}
        — someone will know.
      </p>
    </CommunityLayout>
  );
};

export default IntroPage;
