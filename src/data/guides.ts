/**
 * Editorial list/comparison guides — the "highest point in every country",
 * "easiest country highpoints" style pages that target list-intent searches
 * and funnel internal links into every /peak/* page.
 */
import { countries, type CountryHighPoint } from "@/data/countries";
import { countryDifficulty, type Difficulty } from "@/data/difficulty";
import { peakDetails } from "@/data/peak-details";

export function elevationOf(c: CountryHighPoint): number {
  const detail = peakDetails[c.country];
  if (detail) return detail.elevation;
  const parsed = Number(c.elevation.replace(/[^0-9]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

const difficultyOf = (c: CountryHighPoint): Difficulty | undefined =>
  countryDifficulty[c.country]?.difficulty;

const byElevationDesc = (a: CountryHighPoint, b: CountryHighPoint) => elevationOf(b) - elevationOf(a);
const byElevationAsc = (a: CountryHighPoint, b: CountryHighPoint) => elevationOf(a) - elevationOf(b);

export interface Guide {
  slug: string;
  heading: string;
  seoTitle: string;
  description: string;
  intro: string;
  /** Short explainer shown under the table. */
  outro: string;
  select: () => CountryHighPoint[];
  faqs: { question: string; answer: string }[];
}

/** Builds a "highest mountain in every X country" guide for a continent. */
const continentGuide = (
  continent: string,
  copy: Omit<Guide, "slug" | "heading" | "select">,
): Guide[] => [
  {
    slug: `${continent.toLowerCase().replace(/\s+/g, "-")}-country-highpoints`,
    heading: `Highest Mountain in Every ${
      ({
        Asia: "Asian",
        Africa: "African",
        Oceania: "Oceanian",
        "South America": "South American",
        "North America": "North American",
      } as Record<string, string>)[continent] ?? continent
    } Country`,
    select: () => countries.filter((c) => c.continent === continent).sort(byElevationDesc),
    ...copy,
  },
];

export const guides: Guide[] = [
  {
    slug: "highest-point-in-every-country",
    heading: "The Highest Point in Every Country",
    seoTitle: "Highest Point in Every Country (Full List)",
    description:
      "The complete list of every country's highest mountain, ranked by elevation, with difficulty, range and route notes for all 195 highpoints.",
    intro:
      "Every sovereign country has one highest point — from the 8,849 m summit of Everest down to hills you can drive to. This is the full ranked list, with a page for each peak covering the normal route, difficulty and season.",
    outro:
      "Elevations follow Peakbagger and national survey data. Where a country's true highpoint sits in an overseas territory, both the territorial and mainland summits are tracked separately.",
    select: () => [...countries].sort(byElevationDesc),
    faqs: [
      {
        question: "How many country highpoints are there?",
        answer:
          "195 — the 193 UN member states plus Taiwan and Antarctica. A handful of peaks are shared by two countries, such as Mont Blanc for France and Italy.",
      },
      {
        question: "What is the highest country highpoint?",
        answer: "Mount Everest at 8,849 m, the highest point of both Nepal and China.",
      },
      {
        question: "What is the lowest country highpoint?",
        answer:
          "The Maldives, where the highest natural point is roughly 2.4 m above sea level — lower than most buildings.",
      },
    ],
  },
  {
    slug: "easiest-country-highpoints",
    heading: "The Easiest Country Highpoints",
    seoTitle: "Easiest Country Highpoints to Climb",
    description:
      "The country highpoints you can tick in a day or less — short walks, drive-up summits and easy hikes, ranked from easiest upward.",
    intro:
      "Not every country highpoint is a mountaineering objective. Dozens are simple walks, and some are a few steps from a car park. These are the best first ticks if you want to start highpointing without technical gear.",
    outro:
      "Easy does not mean trivial: check access rights, private land and local conditions before you go. Every peak below links to its own page with route notes.",
    select: () =>
      countries
        .filter((c) => {
          const d = difficultyOf(c);
          return d === "very_easy" || d === "easy";
        })
        .sort(byElevationAsc)
        .slice(0, 40),
    faqs: [
      {
        question: "What is the easiest country highpoint in the world?",
        answer:
          "Several are effectively drive-ups. In Europe, Signal de Botrange in Belgium and Kneiff in Luxembourg both take minutes from the road.",
      },
      {
        question: "Can you climb a country highpoint without experience?",
        answer:
          "Yes. Dozens of highpoints are marked walking trails with no technical ground. Start with the easy European and Caribbean summits before moving to glaciated peaks.",
      },
    ],
  },
  {
    slug: "hardest-country-highpoints",
    heading: "The Hardest Country Highpoints",
    seoTitle: "Hardest Country Highpoints to Climb",
    description:
      "The country highpoints that stop most highpointers: extreme altitude, glaciers, remote jungle and peaks closed by politics or conflict.",
    intro:
      "The hardest country highpoints are not just the tallest. Some need a full Himalayan expedition, others are blocked by permits, closed borders or active conflict. These are the summits that decide whether the full list of 195 is realistic.",
    outro:
      "Difficulty here combines technical ground, altitude, remoteness and access. Political difficulty is tracked separately on each peak page.",
    select: () =>
      countries
        .filter((c) => {
          const d = difficultyOf(c);
          return d === "expert" || d === "hard";
        })
        .sort(byElevationDesc)
        .slice(0, 40),
    faqs: [
      {
        question: "What is the hardest country highpoint?",
        answer:
          "Gangkhar Puensum in Bhutan is arguably the hardest — it is the world's highest unclimbed mountain and climbing it is banned.",
      },
      {
        question: "Which country highpoints require an expedition?",
        answer:
          "Everest (Nepal/China), K2 (Pakistan), Vinson (Antarctica), Denali (USA), Aconcagua (Argentina) and Pico de Orizaba-class volcanoes all need multi-day, fully equipped trips.",
      },
    ],
  },
  {
    slug: "best-beginner-country-highpoints",
    heading: "Best Beginner Country Highpoints",
    seoTitle: "Best Beginner Country Highpoints",
    description:
      "Ten country highpoints that make ideal first mountains — real summits with proper views, but no glacier travel or technical climbing.",
    intro:
      "These are the highpoints worth doing first: they feel like mountains, they are reachable in a long day, and they need nothing more than boots, waterproofs and reasonable fitness.",
    outro:
      "Each of these gives you altitude and a genuine summit without ropes. When they start feeling easy, step up to the moderate alpine highpoints.",
    select: () => {
      const picks = [
        "Ireland",
        "United Kingdom",
        "Poland",
        "Czech Republic",
        "Hungary",
        "Sweden",
        "Norway",
        "Croatia",
        "Finland",
        "Portugal",
        "Spain",
        "Australia",
      ];
      return picks
        .map((name) => countries.find((c) => c.country === name))
        .filter((c): c is CountryHighPoint => Boolean(c));
    },
    faqs: [
      {
        question: "What is a good first country highpoint?",
        answer:
          "Carrauntoohil in Ireland or Ben Nevis in the UK — both are long hill days on marked ground with no technical climbing required in summer.",
      },
      {
        question: "Do I need mountaineering skills for beginner highpoints?",
        answer:
          "No, but you do need navigation, weather awareness and hill fitness. These peaks are non-technical in good summer conditions.",
      },
    ],
  },
  {
    slug: "european-country-highpoints",
    heading: "Every European Country Highpoint",
    seoTitle: "European Country Highpoints: Full List",
    description:
      "All European country highpoints ranked by elevation, from Mont Blanc and Elbrus down to the low country summits of the Baltics and Benelux.",
    intro:
      "Europe is the best continent to start highpointing: short travel distances, good infrastructure and a full spread of difficulty from drive-ups to serious alpine routes.",
    outro:
      "A determined climber can tick most of Europe in a few road-trip seasons — which is exactly how this project began.",
    select: () => countries.filter((c) => c.continent === "Europe").sort(byElevationDesc),
    faqs: [
      {
        question: "What is the highest country highpoint in Europe?",
        answer:
          "Mount Elbrus (5,642 m) in Russia, if you count the Caucasus as Europe. Otherwise Mont Blanc (4,807 m), shared by France and Italy.",
      },
      {
        question: "How long does it take to climb every European highpoint?",
        answer:
          "With a van and good weather windows, most of Europe's highpoints can be climbed across two or three summer seasons.",
      },
    ],
  },
  {
    slug: "volcanic-country-highpoints",
    heading: "Country Highpoints That Are Volcanoes",
    seoTitle: "Country Highpoints That Are Volcanoes",
    description:
      "Volcano highpoints around the world — Kilimanjaro, Teide, Pico, Orizaba and more — with elevation, difficulty and route notes.",
    intro:
      "A surprising share of country highpoints are volcanoes. They tend to be big, symmetrical, walk-up-angle mountains where altitude, not technique, is the crux.",
    outro:
      "Volcanic highpoints are the best training ground for altitude: predictable terrain, big vertical gain and, usually, a hut or road high on the mountain.",
    select: () => {
      const picks = [
        "Tanzania",
        "Spain",
        "Portugal",
        "Mexico",
        "Ecuador",
        "Chile",
        "Indonesia",
        "Japan",
        "Iceland",
        "Cape Verde",
        "Philippines",
        "Rwanda",
        "Cameroon",
        "New Zealand",
        "Guatemala",
        "Costa Rica",
        "El Salvador",
        "Nicaragua",
      ];
      return picks
        .map((name) => countries.find((c) => c.country === name))
        .filter((c): c is CountryHighPoint => Boolean(c))
        .sort(byElevationDesc);
    },
    faqs: [
      {
        question: "What is the highest volcano that is a country highpoint?",
        answer:
          "Ojos del Salado on the Chile–Argentina border is the world's highest volcano at 6,893 m and is Chile's highest point.",
      },
      {
        question: "Are volcano highpoints easier to climb?",
        answer:
          "Usually the terrain is easier — long scree and snow slopes rather than technical rock — but the altitude and weather can still be serious.",
      },
    ],
  },
  {
    slug: "seven-summits",
    heading: "The Seven Summits",
    seoTitle: "The Seven Summits: Full List & Heights",
    description:
      "The Seven Summits — the highest mountain on each continent — with heights, difficulty and how both the Bass and Messner lists differ.",
    intro:
      "The Seven Summits are the highest mountain on each of the seven continents, and the most famous climbing list in the world. Every one of them is also a country highpoint, which is why they sit inside this project.",
    outro:
      "Two versions exist. The Bass list uses Mount Kosciuszko (2,228 m) for Australia; the Messner list uses Puncak Jaya (4,884 m) in Indonesia for the Oceania/Australasia continental plate. Puncak Jaya is the harder and more widely respected tick.",
    select: () => {
      const picks = [
        "Nepal", "Argentina", "United States", "Tanzania", "Russia",
        "Antarctica", "Indonesia", "Australia",
      ];
      return picks
        .map((name) => countries.find((c) => c.country === name))
        .filter((c): c is CountryHighPoint => Boolean(c))
        .sort(byElevationDesc);
    },
    faqs: [
      {
        question: "What are the Seven Summits?",
        answer:
          "Everest (Asia), Aconcagua (South America), Denali (North America), Kilimanjaro (Africa), Elbrus (Europe), Vinson (Antarctica) and either Puncak Jaya or Kosciuszko for Oceania/Australia.",
      },
      {
        question: "What is the difference between the Bass and Messner lists?",
        answer:
          "The Bass list takes Kosciuszko in Australia as the seventh summit; the Messner list takes Puncak Jaya in Indonesia. Messner's version is considered the more serious challenge because Puncak Jaya is a technical rock climb in a remote, permit-controlled area.",
      },
      {
        question: "Which of the Seven Summits is the easiest?",
        answer:
          "Kosciuszko is a walk. Of the real mountains, Kilimanjaro is the easiest — a non-technical multi-day trek where altitude is the only real crux.",
      },
    ],
  },
  ...continentGuide("Asia", {
    seoTitle: "Highest Mountain in Every Asian Country",
    description:
      "Every Asian country's highest mountain ranked by elevation — from Everest and K2 down to the low highpoints of the Gulf and Southeast Asia.",
    intro:
      "Asia holds the highest and hardest country highpoints on the planet. Fourteen of them break 6,000 m, and several need full expeditions, army permits or closed-border negotiation.",
    outro:
      "Access, not elevation, is often the crux in Asia: several highpoints sit on disputed frontiers or inside restricted military zones.",
    faqs: [
      {
        question: "What is the highest mountain in Asia?",
        answer: "Mount Everest at 8,849 m, on the Nepal–China border.",
      },
      {
        question: "Which Asian country highpoints are hardest to reach?",
        answer:
          "Gangkhar Puensum (Bhutan) is closed to climbing, K2 (Pakistan) is a major expedition, and several Central Asian highpoints need border permits arranged months ahead.",
      },
    ],
  }),
  ...continentGuide("Africa", {
    seoTitle: "Highest Mountain in Every African Country",
    description:
      "All 54 African country highpoints ranked by elevation, with difficulty, range and route notes — Kilimanjaro, Mount Kenya, Toubkal and the rest.",
    intro:
      "Africa's highpoints run from the glaciated 5,000 m volcanoes of the Rift Valley to desert plateaus and jungle ridges that see a handful of ascents a decade.",
    outro:
      "Many African highpoints are logistically, not technically, hard: permits, guides and long overland approaches decide whether the trip works.",
    faqs: [
      {
        question: "What is the highest mountain in Africa?",
        answer: "Kilimanjaro at 5,895 m in Tanzania — the highest free-standing mountain in the world.",
      },
      {
        question: "Which African highpoint is the hardest?",
        answer:
          "Mount Kenya's Batian summit is the most technical, and several Sahel and Central African highpoints are hard purely because of access and security.",
      },
    ],
  }),
  ...continentGuide("South America", {
    seoTitle: "Highest Mountain in Every South American Country",
    description:
      "South America's country highpoints ranked by elevation — Aconcagua, Ojos del Salado, Huascarán, Chimborazo and the rest of the Andes.",
    intro:
      "South America is the altitude continent. Nine of its twelve country highpoints are Andean, and the crux on almost all of them is acclimatisation rather than technical climbing.",
    outro:
      "The dry Andean season from December to February suits the southern peaks; the tropical Andes climb best from June to September.",
    faqs: [
      {
        question: "What is the highest mountain in South America?",
        answer: "Aconcagua at 6,961 m in Argentina — the highest mountain outside Asia.",
      },
      {
        question: "Which South American highpoints are non-technical?",
        answer:
          "Aconcagua's normal route and Ojos del Salado are walk-ups at altitude; Huascarán and Illimani need real glacier and rope skills.",
      },
    ],
  }),
  ...continentGuide("North America", {
    seoTitle: "Highest Mountain in Every North American Country",
    description:
      "Every North American and Caribbean country highpoint ranked by elevation — Denali, Pico de Orizaba, Duarte and the island summits.",
    intro:
      "North America covers Denali's sub-arctic glaciers, Mexico's high volcanoes and a string of Caribbean island highpoints that can be climbed in a morning.",
    outro:
      "The Caribbean highpoints make an excellent multi-country trip: several can be ticked in a single two-week island hop.",
    faqs: [
      {
        question: "What is the highest mountain in North America?",
        answer: "Denali at 6,190 m in Alaska, USA — a serious glaciated expedition despite its latitude.",
      },
      {
        question: "Which Caribbean highpoint is the highest?",
        answer: "Pico Duarte in the Dominican Republic at 3,098 m, a multi-day but non-technical trek.",
      },
    ],
  }),
  ...continentGuide("Oceania", {
    seoTitle: "Highest Mountain in Every Oceanian Country",
    description:
      "Oceania's country highpoints ranked by elevation — Puncak Jaya, Mount Wilhelm, Aoraki, Kosciuszko and the Pacific island summits.",
    intro:
      "Oceania mixes two extremes: technical, permit-heavy peaks in New Guinea and New Zealand, and Pacific island highpoints that are short jungle walks.",
    outro:
      "Travel time, not climbing difficulty, dominates an Oceania highpointing trip — flights between island nations are infrequent and expensive.",
    faqs: [
      {
        question: "What is the highest mountain in Oceania?",
        answer:
          "Puncak Jaya (Carstensz Pyramid) at 4,884 m in the Indonesian part of New Guinea — a technical rock climb in a restricted area.",
      },
      {
        question: "Is Aoraki / Mount Cook hard to climb?",
        answer:
          "Yes. New Zealand's highpoint is a serious alpine route with objective hazard, normally climbed with a guide or strong alpine experience.",
      },
    ],
  }),
];

export const getGuide = (slug: string): Guide | undefined => guides.find((g) => g.slug === slug);
