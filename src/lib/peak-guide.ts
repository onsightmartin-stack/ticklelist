/**
 * Derives practical, search-friendly climbing-guide facts for a country
 * highpoint (time, guiding, season, gear) from the data we already store.
 * These power the long-tail Q&A blocks on /peak/* pages.
 */
import type { Difficulty } from "@/data/difficulty";

export interface PeakGuideFacts {
  duration: string;
  guideNeeded: string;
  season: string;
  gear: string;
  terrain: string;
  /** Permits, fees, hut bookings or access rules, when the peak has them. */
  permits?: string;
}

/**
 * Hand-checked overrides for peaks where the generic difficulty-derived text is
 * wrong or misleading (mandatory guides, permit systems, multi-day treks).
 * Sources: Kilimanjaro National Park / TANAPA regulations, Compagnie des Guides
 * de Chamonix & Refuge du Goûter booking rules, Teide National Park (Parques
 * Nacionales) permit system, PZS/Triglav National Park, Bayerische Zugspitzbahn,
 * Kerry Mountain Rescue.
 */
export const peakGuideOverrides: Record<string, Partial<PeakGuideFacts>> = {
  Tanzania: {
    duration:
      "5–9 days on the mountain. Machame and Lemosho are normally 6–8 days, Marangu 5–6. A day trip is not realistic — the schedule exists to acclimatise, and even the fastest known ascents (Karl Egloff, 6h42 round trip; Kilian Jornet, 7h14) were record attempts by elite mountain runners, not a normal option.",
    guideNeeded:
      "Yes — it is compulsory. Kilimanjaro National Park does not allow independent or solo climbing: every ascent must be booked through a licensed operator with a registered guide, and porters and a cook come with it. Trekking alone is refused at the gate.",
    permits:
      "Park entry fees, camping or hut fees, rescue fee and guide/porter permits are all mandatory and are paid through your operator as part of the package (typically USD 1,500–3,000+ for the trek). You register at the park gate and sign in at every camp.",
    season:
      "January to mid-March and June to October — the two dry windows. April–May and November are the rainy seasons and the routes get muddy and cloudy.",
    gear: "No technical climbing gear, but full cold-weather kit: down jacket, insulated layers, hat and gloves, a sleeping bag rated to around −10 °C, headtorch for the midnight summit push, trekking poles, sun protection and 3 L of water capacity.",
    terrain:
      "A long non-technical trek through five climate zones, from rainforest to arctic summit scree. The crux is altitude — 5,895 m with roughly half the oxygen of sea level — plus a steep, cold pre-dawn push from high camp to Uhuru Peak.",
  },
  France: {
    duration:
      "2–3 days via the Goûter route: Nid d'Aigle to the Goûter hut, then a summit day of 8–12 hours. Fit alpinists do it in two days; add days for weather and acclimatisation.",
    guideNeeded:
      "Not legally required, but strongly recommended unless you are an experienced alpinist. It is a glaciated 4,800 m route with crevasses, altitude and the rockfall-prone Grand Couloir. Most people climb with an IFMGA guide.",
    permits:
      "No climbing permit, but a reservation at the Goûter or Tête Rousse hut is effectively mandatory in season — beds are limited, booking opens months ahead, and the Saint-Gervais mayor's office polices bivouacking and unprepared parties on the normal route.",
    season: "Mid-June to mid-September, with July and August the main window.",
    gear: "Crampons, ice axe, harness, rope, helmet and glacier-rescue gear, plus warm layers, boots rated for altitude and a headtorch for the alpine start.",
    terrain: "Glacier travel, snow slopes at altitude and an exposed rocky ridge, with objective rockfall danger crossing the Grand Couloir.",
  },
  Spain: {
    duration:
      "The Montaña Blanca trail to the summit is 6–9 hours round trip; with the cable car to La Rambleta it is about 1 hour to the summit and back.",
    guideNeeded: "No guide needed — it is a marked trail on volcanic terrain, but altitude (3,715 m) makes it harder than the distance suggests.",
    permits:
      "Yes: a free permit from Teide National Park is required for the final stretch above La Rambleta to Pico del Teide, and it must be booked online well in advance. Overnighting at the Altavista refuge is a separate booking.",
    season: "Year round, but spring and autumn are best; winter brings snow and ice and the cable car closes in high wind.",
    gear: "Hiking boots, wind shell, sun protection and plenty of water. Nothing technical outside winter conditions.",
    terrain: "Steep volcanic trails, loose scoria and thin air at altitude.",
  },
  Slovenia: {
    duration: "Two days is standard, staying at a mountain hut such as Kredarica; strong parties do 10–14 hours in a single push.",
    guideNeeded:
      "Not required, but only for people comfortable on exposed, cabled terrain. Every route to the summit finishes on protected via ferrata sections with big drops — guides are common for first-timers.",
    permits: "No permit, but hut beds in Triglav National Park should be booked in season, and wild camping is prohibited.",
    season: "Mid-July to late September, once the cables and ledges are free of snow.",
    gear: "Helmet, harness and a via-ferrata set are essential, plus sturdy boots, gloves and a headtorch.",
    terrain: "Steep mountain trails leading to sustained, exposed via ferrata on limestone.",
  },
  Germany: {
    duration: "8–10 hours on foot from Eibsee via the Höllental or Reintal, or a few minutes by cable car or cog railway.",
    guideNeeded:
      "No guide needed for the cable car or the Reintal walk-up. The Höllental route is a via ferrata crossing a small glacier remnant — guided if you have not done ferrata before.",
    permits: "No permit. Cable car and railway tickets are paid on the day; the Höllentalangerhütte should be booked if you split the walk over two days.",
    season: "Late June to early October for the walking routes; the summit is accessible by cable car year round.",
    gear: "For the walk-up: boots, layers and a headtorch. For the Höllental: helmet, harness, via-ferrata set and light crampons for the Höllentalferner.",
    terrain: "Long valley approaches with a steep finish, cabled rock and a short glacier crossing on the Höllental route.",
  },
  Ireland: {
    duration: "4–6 hours round trip from Cronin's Yard or the Hag's Glen, via the Devil's Ladder.",
    guideNeeded: "No guide needed, but navigation matters — the summit plateau clouds over fast and the Devil's Ladder is loose, eroded ground.",
    permits: "No permits or fees; the usual trailheads are on private land where a small parking charge is normal.",
    season: "May to September for the best chance of clear weather, though it is climbed year round.",
    gear: "Waterproofs, boots with grip, map and compass or GPS, food and water. Nothing technical outside winter.",
    terrain: "Boggy valley approach, a steep loose gully and rocky ground on the ridge.",
  },
};

function seasonFor(lat: number): string {
  const abs = Math.abs(lat);
  if (abs >= 50) return lat > 0 ? "late June to mid-September" : "December to March";
  if (abs >= 30) return lat > 0 ? "May to October (July–September for the high routes)" : "November to March";
  if (abs >= 23) return lat > 0 ? "March to November" : "September to May";
  return "the local dry season — anytime outside the monsoon or rainy months";
}

function durationFor(difficulty: Difficulty | undefined, elevation: number): string {
  if (elevation < 800) return "1–4 hours round trip — a short walk rather than a mountaineering day";
  if (difficulty === "expert") return "a full expedition of one to several weeks, including acclimatisation";
  if (difficulty === "hard") return elevation > 5000 ? "5–20 days with acclimatisation camps" : "2–3 days including an approach and a hut or bivouac";
  if (difficulty === "moderate") return "8–14 hours round trip, or two days using a mountain hut";
  if (difficulty === "easy") return "4–8 hours round trip from the standard trailhead";
  return "1–3 hours round trip";
}

function guidingFor(difficulty: Difficulty | undefined): string {
  switch (difficulty) {
    case "expert":
      return "Yes. This is expedition terrain — a guided team or a very experienced, self-sufficient partnership is essential, and permits or logistics support are usually mandatory.";
    case "hard":
      return "Strongly recommended unless you are an experienced alpinist. Glacier travel, altitude or remoteness make an unguided attempt serious.";
    case "moderate":
      return "Not required if you are comfortable with exposed scrambling and mountain navigation, but a guide is a good call in poor visibility or early season.";
    case "easy":
      return "No guide needed. A marked trail, decent fitness and a map or GPS track are enough for most fit hikers.";
    default:
      return "No. It is a straightforward walk that anyone in normal health can do without a guide.";
  }
}

function gearFor(difficulty: Difficulty | undefined): string {
  switch (difficulty) {
    case "expert":
      return "Full expedition kit: rope, crampons, ice axe, harness, high-altitude clothing, tents and fuel.";
    case "hard":
      return "Crampons, ice axe, harness, rope and glacier-rescue gear plus warm layers and a helmet.";
    case "moderate":
      return "Helmet, sturdy boots, wind and rain shell, headtorch, and a via-ferrata set if the route is cabled.";
    case "easy":
      return "Hiking boots, waterproofs, water, food and navigation. Nothing technical.";
    default:
      return "Comfortable shoes and a jacket. No specialist equipment.";
  }
}

function terrainFor(difficulty: Difficulty | undefined): string {
  switch (difficulty) {
    case "expert":
      return "Glaciated, remote and high-altitude terrain with objective hazards.";
    case "hard":
      return "Glacier, snow or sustained technical rock at altitude.";
    case "moderate":
      return "Steep trails with scrambling, loose rock or short exposed sections.";
    case "easy":
      return "Marked walking trails with a sustained but non-technical climb.";
    default:
      return "Gentle paths, tracks or even a short stroll from a road.";
  }
}

export function getPeakGuideFacts(
  difficulty: Difficulty | undefined,
  elevation: number,
  lat: number,
  country?: string,
): PeakGuideFacts {
  const base: PeakGuideFacts = {
    duration: durationFor(difficulty, elevation),
    guideNeeded: guidingFor(difficulty),
    season: seasonFor(lat),
    gear: gearFor(difficulty),
    terrain: terrainFor(difficulty),
  };
  const override = country ? peakGuideOverrides[country] : undefined;
  return override ? { ...base, ...override } : base;
}
