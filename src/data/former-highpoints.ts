/**
 * Peaks that are commonly listed as a country's highpoint but are not
 * (or are no longer) the true highest point — superseded by resurveys,
 * glacier melt, or excluded/disputed territory.
 * Rendered on the world map as separate violet triangles.
 */
export interface FormerHighpoint {
  country: string;
  peak: string;
  elevation: number;
  coordinates: { lat: number; lng: number };
  note: string;
}

export const formerHighpoints: FormerHighpoint[] = [
  {
    country: "Serbia",
    peak: "Midžor",
    elevation: 2169,
    coordinates: { lat: 43.3961, lng: 22.6833 },
    note: "Highpoint of Serbia excluding Kosovo. The true highpoint of Serbia's claimed territory is Rudoka e Madhe (2,658 m) in the Šar Mountains.",
  },
  {
    country: "Montenegro",
    peak: "Bobotov Kuk",
    elevation: 2523,
    coordinates: { lat: 43.1258, lng: 19.03 },
    note: "Long listed as Montenegro's highpoint, but Zla Kolata (2,534 m) in the Prokletije is higher.",
  },
  {
    country: "Uzbekistan",
    peak: "Khazret Sultan (Peak 4,643 m)",
    elevation: 4643,
    coordinates: { lat: 38.4056, lng: 68.0 },
    note: "Previously listed as Uzbekistan's highpoint; a Country Highpoints differential-GPS survey confirmed Alpomish is higher.",
  },
  {
    country: "Colombia",
    peak: "Pico Cristóbal Colón",
    elevation: 5700,
    coordinates: { lat: 10.8383, lng: -73.6867 },
    note: "Usually listed as Colombia's highpoint, but a 2025 Country Highpoints survey measured its twin Pico Simón Bolívar (5,720.4 m) as higher.",
  },
  {
    country: "Saudi Arabia",
    peak: "Jabal Sawda",
    elevation: 2999,
    coordinates: { lat: 18.25, lng: 42.3667 },
    note: "Widely cited as Saudi Arabia's highpoint (2,998.7 m), but Jabal Ferwa was surveyed 3.1 m higher at 3,001.8 m.",
  },
  {
    country: "Togo",
    peak: "Mont Agou",
    elevation: 986,
    coordinates: { lat: 6.85, lng: 0.7333 },
    note: "Togo's traditional highpoint; a ground survey found Mont Atilakoutse (991 m) is higher.",
  },
  {
    country: "Guinea-Bissau",
    peak: "Monte Torin",
    elevation: 262,
    coordinates: { lat: 11.7833, lng: -14.1667 },
    note: "Often listed as the highpoint of Guinea-Bissau; Dongol Ronde (266 m) was surveyed higher.",
  },
  {
    country: "Gambia",
    peak: "Red Rocks",
    elevation: 53,
    coordinates: { lat: 13.4333, lng: -13.9167 },
    note: "The long-cited Gambian highpoint; dGPS surveys showed Sare Firasu Hill (50.9 m) is the true summit and Red Rocks is lower than mapped.",
  },
  {
    country: "Sweden",
    peak: "Kebnekaise Sydtoppen",
    elevation: 2088,
    coordinates: { lat: 67.9010, lng: 18.5169 },
    note: "Sweden's highest point until 5 August 2018, when it was measured at 2,096.5 m — 0.3 m below the bedrock Nordtoppen. Its summit glacier keeps melting: 2,088.4 m in September 2025, 8.4 m below Nordtoppen. Ascents on or before 5 Aug 2018 still count as the high point of Sweden on Ticklelist.",
  },
];
