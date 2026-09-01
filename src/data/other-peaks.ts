export interface OtherPeak {
  name: string;
  elevation: string;
  location: string;
  date: string;
  note?: string;
}

export const otherPeaks: OtherPeak[] = [
  // Nepal
  { name: "Kala Pattar", elevation: "5,540 m", location: "Nepal", date: "2024-10-29", note: "Viewpoint near Everest Base Camp" },
  { name: "Everest Base Camp", elevation: "5,364 m", location: "Nepal", date: "2024-10-28", note: "South Base Camp trek" },

  // Alps / Europe
  { name: "Aiguille du Midi - South Face (Rebuffat)", elevation: "3,842 m", location: "France", date: "2023-07-14", note: "Classic alpine rock route on the south face" },
  { name: "Mont Blanc du Tacul", elevation: "4,249 m", location: "France", date: "2023-07-15" },
  { name: "Aiguille d'Entrèves", elevation: "3,600 m", location: "France/Italy", date: "2023-07-16" },
  { name: "Allalinhorn", elevation: "4,027 m", location: "Switzerland", date: "2023-08-10", note: "4000er summit in the Pennine Alps" },
  { name: "Breithorn Traverse", elevation: "4,164 m", location: "Italy/Switzerland", date: "2021-08-08", note: "Full traverse of the Breithorn ridge" },
  { name: "Rinnenspitze", elevation: "2,998 m", location: "Austria", date: "2021-07-13" },
  { name: "Mont Lachat", elevation: "2,024 m", location: "France", date: "2022-07-18" },
  { name: "Ráisduottarháldi", elevation: "1,361 m", location: "Norway", date: "2023-06-23" },
  { name: "Kristínartindar", elevation: "1,119 m", location: "Iceland", date: "2022-07-21" },
  { name: "Augstenberg", elevation: "2,365 m", location: "Liechtenstein", date: "2025-06-27" },
  { name: "Schwarzhorn", elevation: "2,574 m", location: "Liechtenstein/Switzerland", date: "2025-06-28" },

  // United Kingdom
  { name: "Carn Mor Dearg", elevation: "1,220 m", location: "United Kingdom (Scotland)", date: "2026-07-17", note: "Traversed alongside Ben Nevis" },
  { name: "Carn Beag Dearg", elevation: "1,010 m", location: "United Kingdom (Scotland)", date: "2026-07-17" },
  { name: "Harrison Stickle", elevation: "736 m", location: "United Kingdom (England)", date: "2026-07-22", note: "Langdale Pikes, same trip as Scafell Pike" },

  // Sweden
  { name: "Kebnekaise - Sydtoppen", elevation: "2,097 m", location: "Sweden", date: "2019-09-24", note: "Former highest point of Sweden" },
  { name: "Skuleberget", elevation: "295 m", location: "Sweden", date: "2019-09-22" },

  // Taiwan
  { name: "Qixingshan", elevation: "1,118 m", location: "Taiwan", date: "2024-09-03" },
  { name: "Qixingshan - Dongfeng", elevation: "1,106 m", location: "Taiwan", date: "2024-09-03" },
  { name: "Datunshan", elevation: "1,094 m", location: "Taiwan", date: "2024-09-05" },
  { name: "Yushan - Xifeng", elevation: "3,518 m", location: "Taiwan", date: "2024-09-18" },

  // Indonesia
  { name: "Gunung Batur", elevation: "1,667 m", location: "Indonesia (Bali)", date: "2025-10-27" },

  // Spain
  { name: "Montaña Roja", elevation: "314 m", location: "Spain (Tenerife)", date: "2026-01-27" },

  // South Korea
  { name: "Halla-san - East Summit", elevation: "1,925 m", location: "South Korea", date: "2024-06-11" },
];
