/**
 * Mainland (home-territory) country high points.
 *
 * Some countries' official high point sits on a far-flung island or overseas
 * territory. Plenty of highpointers only count the mainland / metropolitan
 * summit, so these entries are tracked separately and can be logged as ascents.
 */
export interface MainlandHighPoint {
  /** Country the mainland high point belongs to. */
  country: string;
  /** Mainland / home-territory summit name. */
  name: string;
  elevation: string;
  /** Why it differs from the official country high point. */
  note: string;
}

export const mainlandHighPoints: MainlandHighPoint[] = [
  {
    country: "Denmark",
    name: "Møllehøj",
    elevation: "171 m",
    note: "Official Danish high point is Gunnbjørn Fjeld (3,694 m) in Greenland.",
  },
  {
    country: "Netherlands",
    name: "Vaalserberg",
    elevation: "322 m",
    note: "Official Dutch high point is Mount Scenery (887 m) on Saba, Caribbean Netherlands.",
  },
  {
    country: "Spain",
    name: "Mulhacén",
    elevation: "3,479 m",
    note: "Official Spanish high point is Pico del Teide (3,715 m) on Tenerife, Canary Islands.",
  },
  {
    country: "Portugal",
    name: "Torre",
    elevation: "1,993 m",
    note: "Official Portuguese high point is Montanha do Pico (2,351 m) in the Azores.",
  },
  {
    country: "United Kingdom",
    name: "Ben Nevis",
    elevation: "1,345 m",
    note: "Official UK high point is Mount Paget (2,934 m) on South Georgia.",
  },
  {
    country: "Australia",
    name: "Kosciuszko",
    elevation: "2,228 m",
    note: "Official Australian high point is Mawson Peak (2,745 m) on Heard Island.",
  },
  {
    country: "Equatorial Guinea",
    name: "Monte Chocolate",
    elevation: "1,250 m",
    note: "Official high point is Pico Basile (3,011 m) on Bioko island.",
  },
  {
    country: "Malaysia",
    name: "Gunung Tahan",
    elevation: "2,187 m",
    note: "Official Malaysian high point is Kinabalu (4,095 m) on Borneo.",
  },
  {
    country: "France",
    name: "Mont Blanc",
    elevation: "4,807 m",
    note: "Metropolitan France; overseas high point Piton des Neiges is lower.",
  },
  {
    country: "Norway",
    name: "Galdhøpiggen",
    elevation: "2,469 m",
    note: "Mainland Norway; Svalbard's Newtontoppen (1,713 m) is lower.",
  },
  {
    country: "Ecuador",
    name: "Chimborazo",
    elevation: "6,263 m",
    note: "Mainland Ecuador; the Galápagos high point Wolf Volcano is lower.",
  },
  {
    country: "Yemen",
    name: "Jabal An-Nabi Shu'ayb",
    elevation: "3,666 m",
    note: "Mainland Yemen; Socotra's Jabal Hajhir is lower.",
  },
  {
    country: "South Africa",
    name: "Mafadi",
    elevation: "3,450 m",
    note: "Mainland South Africa; Prince Edward Islands are lower.",
  },
  {
    country: "United States",
    name: "Denali",
    elevation: "6,190 m",
    note: "Continental USA including Alaska; Hawaii's Mauna Kea is lower.",
  },
];

/** Countries where the mainland high point differs from the official one. */
export const mainlandDiffers = new Set([
  "Denmark",
  "Netherlands",
  "Spain",
  "Portugal",
  "United Kingdom",
  "Australia",
  "Equatorial Guinea",
  "Malaysia",
]);

export const findMainlandHighPoint = (country: string) =>
  mainlandHighPoints.find((m) => m.country === country) ?? null;
