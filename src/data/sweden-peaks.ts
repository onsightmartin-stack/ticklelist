import type { FamousPeak } from "./famous-peaks";
import type { LatLng } from "./peak-coordinates";

/**
 * Swedish summits — the small ones first.
 *
 * Sweden's classic "tiny mountains" are table mountains, ridges (åsar) and
 * coastal cliffs that rarely break 400 m but still feel like real summits.
 * Elevations follow Lantmäteriet / commonly cited figures.
 */

const tiny = (name: string, elevation: number): FamousPeak => ({
  name,
  elevation: `${elevation} m`,
  country: "Sweden",
  group: "Sweden — tiny mountains",
});

const fjall = (name: string, elevation: number): FamousPeak => ({
  name,
  elevation: `${elevation.toLocaleString("en-US")} m`,
  country: "Sweden",
  group: "Sweden — fjäll classics",
});

export const swedenTinyPeaks: FamousPeak[] = [
  // ── Höga Kusten / Ångermanland ──
  tiny("Skuleberget", 294),
  tiny("Slåttdalsberget", 280),
  tiny("Mjältön", 236),
  tiny("Vårdkasberget (Härnösand)", 175),
  tiny("Varvsberget (Örnsköldsvik)", 174),
  tiny("Södra berget (Sundsvall)", 132),
  tiny("Norra berget (Sundsvall)", 108),

  // ── Västgötabergen (the table mountains) ──
  tiny("Kinnekulle", 306),
  tiny("Billingen", 304),
  tiny("Mösseberg", 325),
  tiny("Ålleberg", 330),
  tiny("Halleberg", 158),
  tiny("Hunneberg", 154),
  tiny("Galtåsen", 362),
  tiny("Kroppefjäll", 220),

  // ── Östergötland / Småland ──
  tiny("Omberg", 263),
  tiny("Tomtabacken", 377),
  tiny("Taberg", 343),

  // ── Skåne, Blekinge & Halland ──
  tiny("Söderåsen (Kopparhatten)", 212),
  tiny("Kullaberg (Håkull)", 187),
  tiny("Hallandsåsen (Högalteknall)", 226),
  tiny("Romeleklint", 175),
  tiny("Linderödsåsen", 196),
  tiny("Ivö Klack", 145),
  tiny("Stenshuvud", 97),
  tiny("Rävabacken", 189),

  // ── Islands & city hills ──
  tiny("Lojsta hed (Gotland)", 83),
  tiny("Högsrum (Öland)", 57),
  tiny("Ramberget (Göteborg)", 87),
  tiny("Hammarbybacken (Stockholm)", 93),
  tiny("Björnepiken (Bohuslän)", 222),

  // ── Fjäll classics, for scale ──
  fjall("Storvätteshågna", 1204),
  fjall("Helagsfjället", 1796),
  fjall("Storsylen", 1728),
  fjall("Åreskutan", 1420),
  fjall("Sonfjället", 1278),
  fjall("Nipfjället", 1191),
  fjall("Städjan", 1131),
  fjall("Fulufjället", 1044),
  fjall("Nuolja", 1169),
  fjall("Granberget (Värmland)", 701),
];

export const swedenTinyPeakCoordinates: Record<string, LatLng> = {
  "Skuleberget": { lat: 63.1000, lng: 18.5333 },
  "Slåttdalsberget": { lat: 63.1750, lng: 18.5000 },
  "Mjältön": { lat: 63.0333, lng: 18.6500 },
  "Vårdkasberget (Härnösand)": { lat: 62.6300, lng: 17.9200 },
  "Varvsberget (Örnsköldsvik)": { lat: 63.2830, lng: 18.7080 },
  "Södra berget (Sundsvall)": { lat: 62.3760, lng: 17.3000 },
  "Norra berget (Sundsvall)": { lat: 62.4020, lng: 17.3120 },

  "Kinnekulle": { lat: 58.5833, lng: 13.4000 },
  "Billingen": { lat: 58.4200, lng: 13.7500 },
  "Mösseberg": { lat: 58.1800, lng: 13.5300 },
  "Ålleberg": { lat: 58.1250, lng: 13.6500 },
  "Halleberg": { lat: 58.3800, lng: 12.4500 },
  "Hunneberg": { lat: 58.3400, lng: 12.4600 },
  "Galtåsen": { lat: 57.5700, lng: 13.3300 },
  "Kroppefjäll": { lat: 58.5800, lng: 12.3800 },

  "Omberg": { lat: 58.3300, lng: 14.6400 },
  "Tomtabacken": { lat: 57.5000, lng: 14.3000 },
  "Taberg": { lat: 57.6800, lng: 14.0700 },

  "Söderåsen (Kopparhatten)": { lat: 56.0300, lng: 13.2200 },
  "Kullaberg (Håkull)": { lat: 56.3000, lng: 12.4700 },
  "Hallandsåsen (Högalteknall)": { lat: 56.3700, lng: 13.0400 },
  "Romeleklint": { lat: 55.5600, lng: 13.4300 },
  "Linderödsåsen": { lat: 55.9200, lng: 13.8300 },
  "Ivö Klack": { lat: 56.1300, lng: 14.4000 },
  "Stenshuvud": { lat: 55.6520, lng: 14.2700 },
  "Rävabacken": { lat: 56.3400, lng: 14.6700 },

  "Lojsta hed (Gotland)": { lat: 57.3500, lng: 18.4200 },
  "Högsrum (Öland)": { lat: 56.6600, lng: 16.5300 },
  "Ramberget (Göteborg)": { lat: 57.7150, lng: 11.9420 },
  "Hammarbybacken (Stockholm)": { lat: 59.2980, lng: 18.0930 },
  "Björnepiken (Bohuslän)": { lat: 58.7800, lng: 11.7500 },

  "Storvätteshågna": { lat: 62.1300, lng: 12.4200 },
  "Helagsfjället": { lat: 62.9200, lng: 12.5300 },
  "Storsylen": { lat: 63.0300, lng: 12.2200 },
  "Åreskutan": { lat: 63.4300, lng: 13.0800 },
  "Sonfjället": { lat: 62.3000, lng: 13.3000 },
  "Nipfjället": { lat: 61.9500, lng: 12.6800 },
  "Städjan": { lat: 61.9200, lng: 12.8500 },
  "Fulufjället": { lat: 61.5700, lng: 12.7200 },
  "Nuolja": { lat: 68.3600, lng: 18.7000 },
  "Granberget (Värmland)": { lat: 60.5800, lng: 12.6800 },
};
