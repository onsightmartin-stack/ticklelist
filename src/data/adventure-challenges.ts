/**
 * Challenges that mix summits and places — progress is computed from both the
 * ascent logbook (`hp:` / `fp:` catalog keys) and the visits logbook
 * (`co:` country keys and `pl:` curated place keys).
 */
export interface AdventureChallenge {
  id: string;
  name: string;
  blurb: string;
  /** Peak catalog keys that count as a tick. */
  peaks?: { key: string; alt?: string[] }[];
  /** Place catalog keys that count as a tick. */
  places?: string[];
}

export const adventureChallenges: AdventureChallenge[] = [
  {
    id: "new-7-wonders",
    name: "New 7 Wonders of the World",
    blurb: "The seven modern wonders voted in 2007, plus the honorary Great Pyramid of Giza.",
    places: [
      "pl:Great Wall of China",
      "pl:Petra",
      "pl:Christ the Redeemer",
      "pl:Machu Picchu",
      "pl:Chichén Itzá",
      "pl:Colosseum",
      "pl:Taj Mahal",
      "pl:Great Pyramid of Giza",
    ],
  },
  {
    id: "ancient-7-wonders",
    name: "Seven Wonders of the Ancient World",
    blurb: "The classical list — only the Great Pyramid still stands, the rest count as visiting their sites.",
    places: [
      "pl:Great Pyramid of Giza",
      "pl:Hanging Gardens of Babylon",
      "pl:Statue of Zeus at Olympia",
      "pl:Temple of Artemis at Ephesus",
      "pl:Mausoleum at Halicarnassus",
      "pl:Colossus of Rhodes",
      "pl:Lighthouse of Alexandria",
    ],
  },
  {
    id: "seven-natural-wonders",
    name: "Seven Natural Wonders",
    blurb: "The classic natural wonders of the world — from the Grand Canyon to the Northern Lights.",
    places: [
      "pl:Grand Canyon",
      "pl:Great Barrier Reef",
      "pl:Harbour of Rio de Janeiro",
      "pl:Victoria Falls",
      "pl:Northern Lights",
      "pl:Parícutin volcano",
      "pl:Mount Everest Base Camp",
    ],
  },
  {
    id: "explorers-grand-slam",
    name: "Explorers Grand Slam",
    blurb: "The Seven Summits plus the North and South Poles — the ultimate adventure ticklist.",
    peaks: [
      { key: "fp:Everest" },
      { key: "fp:Aconcagua", alt: ["hp:Argentina"] },
      { key: "fp:Denali", alt: ["hp:United States"] },
      { key: "fp:Kilimanjaro", alt: ["hp:Tanzania"] },
      { key: "fp:Elbrus", alt: ["hp:Russia"] },
      { key: "fp:Vinson", alt: ["hp:Antarctica"] },
      { key: "fp:Puncak Jaya (Carstensz Pyramid)", alt: ["hp:Indonesia", "fp:Kosciuszko", "hp:Australia"] },
    ],
    places: ["pl:North Pole", "pl:South Pole"],
  },
  {
    id: "seven-continents",
    name: "Seven continents",
    blurb: "Set foot on every continent on Earth.",
    places: [],
  },
  {
    id: "swim-all-oceans",
    name: "Swim in all five oceans",
    blurb: "Atlantic, Pacific, Indian, Arctic and Southern — a dip in each counts.",
    places: [
      "pl:Atlantic Ocean",
      "pl:Pacific Ocean",
      "pl:Indian Ocean",
      "pl:Arctic Ocean",
      "pl:Southern Ocean",
    ],
  },
  {
    id: "seven-seas",
    name: "The Seven Seas",
    blurb: "Mediterranean, Baltic, Black, Red, Caribbean, Caspian and the Dead Sea.",
    places: [
      "pl:Mediterranean Sea",
      "pl:Baltic Sea",
      "pl:Black Sea",
      "pl:Red Sea",
      "pl:Caribbean Sea",
      "pl:Caspian Sea",
      "pl:Dead Sea",
    ],
  },
  {
    id: "great-deserts",
    name: "Great deserts",
    blurb: "Sahara, Gobi, Atacama, Namib, Kalahari, the Empty Quarter and the Antarctic polar desert.",
    places: [
      "pl:Sahara desert",
      "pl:Gobi desert",
      "pl:Atacama desert",
      "pl:Namib desert",
      "pl:Kalahari desert",
      "pl:Rub' al Khali (Empty Quarter)",
      "pl:Antarctic polar desert",
    ],
  },
  {
    id: "european-extremities",
    name: "Four corners of Europe",
    blurb: "The northernmost, southernmost, easternmost and westernmost points of mainland Europe.",
    places: [
      "pl:Kinnarodden (northernmost)",
      "pl:Punta de Tarifa (southernmost)",
      "pl:Cape Flissingsky (easternmost)",
      "pl:Cabo da Roca (westernmost)",
    ],
  },
  {
    id: "poles-and-baikal",
    name: "Cold extremes",
    blurb: "North Pole, South Pole and a swim in Lake Baikal.",
    places: ["pl:North Pole", "pl:South Pole", "pl:Lake Baikal"],
  },
];

