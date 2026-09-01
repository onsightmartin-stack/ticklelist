import { Link } from "@/lib/router-compat";
import { ArrowLeft, Mountain, Clock, Navigation, Calendar, Youtube, MapPin } from "lucide-react";
import Seo from "@/components/Seo";
import Navbar from "@/components/Navbar";
import PeakImage from "@/components/PeakImage";
import { organizationSchema } from "@/lib/structured-data";
import scafellSummit from "@/assets/scafell-pike-summit.jpg.asset.json";
import scafellSelfie from "@/assets/scafell-pike-selfie.jpg.asset.json";

const VIDEO_ID = "D3mh3Ddic_E";
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const CANONICAL = "https://onsightmartin.com/peak/scafell-pike";
const ELEVATION = 978;

const routes: { name: string; stats: string; detail: string }[] = [
  {
    name: "Wasdale Head (the short one)",
    stats: "~6 km return, 900 m ascent, 4–5 h",
    detail:
      "The classic and steepest ascent. A relentless staircase up Brown Tongue and Hollow Stones to Lingmell Col, then boulders to the summit plateau. Shortest route, but almost no flat ground.",
  },
  {
    name: "Seathwaite via Corridor Route",
    stats: "~14 km return, 1,000 m ascent, 6–7 h",
    detail:
      "The best scenery of the standard lines. Up Styhead Gill to Sty Head, then the Corridor Route traverses above Piers Gill before the final pull to the summit. Some easy scrambling and exposure.",
  },
  {
    name: "Borrowdale via Esk Hause",
    stats: "~17 km return, 1,000 m ascent, 7–8 h",
    detail:
      "The longest of the popular approaches, with the gentlest gradients. Good in poor visibility because the path junctions are well cairned, though the summit plateau still demands a bearing.",
  },
  {
    name: "Great Langdale (with Jack's Rake option)",
    stats: "~18 km return, 1,200 m ascent, 8–9 h",
    detail:
      "The route I filmed. Jack's Rake on Pavey Ark is a Grade 1 scramble up a diagonal fault line — steep, polished and exposed — best kept for dry days, and easily bypassed via Rossett Gill if the rock is wet.",
  },
];

const faqs = [
  {
    question: "How tall is Scafell Pike?",
    answer:
      "Scafell Pike is 978 metres (3,209 feet) high, making it the highest mountain in England and the highest point of the Lake District.",
  },
  {
    question: "How long does it take to climb Scafell Pike?",
    answer:
      "Allow 4–5 hours return from Wasdale Head, 6–7 hours via the Corridor Route from Seathwaite, and 7–9 hours from Borrowdale or Great Langdale.",
  },
  {
    question: "Is Scafell Pike hard to climb?",
    answer:
      "No technical climbing is required on the walkers' routes, but it is a serious hill walk: steep, rocky ground, a boulder-field summit plateau and fast-changing weather. Navigation skills matter more than fitness in cloud.",
  },
  {
    question: "What is the easiest route up Scafell Pike?",
    answer:
      "The shortest is the Wasdale Head path, but it is also the steepest. The gentlest gradient is the Borrowdale approach via Esk Hause, at the cost of extra distance.",
  },
  {
    question: "Do you need a guide or permit for Scafell Pike?",
    answer:
      "No permit and no guide are needed. Parking at Wasdale Head and Seathwaite is limited and fills early, so arrive at dawn in summer.",
  },
  {
    question: "What is the difference between Scafell Pike and Scafell?",
    answer:
      "They are two separate summits. Scafell Pike (978 m) is the higher and is England's high point; neighbouring Scafell (964 m) is separated by the Mickledore col and the tricky Broad Stand step.",
  },
  {
    question: "When is the best time to climb Scafell Pike?",
    answer:
      "May to September gives the longest days and most settled weather. Winter ascents are possible but the summit plateau holds snow and ice, so axe, crampons and navigation experience are needed.",
  },
  {
    question: "How dangerous is Jack's Rake?",
    answer:
      "Jack's Rake is a Grade 1 scramble on Pavey Ark with real exposure and polished rock. It is fine for confident scramblers in dry conditions but should be avoided when wet, windy or icy.",
  },
];

export default function ScafellPikePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Scafell Pike (978 m): Climbing the Highest Mountain in England",
      description:
        "Routes, timings, conditions and a summit video for Scafell Pike, England's highest mountain at 978 m in the Lake District.",
      image: scafellSummit.url,
      datePublished: "2026-08-17",
      author: { "@type": "Person", name: "Martin Gårdling", url: "https://www.youtube.com/@onsightmartin" },
      publisher: organizationSchema,
      mainEntityOfPage: { "@type": "WebPage", "@id": CANONICAL },
      about: {
        "@type": "Mountain",
        name: "Scafell Pike",
        alternateName: ["Scafell Pikes", "Sca Fell Pike"],
        elevation: `${ELEVATION} m`,
        geo: { "@type": "GeoCoordinates", latitude: 54.4542, longitude: -3.2117 },
        address: {
          "@type": "PostalAddress",
          addressCountry: "United Kingdom",
          addressRegion: "England, Lake District, Cumbria",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: "I Climbed Jack's Rake? - Scafell Pike England",
      description:
        "Martin Gårdling climbs Scafell Pike (978 m), the highest mountain in England, taking in Jack's Rake on Pavey Ark.",
      thumbnailUrl: [`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`],
      uploadDate: "2026-08-17",
      contentUrl: VIDEO_URL,
      embedUrl: `https://www.youtube.com/embed/${VIDEO_ID}`,
      publisher: organizationSchema,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Scafell Pike (978 m): Highest Mountain in England"
        description="Scafell Pike, 978 m, is England's highest mountain. Routes from Wasdale, Seathwaite and Langdale, timings, conditions, photos and a summit video."
        path="/peak/scafell-pike"
        image={scafellSummit.url}
        type="article"
        breadcrumbLeaf="Scafell Pike (England)"
        jsonLd={jsonLd}
      />
      <Navbar />

      <section className="relative h-[50vh] md:h-[60vh] flex items-end overflow-hidden">
        <PeakImage
          src={scafellSummit.url}
          alt="Summit cairn on Scafell Pike (978 m), the highest mountain in England, Lake District"
          className="absolute inset-0 w-full h-full object-cover object-center"
          width={1600}
          height={900}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative container mx-auto px-4 pb-10">
          <Link
            to="/featured"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Featured peaks
          </Link>
          <p className="font-display tracking-widest text-primary text-xs md:text-sm mb-2">
            FEATURED — ENGLAND HIGH POINT
          </p>
          <h1 className="font-display text-3xl md:text-6xl font-bold text-foreground">
            Scafell Pike
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            978 m · Lake District, Cumbria · the highest mountain in England — summited 22 July 2026
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {[
            { icon: Mountain, label: "Elevation", value: "978 m / 3,209 ft" },
            { icon: Navigation, label: "Range", value: "Southern Fells" },
            { icon: Clock, label: "Typical day", value: "4–9 h return" },
            { icon: Calendar, label: "Best season", value: "May – September" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card rounded-sm p-4 border border-border">
              <Icon className="w-4 h-4 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-4">About Scafell Pike</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Scafell Pike is the highest mountain in England at 978 metres (3,209 feet), standing at the
              heart of the Southern Fells in the Lake District. It is the English leg of the National Three
              Peaks Challenge alongside Ben Nevis and Snowdon, and one of the four constituent-country high
              points of the United Kingdom.
            </p>
            <p>
              Despite the modest height, it feels far bigger than the number suggests. Every route starts
              close to sea level, the upper mountain is a chaotic boulder field, and the summit plateau is
              notorious for swallowing walkers in cloud — compass and map, not a phone, are the tools that
              get people down safely. The summit cairn is also a war memorial, gifted to the National Trust
              by Lord Leconfield in 1919 in memory of the men of the Lake District who died in the First
              World War.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-4">Routes up Scafell Pike</h2>
          <div className="space-y-3">
            {routes.map((r) => (
              <div key={r.name} className="bg-card border border-border rounded-sm p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                  <h3 className="font-medium text-foreground">{r.name}</h3>
                  <span className="text-xs text-primary font-display">{r.stats}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-4">Conditions, gear and access</h2>
          <ul className="space-y-2 text-muted-foreground text-sm list-disc pl-5">
            <li>No permit, no fees and no guide required — Scafell Pike is open access land.</li>
            <li>
              Parking is the real bottleneck: Wasdale Head and Seathwaite fill by early morning in summer
              and roadside parking is heavily restricted.
            </li>
            <li>
              Summer kit: boots with a stiff sole for the boulder fields, waterproof shell, warm layer, 2 L
              of water, head torch and a paper map (OS Explorer OL6).
            </li>
            <li>
              Winter: the plateau holds hard névé and verglas — ice axe, crampons and winter navigation
              experience are needed from roughly November to April.
            </li>
            <li>
              Weather flips fast. Summit temperatures typically run 6–8 °C below the valley, with wind chill
              on top of that.
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-4">
            <Youtube className="inline w-5 h-5 text-primary mr-2" />
            The summit video
          </h2>
          <div className="aspect-video w-full rounded-sm overflow-hidden border border-border">
            <iframe
              src={`https://www.youtube.com/embed/${VIDEO_ID}`}
              title="I Climbed Jack's Rake? - Scafell Pike England"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Jack's Rake on Pavey Ark, then over to the England high point — the full Lake District day.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-4">My climb</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <PeakImage
              src={scafellSelfie.url}
              alt="Martin Gårdling on the Scafell Pike summit ridge, England, July 2026"
              className="w-full rounded-sm object-cover"
              width={800}
              height={600}
              loading="lazy"
            />
            <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
              <p>
                Summited on 22 July 2026 as the last of the four UK constituent-country high points, after
                Snowdon, Slieve Donard and Ben Nevis earlier the same month. Same trip took in Harrison
                Stickle and the Langdale Pikes.
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> 54.4542° N, 3.2117° W
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-4">Scafell Pike FAQ</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.question} className="border-b border-border pb-4">
                <h3 className="font-medium text-foreground mb-1">{f.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl text-foreground mb-4">Nearby high points</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/peak/united-kingdom"
              className="px-3 py-2 bg-card border border-border rounded-sm text-sm text-foreground hover:border-primary transition-colors"
            >
              United Kingdom — Ben Nevis (1,345 m)
            </Link>
            <Link
              to="/peak/ireland"
              className="px-3 py-2 bg-card border border-border rounded-sm text-sm text-foreground hover:border-primary transition-colors"
            >
              Ireland — Carrauntoohil (1,038 m)
            </Link>

            <Link
              to="/other-peaks"
              className="px-3 py-2 bg-card border border-border rounded-sm text-sm text-foreground hover:border-primary transition-colors"
            >
              All other peaks climbed
            </Link>
          </div>
        </section>
      </div>

      <footer className="bg-background border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Onsight Martin — Martin Gårdling</p>
        </div>
      </footer>
    </div>
  );
}
