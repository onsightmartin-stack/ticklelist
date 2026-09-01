/**
 * Per-country SEO overrides for /peak/[country] pages.
 *
 * Used where search demand sits on the *peak name* rather than the
 * "highest mountain in X" phrasing (e.g. "Hallasan" gets far more searches
 * than "highest mountain in south korea"). Anything not listed here falls
 * back to the generated title/description/FAQ set.
 */
export interface PeakSeoOverride {
  /** <title> (<= 60 chars). */
  title?: string;
  /** Meta description (<= 155 chars). */
  description?: string;
  /** Alternate names / romanisations searchers actually type. */
  aliases?: string[];
  /** Extra intro copy appended under "About <peak>". */
  intro?: string;
  /** Extra FAQ entries appended to the generated set. */
  faqs?: { question: string; answer: string }[];
  /** Long-form editorial sections rendered under the route/season block. */
  sections?: {
    heading: string;
    paragraphs?: string[];
    bullets?: string[];
    /** Optional simple two-column fact table. */
    table?: { caption?: string; rows: [string, string][] };
  }[];
}

export const peakSeo: Record<string, PeakSeoOverride> = {
  "South Korea": {
    title: "Hallasan (Mt. Halla): South Korea's Highest Mountain",
    description:
      "Hallasan (Mt. Halla), 1,950 m on Jeju Island, is South Korea's highest mountain. Trails, permits, best season, crater lake and a summit video.",
    aliases: ["Hallasan", "Mt. Halla", "Mount Halla", "한라산", "Halla-san"],
    intro:
      "Hallasan — also written Mt. Halla, Mount Halla or 한라산 — is the highest mountain in South Korea at 1,950 m, and the centrepiece of Hallasan National Park on Jeju Island. Two trails reach the top: Seongpanak (9.6 km, the gentler one) and Gwaneumsa (8.7 km, steeper and more scenic). Both finish at the Baengnokdam crater lake. Hikers must reserve a free online permit in advance and start early — rangers turn people back at the gates in the afternoon.",
    faqs: [
      {
        question: "How tall is Hallasan?",
        answer:
          "Hallasan is 1,950 metres (6,398 feet) tall, making it the highest mountain in South Korea and the highest point on Jeju Island.",
      },
      {
        question: "Which trail should I take up Hallasan?",
        answer:
          "Seongpanak (9.6 km each way) is the easier, more gradual route and the most popular. Gwaneumsa (8.7 km each way) is steeper with better scenery. Many hikers go up Gwaneumsa and down Seongpanak.",
      },
      {
        question: "Do you need a permit to hike Hallasan?",
        answer:
          "Yes — the summit trails require a free reservation booked online in advance, and there are cut-off times at the checkpoints. Book early, especially for weekends and autumn foliage season.",
      },
      {
        question: "How hard is the Hallasan hike?",
        answer:
          "It is a long day hike rather than a technical climb: roughly 8-10 hours round trip on well-maintained stone steps and boardwalks, with no scrambling or gear required in summer.",
      },
    ],
    sections: [
      {
        heading: "Hallasan trails compared: Seongpanak vs Gwaneumsa",
        paragraphs: [
          "Only two of Hallasan's trails reach the Baengnokdam crater at the summit. The rest — Eoseungsaengak, Yeongsil and Eorimok — top out on the plateau below and turn back, which is the single most common mistake first-time Mt. Halla hikers make when planning a Jeju hiking day.",
        ],
        table: {
          caption: "Summit trails on Hallasan (Jeju Island)",
          rows: [
            ["Seongpanak trail", "9.6 km each way, ~950 m ascent, 8-9 h round trip. Gentlest gradient, forested, easiest to pace."],
            ["Gwaneumsa trail", "8.7 km each way, ~1,400 m ascent, 9-10 h round trip. Steeper, stairs and suspension bridges, far better views."],
            ["Best combination", "Up Gwaneumsa, down Seongpanak — the classic traverse. Buses link both trailheads back to Jeju City."],
            ["Non-summit trails", "Yeongsil and Eorimok reach Witseoreum shelter (1,700 m) only — good short options in bad weather."],
          ],
        },
      },
      {
        heading: "Permits, cut-off times and booking Hallasan",
        bullets: [
          "A free reservation (QR code) is required for both summit trails and is checked at the gate — book on the Hallasan National Park reservation site up to a month ahead.",
          "Daily quotas apply: roughly 1,000 hikers on Seongpanak and 500 on Gwaneumsa.",
          "Entry cut-offs shift with the season — typically 05:30-12:00 in summer and as early as 06:00-10:00 in winter. Miss the checkpoint below the summit and rangers turn you back.",
          "There is no water on the upper mountain and no food sold on the trail. Carry 2 litres and lunch; the shelters sell nothing.",
          "Weather on Jeju changes fast. Trails close in typhoons and heavy snow — check the park notice board the morning you go.",
        ],
      },
      {
        heading: "Best time to hike Mt. Halla",
        paragraphs: [
          "October and November are the prime months: cool air, clear views over Jeju and the island's famous autumn colour. May and June bring azaleas across the plateau. Winter is the most spectacular and the most demanding — the summit is buried in snow with rime-covered trees, and microspikes are effectively mandatory from December to March. July and August are hot, humid and typhoon-prone, with the crater usually in cloud.",
        ],
      },
      {
        heading: "Getting to the trailheads from Jeju City",
        bullets: [
          "Seongpanak: bus 281 from Jeju City bus terminal, roughly 40 minutes, running from before dawn.",
          "Gwaneumsa: bus 475 from Jeju City, about 30 minutes; the campsite at the trailhead makes an early start easy.",
          "Taxis from Jeju City run 20,000-30,000 KRW to either trailhead and are worth it for the first bus-less start.",
          "Jeju is served by direct flights from Seoul Gimpo (one of the busiest air routes in the world), Busan and much of East Asia.",
        ],
      },
    ],
  },
  Mongolia: {
    title: "Khüiten Peak: Mongolia's Highest Mountain (4,374 m)",
    description:
      "Khüiten Peak (Huiten Uul), 4,374 m in the Altai Mountains, is Mongolia's highest mountain. Access via Tavan Bogd, permits, season, glacier route and difficulty.",
    aliases: ["Khuiten Peak", "Huiten Uul", "Kuitun", "Tavan Bogd", "Хүйтэн оргил"],
    intro:
      "Khüiten Peak — often spelled Khuiten or Huiten Uul — is the highest mountain in Mongolia at 4,374 m, standing on the tripoint of Mongolia, China and Russia in the Altai Mountains. It is the tallest of the five Tavan Bogd summits, reached from Ölgii in Bayan-Ölgii province via a long off-road drive and a multi-day approach by camel or horse to the Potanin Glacier. A border permit and national park permit are both required, and the glacier approach means crampons, rope and ice axe are mandatory.",
    faqs: [
      {
        question: "How high is Khüiten Peak?",
        answer:
          "Khüiten Peak is 4,374 metres (14,350 feet) high — the highest mountain in Mongolia and the highest of the Tavan Bogd massif in the Altai range.",
      },
      {
        question: "How do you get to Khüiten Peak?",
        answer:
          "Fly to Ölgii in Bayan-Ölgii province, then a full day of off-road driving to the park gate, followed by a one to two day approach on foot, horse or camel to base camp below the Potanin Glacier.",
      },
      {
        question: "What permits do you need for Tavan Bogd?",
        answer:
          "You need an Altai Tavan Bogd National Park permit and a border-zone permit, since the summit sits on the Mongolia-China-Russia tripoint. Both are usually arranged through a local operator in Ölgii.",
      },
      {
        question: "Is Khüiten Peak a technical climb?",
        answer:
          "Yes — it is a glacier climb. The route crosses the crevassed Potanin Glacier and finishes on a steep snow slope, so rope, harness, crampons and an ice axe are required along with glacier travel skills.",
      },
    ],
    sections: [
      {
        heading: "The Tavan Bogd massif: Mongolia's highest mountains",
        paragraphs: [
          "Khüiten is one of the Five Saints — Tavan Bogd — the cluster of glaciated summits at the western tip of Mongolia where the Altai Mountains meet China and Russia. Between them they hold the largest glacier in the country, the 14 km Potanin, and every one of Mongolia's highest mountains.",
        ],
        table: {
          caption: "The five Tavan Bogd summits",
          rows: [
            ["Khüiten (Хүйтэн)", "4,374 m — Mongolia's highest point, on the China-Russia-Mongolia tripoint. Glacier route, roped."],
            ["Nairamdal", "4,180 m — the actual tripoint marker; a common acclimatisation objective."],
            ["Malchin", "4,050 m — the non-technical one. A steep scree walk from base camp, no rope needed, and the usual consolation summit."],
            ["Bürged", "4,068 m — rarely climbed."],
            ["Ölgii", "4,050 m — rarely climbed."],
          ],
        },
      },
      {
        heading: "How a Khüiten Peak expedition actually runs",
        bullets: [
          "Days 1-2: fly Ulaanbaatar to Ölgii (about 3 h), organise permits, food and a driver.",
          "Day 3: 6-9 hours of off-road driving to Tsagaan Gol and the park gate.",
          "Day 4: 15-20 km approach to base camp at roughly 3,000 m below the Potanin Glacier — on foot with camels or horses carrying loads.",
          "Day 5: acclimatisation, usually up Malchin Peak (4,050 m) for the view into Russia and China.",
          "Day 6: alpine start, rope up on the Potanin Glacier, weave the crevasse field and climb the final 40-45° snow slope to the summit.",
          "Days 7-9: reverse the approach with weather margin. Two spare days is the realistic minimum.",
        ],
      },
      {
        heading: "Permits, guides and costs",
        paragraphs: [
          "Two permits are needed: the Altai Tavan Bogd National Park entry permit and a border-zone permit, because the summit ridge is the international frontier. Both are handled in Ölgii and both need your passport details a few days in advance. Border guards do check.",
          "Independent travel is legally possible but practically rare — the glacier, the driving and the permit paperwork mean almost everyone books a local operator in Ölgii. Expect roughly USD 1,500-2,500 per person for a 8-10 day trip including transport, permits, camels, guide and food, and less if you assemble a group and hire a driver directly.",
        ],
      },
      {
        heading: "Best season and conditions in the Mongolian Altai",
        paragraphs: [
          "The season is short: mid-June to early September, with July and August the most settled. Even then base camp regularly drops below freezing overnight and the Altai wind is relentless. Outside summer the access track is impassable and the massif turns full winter-expedition. Combine the trip with the Golden Eagle Festival in Ölgii in early October only if you are travelling, not climbing.",
        ],
        bullets: [
          "Glacier kit: rope, harness, crampons, ice axe, prusiks, plus crevasse-rescue skills.",
          "Four-season tent and a sleeping bag rated to -15 °C at minimum.",
          "No mobile coverage past Ölgii — a satellite messenger is the only realistic rescue link.",
        ],
      },
    ],
  },

  "Bhutan": {
    title: "Gangkhar Puensum: Bhutan's Unclimbed 7,570 m Highpoint",
    description:
      "Gangkhar Puensum (7,570 m) is Bhutan's highest mountain and the highest unclimbed peak on Earth. Why climbing is banned, trekking alternatives and mountaineering rules.",
    aliases: ["Gangkhar Puensum", "Gangkar Punsum", "Gankar Punzum", "གངས་དཀར་སྤུན་གསུམ"],
    intro:
      "Gangkhar Puensum — 'White Peak of the Three Spiritual Brothers' — is the highest mountain in Bhutan at 7,570 m and, uniquely, the highest mountain on Earth that nobody has ever stood on top of. Mountaineering in Bhutan above 6,000 m has been prohibited since 2003, so the summit is legally out of reach. What you can still do is trek deep into the Snowman Trek country beneath it, or climb legally in neighbouring Nepal and India instead.",
    faqs: [
      {
        question: "Can you climb mountains in Bhutan?",
        answer:
          "Not the high ones. Bhutan restricted mountaineering above 6,000 m in 1994 and banned it outright in 2003, out of respect for the deities local communities believe inhabit the peaks. Trekking below that altitude is fully allowed and well organised.",
      },
      {
        question: "Why is Gangkhar Puensum unclimbed?",
        answer:
          "Four expeditions attempted it between 1985 and 1986 without success, and Bhutan then closed high peaks to climbing. A 1998 Japanese team summited a subsidiary top, Liankang Kangri, from Tibet, but the main summit remains untouched.",
      },
      {
        question: "Has anyone ever reached the summit of Gangkhar Puensum?",
        answer:
          "No. It is the highest unclimbed mountain in the world. Its exact position on the Bhutan-China border was also disputed for years, which added a diplomatic obstacle on top of the ban.",
      },
      {
        question: "What is the best trek to see Gangkhar Puensum?",
        answer:
          "The Snowman Trek through Lunana, and the shorter Bumthang-side treks, give distant views of the massif. All trekking in Bhutan requires a licensed operator, a guide and the daily Sustainable Development Fee.",
      },
    ],
    sections: [
      {
        heading: "Mountaineering in Bhutan: what is and isn't allowed",
        paragraphs: [
          "Bhutan is the only Himalayan country that has closed its highest mountains on principle rather than for logistics or politics. Peaks above 6,000 m were restricted in 1994 and all mountaineering was banned in 2003, because summits such as Jhomolhari, Jichu Drake and Gangkhar Puensum are regarded as the homes of protective deities. That decision has never been reversed, and there is no permit process to apply through — the answer is simply no.",
          "Everything below that line is open and genuinely excellent. Bhutan runs a guided-tourism model: you book through a licensed Bhutanese operator, travel with a guide, and pay a per-night Sustainable Development Fee on top of your trip cost. In return the trails are quiet and the camps are far less crowded than anything comparable in Nepal.",
        ],
        bullets: [
          "Climbing above 6,000 m: prohibited nationwide, no exceptions for foreign expeditions.",
          "Trekking below 6,000 m: allowed, guided, and permitted through your operator.",
          "Independent, unguided trekking: not permitted for foreign visitors.",
          "Drone flying near peaks and monasteries: requires separate approval and is usually refused.",
        ],
      },
      {
        heading: "The realistic alternatives if you want Himalayan altitude",
        paragraphs: [
          "If Bhutan is on your list because of the mountains rather than the summit tick, the practical plan is to trek in Bhutan and climb in Nepal. The Snowman Trek — roughly 25 days across Lunana with eleven passes above 4,500 m — is the hardest mainstream trek in the Himalaya and passes through the country that Gangkhar Puensum overlooks. On the climbing side, Nepal's trekking peaks (Island Peak 6,189 m, Mera Peak 6,476 m, Lobuche East 6,119 m) give comparable altitude with a legal permit.",
        ],
        table: {
          caption: "Bhutan high-mountain travel at a glance",
          rows: [
            ["Highest point", "Gangkhar Puensum, 7,570 m"],
            ["Summit status", "Unclimbed — highest unclimbed mountain in the world"],
            ["Climbing legality", "Banned above 6,000 m since 2003"],
            ["Best trekking season", "Late September to mid-November; April to May"],
            ["Access", "Licensed Bhutanese operator, guide and daily SDF required"],
            ["Nearest legal high climb", "Nepal's trekking peaks, 6,100-6,500 m"],
          ],
        },
      },
    ],
  },
  "Finland": {
    title: "Halti: Finland's Highest Point (1,324 m) in Lapland",
    description:
      "Halti is Finland's highest point at 1,324 m — a shoulder below the Norwegian summit. Route from Kilpisjärvi, hut chain, best season and what the hike is really like.",
    aliases: ["Halti", "Haltitunturi", "Háldičohkka", "Halditsohkka", "Halti fell"],
    intro:
      "Halti is the highest point in Finland at 1,324 m, but it is not a summit: the Finnish highpoint sits on a broad shoulder of the Halti massif, while the actual peak (Háldičohkka, 1,365 m) lies just across the border in Norway. Getting there is the real challenge — a 55 km hike each way from Kilpisjärvi through open Lapland fell country, usually done over four to five days using the free wilderness huts along the Kalottireitti trail.",
    faqs: [
      {
        question: "How high is Halti and is it a real mountain?",
        answer:
          "Finland's highpoint on Halti is 1,324 m. It is a rounded fell shoulder rather than a peak — the true 1,365 m summit is in Norway, a short walk further along the ridge.",
      },
      {
        question: "How long does the hike to Halti take?",
        answer:
          "Most hikers take four to five days round trip: roughly 55 km each way from Kilpisjärvi, with overnights in the wilderness huts. Fast, light parties do it in three.",
      },
      {
        question: "Do you need a permit or guide to hike to Halti?",
        answer:
          "No permit and no guide. Finland's everyman's right covers hiking and wild camping, and the open wilderness huts are free and first-come, first-served.",
      },
      {
        question: "When is the best time to hike Halti?",
        answer:
          "Late July to early September. Before that there is heavy snow and flooded river crossings; the mosquito peak is mid-July; autumn colours in early September are the highlight of the year.",
      },
    ],
    sections: [
      {
        heading: "The route from Kilpisjärvi, day by day",
        bullets: [
          "Day 1: Kilpisjärvi to Saarijärvi hut, about 16 km of easy birch-forest and fell walking.",
          "Day 2: Saarijärvi to Kuonjarjoki hut, about 15 km, with the first big open fell sections.",
          "Day 3: Kuonjarjoki to Meekonjärvi or Halti hut, about 15-20 km, crossing streams that can run high after rain.",
          "Day 4: Halti hut to the Finnish highpoint and, if you want the true summit, 40 minutes more into Norway.",
          "Days 5-6: retrace the trail, or arrange a boat shuttle across Kilpisjärvi lake to cut the last stretch.",
        ],
        paragraphs: [
          "There is a shortcut worth knowing: a summer boat service across Kilpisjärvi to Koltaluokta trims roughly 10 km off each end of the walk, which turns a five-day trip into a comfortable four. Some hikers also approach from the Norwegian side via Guolasjávri, which reaches the summit in a single long day but skips the part of the trip most people come for.",
        ],
      },
      {
        heading: "Huts, gear and Arctic conditions",
        paragraphs: [
          "The Kalottireitti huts are open wilderness huts maintained by Metsähallitus: free, unlocked, with bunks, a wood stove and no booking. They can fill on August weekends, so carry a tent regardless. There is no mobile coverage over most of the route and no resupply after Kilpisjärvi.",
          "Weather is the deciding factor. This is Arctic fell country above the treeline, where wind-driven rain near freezing is normal in August and snow is possible any month. Navigation across the plateau in fog needs a map, compass and GPS rather than a phone alone.",
        ],
        table: {
          caption: "Halti hike facts",
          rows: [
            ["Finnish highpoint", "1,324 m (true summit 1,365 m, in Norway)"],
            ["Distance", "About 55 km each way from Kilpisjärvi"],
            ["Typical duration", "4-5 days round trip"],
            ["Difficulty", "Non-technical, but remote and weather-exposed"],
            ["Season", "Late July to early September"],
            ["Accommodation", "Free open wilderness huts plus a tent as backup"],
          ],
        },
      },
    ],
  },
  "Sri Lanka": {
    title: "Pidurutalagala: Sri Lanka's Highest Mountain (2,524 m)",
    description:
      "Pidurutalagala (Mount Pedro), 2,524 m above Nuwara Eliya, is Sri Lanka's highest mountain. Access rules to the restricted summit, and where to hike instead.",
    aliases: ["Pidurutalagala", "Mount Pedro", "Piduruthalagala", "පිදුරුතලාගල"],
    intro:
      "Pidurutalagala — also called Mount Pedro — is the highest mountain in Sri Lanka at 2,524 m, rising directly above the tea town of Nuwara Eliya. It is unusual among country highpoints: the summit is an active military communications site, so the top is closed to the public and the tarred access road is checkpoint-controlled. Most visitors reach the lower viewpoint, then hike Sri Lanka's genuinely open high peaks instead.",
    faqs: [
      {
        question: "Can you visit the summit of Pidurutalagala?",
        answer:
          "Not freely. The summit hosts a military and broadcasting installation and is a restricted zone. Access is by the controlled road with prior clearance only; foreign visitors are usually turned back at the checkpoint above Nuwara Eliya.",
      },
      {
        question: "How high is Pidurutalagala?",
        answer:
          "2,524 metres (8,281 feet). It is both the highest mountain and the most prominent peak in Sri Lanka, since its prominence equals its full height.",
      },
      {
        question: "Which Sri Lankan mountain can you actually climb?",
        answer:
          "Kirigalpotta (2,388 m) is the highest legally hikeable summit, inside Horton Plains National Park. Adam's Peak (2,243 m) is the famous pilgrimage climb, and Knuckles Range trails offer multi-day hiking.",
      },
      {
        question: "What is the best time to visit the Nuwara Eliya highlands?",
        answer:
          "January to April is driest and clearest in the central highlands. Mornings are best for views before cloud builds; nights near the summits drop close to freezing.",
      },
    ],
    sections: [
      {
        heading: "Why the highest point is off limits",
        paragraphs: [
          "Pidurutalagala carries the country's main television and radio transmitters plus military communications equipment, and it has been a controlled zone for decades. A sealed road runs to the top from Nuwara Eliya, but a guarded checkpoint sits partway up and photography beyond it is restricted. Local tour drivers sometimes offer to arrange access; in practice permission is rarely granted, and highpointers usually settle for the lower Mount Pedro viewpoint and the trail through the surrounding cloud forest.",
        ],
      },
      {
        heading: "The peaks to climb instead, ranked",
        bullets: [
          "Kirigalpotta, 2,388 m — Sri Lanka's highest walkable summit, a 7 km trail from the Horton Plains entrance, permit bought at the gate.",
          "Totapolakanda (Kirigalpoththa's neighbour), 2,357 m — shorter, easier, same park ticket.",
          "Adam's Peak (Sri Pada), 2,243 m — 5,500 steps by night in the December-May pilgrimage season, sunrise shadow-cone at the top.",
          "Knuckles Range, up to 1,863 m — the best multi-day hiking on the island, with a guide required in the conservation zone.",
        ],
        table: {
          caption: "Sri Lanka highpoint facts",
          rows: [
            ["Highest mountain", "Pidurutalagala (Mount Pedro), 2,524 m"],
            ["Prominence", "2,524 m — an ultra-prominent peak"],
            ["Summit access", "Restricted military zone, closed to general visitors"],
            ["Nearest town", "Nuwara Eliya, about 5 km south"],
            ["Highest legal hike", "Kirigalpotta, 2,388 m, Horton Plains"],
            ["Best season", "January to April"],
          ],
        },
      },
    ],
  },
  Switzerland: {
    title: "Dufourspitze: Switzerland's Highest Mountain (4,634 m)",
    description:
      "The highest mountain in Switzerland is Dufourspitze (Monte Rosa), 4,634 m in the Pennine Alps. Routes from Zermatt, huts, season, difficulty and the 4,000 m list.",
    aliases: ["Dufourspitze", "Monte Rosa", "Punta Dufour", "Pointe Dufour", "Monte Rosa massif"],
    intro:
      "The highest mountain in Switzerland is Dufourspitze, the 4,634 m main summit of the Monte Rosa massif in the Pennine Alps above Zermatt — also the second highest mountain in the Alps after Mont Blanc. It is a serious glacier mountaineering objective rather than a hike: the standard line from the Monte Rosa Hut crosses the Gorner and Grenz glaciers before a rocky summit ridge graded around AD, with roughly 1,800 m of ascent on summit day.",
    faqs: [
      {
        question: "What is the highest mountain in Switzerland?",
        answer:
          "Dufourspitze, the main summit of Monte Rosa, at 4,634 m (15,203 ft). It sits on the Swiss-Italian border in the Pennine Alps and is the second highest summit in the Alps.",
      },
      {
        question: "Is the Matterhorn the highest mountain in Switzerland?",
        answer:
          "No. The Matterhorn is 4,478 m — famous, but 156 m lower than Dufourspitze. Switzerland's highest point is the Monte Rosa massif's Dufourspitze at 4,634 m.",
      },
      {
        question: "How hard is Dufourspitze to climb?",
        answer:
          "It is a full alpine route, roughly AD with rock up to grade II-III on the summit ridge, on glaciated terrain. Rope, crampons, ice axe and glacier travel experience are required, and most parties either hire a guide or have prior 4,000 m experience.",
      },
      {
        question: "What is the easiest 4,000 m peak near Zermatt?",
        answer:
          "The Breithorn (4,164 m) is the usual first 4,000er — a short glacier walk from the Klein Matterhorn lift. The Allalinhorn (4,027 m) above Saas-Fee is the other classic beginner summit.",
      },
    ],
    sections: [
      {
        heading: "Climbing Dufourspitze from Zermatt",
        paragraphs: [
          "Almost everyone starts in Zermatt, takes the Gornergrat railway to Rotenboden and drops onto the Gorner Glacier for the walk in to the Monte Rosa Hut (2,883 m). Summit day begins around 02:00: up the Monte Rosa Glacier, over the Sattel, then along the rocky Grenzgipfel ridge to the top. It is a 10-14 hour round trip from the hut, and parties that leave late routinely turn back as the snow bridges soften.",
        ],
        table: {
          caption: "Dufourspitze (Monte Rosa) facts",
          rows: [
            ["Elevation", "4,634 m (15,203 ft) — highest point in Switzerland"],
            ["Prominence", "2,165 m"],
            ["Range", "Pennine Alps, Monte Rosa massif"],
            ["Standard route", "Monte Rosa Hut, west ridge / Grenzgipfel, around AD"],
            ["Base", "Zermatt, Valais"],
            ["Season", "Mid-June to mid-September"],
          ],
        },
      },
      {
        heading: "The highest mountains in Switzerland after Dufourspitze",
        bullets: [
          "Dufourspitze (Monte Rosa) — 4,634 m, the country highpoint.",
          "Nordend — 4,609 m, the northern summit of the same Monte Rosa massif.",
          "Zumsteinspitze — 4,563 m, on the Swiss-Italian frontier ridge.",
          "Signalkuppe (Punta Gnifetti) — 4,554 m, home to the Margherita Hut, the highest building in Europe.",
          "Dom — 4,545 m, the highest summit entirely inside Switzerland.",
          "Matterhorn — 4,478 m, the most photographed but not the highest.",
        ],
      },
    ],
  },
  Sweden: {
    title: "Kebnekaise: Sweden's Highest Mountain (2,097 m)",
    description:
      "The highest mountain in Sweden is Kebnekaise Nordtoppen, 2,097 m in Lapland. Why the ice-capped south peak lost the title, routes from Nikkaluokta and best season.",
    aliases: ["Kebnekaise", "Nordtoppen", "Sydtoppen", "Giebmegáisi"],
    intro:
      "The highest mountain in Sweden is Kebnekaise in Swedish Lapland, and since 2019 the true highpoint has been Nordtoppen, the bare-rock north peak at 2,097 m. The glacier-capped south peak, Sydtoppen, was long the higher of the two but has melted below its neighbour and keeps shrinking each summer. That makes Sweden's highpoint one of the few in the world that changed summit within living memory — and a much harder objective than most people expect, because Nordtoppen is reached by an exposed, often corniced ridge rather than a walking trail.",
    faqs: [
      {
        question: "What is the highest mountain in Sweden?",
        answer:
          "Kebnekaise Nordtoppen (North Peak), 2,096.8 m of solid bedrock. It overtook the ice-covered Sydtoppen in 2019 as glacier melt lowered the south summit.",
      },
      {
        question: "How tall is Kebnekaise's south peak now?",
        answer:
          "Tarfala Research Station measures Sydtoppen every September: 2,093.2 m in 2023, 2,089.9 m in 2024 after a record 3.3 m of melt, and 2,088.4 m in 2025 — now about 8.4 m below Nordtoppen.",
      },
      {
        question: "Can you hike to the top of Kebnekaise?",
        answer:
          "Sydtoppen is a long but non-technical hike on the western route from Nikkaluokta, roughly 19 km each way with 1,700 m of ascent. Nordtoppen, the actual highpoint, requires crossing a narrow, exposed and frequently corniced ridge and is a mountaineering route best done roped, often with a guide.",
      },
      {
        question: "When is the best time to climb Kebnekaise?",
        answer:
          "Late June to early September for the western route. The eastern route over the glacier needs a guide and settled conditions, and the midnight sun in June and July gives almost unlimited daylight.",
      },
    ],
    sections: [
      {
        heading: "Routes up Kebnekaise",
        table: {
          caption: "Getting to Sweden's highest point",
          rows: [
            ["Western route", "From Kebnekaise Fjällstation, ~19 km round trip, no glacier, the standard walking line to Sydtoppen."],
            ["Eastern route", "Over the Björling Glacier with a via-ferrata section — guided, faster, technically harder."],
            ["Nordtoppen", "Continue from Sydtoppen along the connecting ridge — exposed, corniced, rope and axe recommended."],
            ["Approach", "Nikkaluokta to the mountain station, 19 km on foot or partly by boat across Ladtjojaure."],
            ["Nearest town", "Kiruna, about 66 km from Nikkaluokta"],
          ],
        },
      },
    ],
  },
  Thailand: {
    title: "Doi Inthanon: Thailand's Highest Mountain (2,565 m)",
    description:
      "The highest mountain in Thailand is Doi Inthanon, 2,565 m near Chiang Mai. Summit road, entrance fees, the twin chedis, waterfalls and the best time to visit.",
    aliases: ["Doi Inthanon", "Roof of Thailand", "ดอยอินทนนท์"],
    intro:
      "The highest mountain in Thailand is Doi Inthanon at 2,565 m, the 'Roof of Thailand' in the Thanon Thong Chai range about 100 km from Chiang Mai. It is the most accessible country highpoint in Southeast Asia — a paved road runs all the way to the summit car park, and the highest point is a short walk on a boardwalk through mossy cloud forest. The mountain is named after King Inthawichayanon of Chiang Mai, an early forest conservationist whose remains are enshrined near the top.",
    faqs: [
      {
        question: "What is the highest mountain in Thailand?",
        answer:
          "Doi Inthanon, 2,565 m (8,415 ft), in Doi Inthanon National Park in Chiang Mai province.",
      },
      {
        question: "Can you drive to the summit of Doi Inthanon?",
        answer:
          "Yes. A sealed road climbs to a car park a few steps from the highest point, so the summit is reachable by car, motorbike, songthaew or day tour from Chiang Mai.",
      },
      {
        question: "How cold does Doi Inthanon get?",
        answer:
          "Summit temperatures fall to around 0-5 °C on winter mornings and frost is common in December and January — bring a jacket even though the lowlands are hot.",
      },
      {
        question: "What else is worth seeing on the mountain?",
        answer:
          "The twin royal chedis Naphamethinidon and Naphaphonphumisiri with their terraced gardens, the Ang Ka nature trail at the summit, Wachirathan and Mae Ya waterfalls, and the Kew Mae Pan ridge trail (open November to May, local guide required).",
      },
    ],
    sections: [
      {
        heading: "Visiting Doi Inthanon from Chiang Mai",
        bullets: [
          "Roughly 2 to 2.5 hours by road from Chiang Mai — day tours, rented scooters and private drivers all work.",
          "National park entrance fees are charged at the gate, with a separate ticket for the chedis.",
          "Go early: the summit sits in cloud by late morning for much of the year.",
          "Best season is November to February for cool, clear air; the rainy season from June to October brings mist and leeches on the trails.",
          "The summit boardwalk is short and flat, so this highpoint suits families and non-hikers.",
        ],
      },
    ],
  },
  Canada: {
    title: "Mount Logan: Canada's Highest Mountain (5,959 m)",
    description:
      "The highest mountain in Canada is Mount Logan, 5,959 m in Yukon's Saint Elias range. Expedition logistics, ski-plane access, routes and how it compares to Denali.",
    aliases: ["Mount Logan", "Mt Logan", "Saint Elias Mountains", "Kluane"],
    intro:
      "The highest mountain in Canada is Mount Logan at 5,959 m, deep inside Kluane National Park in the Yukon's Saint Elias Mountains. It is also the second highest summit in North America after Denali, and has the largest base circumference of any non-volcanic mountain on Earth. Climbing it is a full expedition: a ski-plane flight onto a glacier, two to three weeks of load-carrying on a heavily crevassed massif, and some of the coldest weather recorded outside the polar regions.",
    faqs: [
      {
        question: "What is the highest mountain in Canada?",
        answer:
          "Mount Logan, 5,959 m (19,551 ft), in Kluane National Park, Yukon — the highest point in Canada and the second highest in North America.",
      },
      {
        question: "How do climbers reach Mount Logan?",
        answer:
          "By ski-plane charter from Kluane Lake or Silver City onto the King Trench or Hubsew glacier, followed by two to three weeks of glacier travel and load carries. Parks Canada registration is mandatory.",
      },
      {
        question: "Is Mount Logan harder than Denali?",
        answer:
          "It is lower but more remote and colder for its altitude, with a far longer approach and no fixed camps or ranger presence. Most parties rate the King Trench route as technically comparable to Denali's West Buttress but logistically more committing.",
      },
      {
        question: "Which Canadian province has the highest mountain?",
        answer:
          "Yukon, which holds Mount Logan and most of Canada's highest summits in the Saint Elias range. British Columbia's highest is Mount Fairweather (4,663 m, shared with Alaska), and Alberta's is Mount Columbia (3,747 m).",
      },
    ],
    sections: [
      {
        heading: "Mount Logan expedition facts",
        table: {
          caption: "Canada's highest point at a glance",
          rows: [
            ["Elevation", "5,959 m (19,551 ft)"],
            ["Prominence", "5,250 m — one of the most prominent peaks on Earth"],
            ["Range", "Saint Elias Mountains, Kluane National Park, Yukon"],
            ["First ascent", "1925, Albert H. MacCarthy and party"],
            ["Standard route", "King Trench, roughly 2-3 weeks round trip"],
            ["Season", "May to early June"],
          ],
        },
      },
    ],
  },
  Antarctica: {
    title: "Vinson Massif: Antarctica's Highest Mountain (4,892 m)",
    description:
      "The highest mountain in Antarctica is Mount Vinson, 4,892 m in the Ellsworth Mountains. Cost, flights via Union Glacier, route difficulty and Seven Summits context.",
    aliases: ["Mount Vinson", "Vinson Massif", "Ellsworth Mountains", "Sentinel Range"],
    intro:
      "The highest mountain in Antarctica is Mount Vinson, the 4,892 m high point of the Vinson Massif in the Sentinel Range of the Ellsworth Mountains, about 1,200 km from the South Pole. It is one of the Seven Summits and the least visited of them: reaching the mountain means a charter flight from Punta Arenas in Chile to the Union Glacier blue-ice runway, then a ski-plane hop to base camp. The climbing itself is not technically hard — it is the cold, the wind and the logistics that define the expedition.",
    faqs: [
      {
        question: "What is the highest mountain in Antarctica?",
        answer:
          "Mount Vinson, 4,892 m (16,050 ft), the summit of the Vinson Massif in the Ellsworth Mountains. It is also Antarctica's most prominent peak.",
      },
      {
        question: "How hard is it to climb Mount Vinson?",
        answer:
          "Technically it is a moderate glacier climb with fixed ropes on the headwall — comparable to a straightforward alpine ascent — but temperatures of -30 °C and lower, constant wind and 24-hour daylight make it physically demanding.",
      },
      {
        question: "How much does a Vinson expedition cost?",
        answer:
          "Typically in the region of 45,000-60,000 USD, dominated by the Antarctic flight logistics rather than the guiding itself. Expeditions run over roughly 2-3 weeks in the November to January window.",
      },
      {
        question: "Does Antarctica count as a country highpoint?",
        answer:
          "On this list, yes. No nation holds sovereignty over Antarctica — the Antarctic Treaty freezes all territorial claims — but the mission covers every piece of land on Earth, so Vinson is counted alongside the country high points.",
      },
    ],
    sections: [
      {
        heading: "Getting to Mount Vinson",
        bullets: [
          "Fly commercially to Punta Arenas, Chile, then charter aircraft to the Union Glacier blue-ice runway.",
          "A ski-equipped Twin Otter continues to Vinson base camp at around 2,100 m on the Branscomb Glacier.",
          "The standard route climbs via Low Camp and High Camp (about 3,700 m) to the summit ridge.",
          "The season runs from mid-November to mid-January, when there is continuous daylight.",
          "Weather delays of several days at either end are normal — build slack into the trip.",
        ],
      },
    ],
  },
};
