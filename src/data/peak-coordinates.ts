import { peakDetails } from "@/data/peak-details";
import { swedenTinyPeakCoordinates } from "@/data/sweden-peaks";
import { findPlace } from "@/data/places";

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Approximate summit coordinates for the curated famous-peak catalog.
 * Country high points get their coordinates from `peak-details.ts`.
 * Values are good enough for map placement, not for navigation.
 */
export const famousPeakCoordinates: Record<string, LatLng> = {
  // 8000ers
  "Everest": { lat: 27.9881, lng: 86.925 },
  "K2": { lat: 35.8808, lng: 76.5133 },
  "Kangchenjunga": { lat: 27.7025, lng: 88.1475 },
  "Lhotse": { lat: 27.9617, lng: 86.9331 },
  "Makalu": { lat: 27.8897, lng: 87.0889 },
  "Cho Oyu": { lat: 28.0942, lng: 86.6608 },
  "Dhaulagiri I": { lat: 28.6983, lng: 83.4875 },
  "Manaslu": { lat: 28.5497, lng: 84.5597 },
  "Nanga Parbat": { lat: 35.2375, lng: 74.5892 },
  "Annapurna I": { lat: 28.5961, lng: 83.8203 },
  "Gasherbrum I": { lat: 35.7242, lng: 76.6964 },
  "Broad Peak": { lat: 35.8108, lng: 76.5686 },
  "Gasherbrum II": { lat: 35.7583, lng: 76.6533 },
  "Shishapangma": { lat: 28.3525, lng: 85.7792 },

  // Seven Summits & classics
  "Aconcagua": { lat: -32.6532, lng: -70.0109 },
  "Denali": { lat: 63.0695, lng: -151.0074 },
  "Kilimanjaro": { lat: -3.0674, lng: 37.3556 },
  "Elbrus": { lat: 43.3499, lng: 42.4453 },
  "Vinson": { lat: -78.5254, lng: -85.6171 },
  "Puncak Jaya (Carstensz Pyramid)": { lat: -4.0784, lng: 137.1583 },
  "Kosciuszko": { lat: -36.4558, lng: 148.2634 },

  // Himalaya / Karakoram
  "Ama Dablam": { lat: 27.8617, lng: 86.8611 },
  "Cho La / Island Peak (Imja Tse)": { lat: 27.9219, lng: 86.9386 },
  "Mera Peak": { lat: 27.7075, lng: 86.8722 },
  "Lobuche East": { lat: 27.9539, lng: 86.8081 },
  "Baruntse": { lat: 27.8722, lng: 86.98 },
  "Pumori": { lat: 28.0147, lng: 86.8256 },
  "Laila Peak": { lat: 35.5333, lng: 76.3167 },
  "Spantik": { lat: 36.0417, lng: 75.0189 },
  "Stok Kangri": { lat: 33.9878, lng: 77.4736 },

  // Alps & Europe
  "Matterhorn": { lat: 45.9763, lng: 7.6586 },
  "Eiger": { lat: 46.5775, lng: 8.0053 },
  "Monte Rosa (Dufourspitze)": { lat: 45.9369, lng: 7.8669 },
  "Jungfrau": { lat: 46.5367, lng: 7.9625 },
  "Mönch": { lat: 46.5586, lng: 7.9964 },
  "Weisshorn": { lat: 46.1017, lng: 7.7161 },
  "Dent Blanche": { lat: 46.0347, lng: 7.6119 },
  "Piz Badile": { lat: 46.2917, lng: 9.6425 },
  "Grandes Jorasses": { lat: 45.8697, lng: 6.9878 },
  "Aiguille du Midi": { lat: 45.8786, lng: 6.8875 },
  "Aiguille Verte": { lat: 45.9344, lng: 6.9575 },
  "Barre des Écrins": { lat: 44.9219, lng: 6.3617 },
  "Ortler": { lat: 46.5089, lng: 10.5447 },
  "Marmolada": { lat: 46.4339, lng: 11.8517 },
  "Tre Cime di Lavaredo (Cima Grande)": { lat: 46.6186, lng: 12.3053 },
  "Watzmann": { lat: 47.5553, lng: 12.9231 },
  "Store Trolltind (Trollveggen)": { lat: 62.5058, lng: 7.7383 },
  "Stetind": { lat: 68.1683, lng: 16.5883 },
  "Ben Nevis": { lat: 56.7969, lng: -5.0036 },
  "Scafell Pike": { lat: 54.4542, lng: -3.2117 },
  "Snowdon (Yr Wyddfa)": { lat: 53.0685, lng: -4.0764 },
  "Mount Etna": { lat: 37.751, lng: 14.9934 },
  "Mount Olympus": { lat: 40.0855, lng: 22.3589 },

  // Americas
  "Chimborazo": { lat: -1.4692, lng: -78.8175 },
  "Cotopaxi": { lat: -0.6803, lng: -78.4378 },
  "Huascarán": { lat: -9.1217, lng: -77.6042 },
  "Alpamayo": { lat: -8.8878, lng: -77.6539 },
  "Ojos del Salado": { lat: -27.1092, lng: -68.5417 },
  "Fitz Roy": { lat: -49.2717, lng: -73.0439 },
  "Cerro Torre": { lat: -49.2925, lng: -73.0997 },
  "Torres del Paine (Central Tower)": { lat: -50.9433, lng: -72.9186 },
  "Pico de Orizaba": { lat: 19.0303, lng: -97.2686 },
  "Mount Rainier": { lat: 46.8523, lng: -121.7603 },
  "Grand Teton": { lat: 43.7412, lng: -110.8025 },
  "El Capitan": { lat: 37.734, lng: -119.6377 },
  "Half Dome": { lat: 37.746, lng: -119.5332 },
  "Mount Robson": { lat: 53.1069, lng: -119.1558 },
  "Villarrica": { lat: -39.42, lng: -71.9394 },

  // Rest of world
  "Mount Kenya (Batian)": { lat: -0.1521, lng: 37.3084 },
  "Mount Fuji": { lat: 35.3606, lng: 138.7274 },
  "Mount Kinabalu": { lat: 6.0754, lng: 116.5583 },
  "Mount Cook (Aoraki)": { lat: -43.5949, lng: 170.1418 },
  "Mount Ararat": { lat: 39.7025, lng: 44.2986 },
  "Mount Sinai": { lat: 28.5392, lng: 33.9750 },
  "Mount Giluwe": { lat: -6.0428, lng: 143.8867 },
  "Mount Sidley": { lat: -77.0333, lng: -126.1 },
  "Damavand": { lat: 35.9553, lng: 52.1097 },

  // Non-UN states
  "Đeravica (Kosovo)": { lat: 42.5386, lng: 20.1361 },
  "Mount Nabi Yunis (Palestine)": { lat: 31.5217, lng: 35.1258 },
  "Guelb er Richat highpoint (Western Sahara)": { lat: 22.3167, lng: -13.0333 },
  "Te Manga (Cook Islands)": { lat: -21.2286, lng: -159.7647 },
  "Niue highpoint": { lat: -19.0839, lng: -169.8503 },

  // US state high points
  "Cheaha Mountain (Alabama)": { lat: 33.4857, lng: -85.8091 },
  "Humphreys Peak (Arizona)": { lat: 35.3464, lng: -111.6779 },
  "Magazine Mountain (Arkansas)": { lat: 35.1672, lng: -93.6444 },
  "Mount Whitney (California)": { lat: 36.5785, lng: -118.2923 },
  "Mount Elbert (Colorado)": { lat: 39.1178, lng: -106.4453 },
  "Mount Frissell (south slope) (Connecticut)": { lat: 42.0497, lng: -73.4822 },
  "Ebright Azimuth (Delaware)": { lat: 39.8364, lng: -75.5194 },
  "Britton Hill (Florida)": { lat: 30.9878, lng: -86.2814 },
  "Brasstown Bald (Georgia)": { lat: 34.8742, lng: -83.8114 },
  "Mauna Kea (Hawaii)": { lat: 19.8207, lng: -155.4681 },
  "Borah Peak (Idaho)": { lat: 44.1374, lng: -113.7811 },
  "Charles Mound (Illinois)": { lat: 42.5044, lng: -90.2394 },
  "Hoosier Hill (Indiana)": { lat: 40.0, lng: -84.85 },
  "Hawkeye Point (Iowa)": { lat: 43.4594, lng: -95.7078 },
  "Mount Sunflower (Kansas)": { lat: 39.0225, lng: -102.0372 },
  "Black Mountain (Kentucky)": { lat: 36.9142, lng: -82.8942 },
  "Driskill Mountain (Louisiana)": { lat: 32.4247, lng: -92.8964 },
  "Katahdin (Maine)": { lat: 45.9044, lng: -68.9216 },
  "Backbone Mountain (Maryland)": { lat: 39.2361, lng: -79.4867 },
  "Mount Greylock (Massachusetts)": { lat: 42.6376, lng: -73.1665 },
  "Mount Arvon (Michigan)": { lat: 46.7561, lng: -88.1558 },
  "Eagle Mountain (Minnesota)": { lat: 47.8975, lng: -90.5597 },
  "Woodall Mountain (Mississippi)": { lat: 34.7881, lng: -88.2417 },
  "Taum Sauk Mountain (Missouri)": { lat: 37.5717, lng: -90.7286 },
  "Granite Peak (Montana)": { lat: 45.1633, lng: -109.8078 },
  "Panorama Point (Nebraska)": { lat: 41.0064, lng: -104.0322 },
  "Boundary Peak (Nevada)": { lat: 37.8461, lng: -118.3512 },
  "Mount Washington (New Hampshire)": { lat: 44.2705, lng: -71.3033 },
  "High Point (New Jersey)": { lat: 41.3206, lng: -74.6614 },
  "Wheeler Peak (New Mexico)": { lat: 36.5569, lng: -105.4169 },
  "Mount Marcy (New York)": { lat: 44.1126, lng: -73.9236 },
  "Mount Mitchell (North Carolina)": { lat: 35.7648, lng: -82.2652 },
  "White Butte (North Dakota)": { lat: 46.3861, lng: -103.3006 },
  "Campbell Hill (Ohio)": { lat: 40.3697, lng: -83.7203 },
  "Black Mesa (Oklahoma)": { lat: 36.9358, lng: -102.9981 },
  "Mount Hood (Oregon)": { lat: 45.3736, lng: -121.6959 },
  "Mount Davis (Pennsylvania)": { lat: 39.7869, lng: -79.1758 },
  "Jerimoth Hill (Rhode Island)": { lat: 41.8517, lng: -71.7772 },
  "Sassafras Mountain (South Carolina)": { lat: 35.0642, lng: -82.7772 },
  "Black Elk Peak (South Dakota)": { lat: 43.8661, lng: -103.5314 },
  "Clingmans Dome (Tennessee)": { lat: 35.5628, lng: -83.4986 },
  "Guadalupe Peak (Texas)": { lat: 31.8917, lng: -104.8603 },
  "Kings Peak (Utah)": { lat: 40.7763, lng: -110.3729 },
  "Mount Mansfield (Vermont)": { lat: 44.5438, lng: -72.8143 },
  "Mount Rogers (Virginia)": { lat: 36.6598, lng: -81.5445 },
  "Spruce Knob (West Virginia)": { lat: 38.6998, lng: -79.5326 },
  "Timms Hill (Wisconsin)": { lat: 45.4514, lng: -90.1953 },
  "Gannett Peak (Wyoming)": { lat: 43.1842, lng: -109.6542 },

  // Poland voivodeships
  "Śnieżka (Lower Silesia)": { lat: 50.7361, lng: 15.7397 },
  "Czarna Góra (Góry Obkaskie) (Kuyavian-Pomeranian)": { lat: 53.05, lng: 18.1833 },
  "Wielki Dział (Lublin)": { lat: 50.6167, lng: 22.9833 },
  "Gołębia (Góra Żarska) (Lubusz)": { lat: 51.6167, lng: 15.0333 },
  "Fajna Ryba (Łódź)": { lat: 50.9833, lng: 19.8833 },
  "Rysy (Lesser Poland)": { lat: 49.1794, lng: 20.0881 },
  "Altana (Masovia)": { lat: 51.1167, lng: 20.6167 },
  "Biskupia Kopa (Opole)": { lat: 50.2447, lng: 17.4319 },
  "Tarnica (Subcarpathia)": { lat: 49.0761, lng: 22.7261 },
  "Rowelska Góra (Podlaskie)": { lat: 54.2333, lng: 22.7667 },
  "Wieżyca (Pomerania)": { lat: 54.2306, lng: 18.1567 },
  "Góra Pięciu Kopców (Silesia)": { lat: 49.5967, lng: 18.9861 },
  "Łysica (Holy Cross)": { lat: 50.8892, lng: 20.9036 },
  "Dylewska Góra (Warmia-Masuria)": { lat: 53.5486, lng: 20.0269 },
  "Kobyla Góra (Greater Poland)": { lat: 51.3536, lng: 17.7658 },
  "Góra Krajoznawców (West Pomerania)": { lat: 53.7167, lng: 15.0333 },

  // Canada provinces & territories
  "Mount Logan (Yukon)": { lat: 60.5672, lng: -140.4053 },
  "Fairweather Mountain (British Columbia)": { lat: 58.9064, lng: -137.5267 },
  "Mount Columbia (Alberta)": { lat: 52.1489, lng: -117.4544 },
  "Mount Nirvana (Northwest Territories)": { lat: 62.1833, lng: -127.6167 },
  "Barbeau Peak (Nunavut)": { lat: 81.9167, lng: -75.0167 },
  "Mount Caubvick (Newfoundland and Labrador)": { lat: 58.8833, lng: -63.7167 },
  "Mont d'Iberville (Quebec)": { lat: 58.8833, lng: -63.7167 },
  "Cypress Hills (Saskatchewan)": { lat: 49.6167, lng: -109.9167 },
  "Baldy Mountain (Manitoba)": { lat: 51.4667, lng: -100.7667 },
  "Mount Carleton (New Brunswick)": { lat: 47.3956, lng: -66.8817 },
  "Ishpatina Ridge (Ontario)": { lat: 47.3333, lng: -80.7333 },
  "White Hill (Nova Scotia)": { lat: 46.7, lng: -60.6 },
  "Glen Valley (Prince Edward Island)": { lat: 46.35, lng: -63.4167 },
  // Indonesia — island high points
  "Puncak Mandala": { lat: -4.7167, lng: 140.2833 },
  "Puncak Trikora": { lat: -4.2333, lng: 138.6833 },
  "Ngga Pulu": { lat: -4.0603, lng: 137.1631 },
  "Sumantri": { lat: -4.0561, lng: 137.1494 },
  "Kerinci": { lat: -1.6970, lng: 101.2640 },
  "Rinjani": { lat: -8.4114, lng: 116.4570 },
  "Semeru": { lat: -8.1077, lng: 112.9224 },
  "Rantemario (Latimojong)": { lat: -3.3833, lng: 120.0167 },
  "Bukit Raya": { lat: -0.6333, lng: 112.6833 },
  "Binaiya": { lat: -3.1750, lng: 129.4667 },

  // Indonesia — Bali & Nusa Tenggara
  "Gunung Agung": { lat: -8.3428, lng: 115.5075 },
  "Gunung Batur": { lat: -8.2422, lng: 115.3753 },
  "Gunung Abang": { lat: -8.2694, lng: 115.4139 },
  "Gunung Batukaru": { lat: -8.3236, lng: 115.0972 },
  "Gunung Catur (Pucak Mangu)": { lat: -8.2500, lng: 115.2333 },
  "Gunung Lesung": { lat: -8.2853, lng: 115.1069 },
  "Gunung Sanghyang": { lat: -8.3000, lng: 115.1167 },
  "Gunung Adeng": { lat: -8.2939, lng: 115.1236 },
  "Gunung Pohen": { lat: -8.2828, lng: 115.1583 },
  "Gunung Tapak": { lat: -8.2764, lng: 115.1611 },
  "Gunung Seraya": { lat: -8.4278, lng: 115.6472 },
  "Gunung Lempuyang": { lat: -8.3922, lng: 115.6317 },
  "Barujari (Anak Rinjani)": { lat: -8.4200, lng: 116.4650 },
  "Gunung Tambora": { lat: -8.2500, lng: 118.0000 },
  "Gunung Inerie": { lat: -8.8750, lng: 120.9583 },
  "Kelimutu": { lat: -8.7700, lng: 121.8200 },
  "Gunung Ebulobo": { lat: -8.8083, lng: 121.1833 },
  "Gunung Egon": { lat: -8.6767, lng: 122.4550 },
  "Ile Ape (Lewotolok)": { lat: -8.2742, lng: 123.5050 },
  "Gunung Sangeang Api": { lat: -8.2000, lng: 119.0667 },
  "Mount Mutis (Timor)": { lat: -9.5833, lng: 124.2333 },

  // Indonesia — Java
  "Mahameru (Semeru summit)": { lat: -8.1077, lng: 112.9224 },
  "Jonggring Saloko (Semeru crater)": { lat: -8.1089, lng: 112.9231 },
  "Gunung Bromo": { lat: -7.9425, lng: 112.9530 },
  "Gunung Batok": { lat: -7.9333, lng: 112.9450 },
  "Gunung Kursi": { lat: -7.9450, lng: 112.9700 },
  "Gunung Widodaren": { lat: -7.9333, lng: 112.9600 },
  "Gunung Penanjakan": { lat: -7.9167, lng: 112.9500 },
  "Gunung Merapi": { lat: -7.5407, lng: 110.4457 },
  "Gunung Merbabu": { lat: -7.4550, lng: 110.4400 },
  "Gunung Slamet": { lat: -7.2422, lng: 109.2081 },
  "Gunung Sumbing": { lat: -7.3844, lng: 110.0703 },
  "Gunung Sindoro": { lat: -7.3000, lng: 109.9925 },
  "Gunung Lawu": { lat: -7.6256, lng: 111.1917 },
  "Gunung Arjuno": { lat: -7.7256, lng: 112.5892 },
  "Gunung Welirang": { lat: -7.7333, lng: 112.5667 },
  "Gunung Raung": { lat: -8.1250, lng: 114.0420 },
  "Gunung Argopuro": { lat: -7.9700, lng: 113.5700 },
  "Gunung Ciremai": { lat: -6.8919, lng: 108.4000 },
  "Gunung Pangrango": { lat: -6.7800, lng: 106.9750 },
  "Gunung Gede": { lat: -6.7867, lng: 106.9800 },
  "Gunung Salak": { lat: -6.7167, lng: 106.7333 },
  "Gunung Papandayan": { lat: -7.3200, lng: 107.7300 },
  "Gunung Kelud": { lat: -7.9320, lng: 112.3080 },
  "Kawah Ijen": { lat: -8.0583, lng: 114.2417 },
  "Gunung Prau": { lat: -7.1889, lng: 109.9250 },
  "Gunung Andong": { lat: -7.4028, lng: 110.3417 },
  "Gunung Guntur": { lat: -7.1428, lng: 107.8400 },
  "Gunung Cikuray": { lat: -7.3222, lng: 107.8583 },
  "Gunung Galunggung": { lat: -7.2500, lng: 108.0580 },
  "Anak Krakatau": { lat: -6.1020, lng: 105.4230 },
  "Rakata (Krakatoa)": { lat: -6.1500, lng: 105.4333 },

  // Indonesia — Sumatra, Sulawesi, Maluku, Borneo
  "Gunung Marapi (Sumatra)": { lat: -0.3800, lng: 100.4730 },
  "Gunung Singgalang": { lat: -0.3833, lng: 100.3333 },
  "Gunung Tandikat": { lat: -0.4333, lng: 100.3167 },
  "Gunung Talamau": { lat: 0.0800, lng: 99.9800 },
  "Gunung Dempo": { lat: -4.0300, lng: 103.1300 },
  "Gunung Sinabung": { lat: 3.1700, lng: 98.3920 },
  "Gunung Sibayak": { lat: 3.2300, lng: 98.5070 },
  "Gunung Leuser": { lat: 3.7450, lng: 97.1550 },
  "Gunung Bawakaraeng": { lat: -5.3167, lng: 119.9333 },
  "Gunung Lompobattang": { lat: -5.3667, lng: 119.9500 },
  "Gunung Klabat": { lat: 1.4700, lng: 125.0300 },
  "Gunung Lokon": { lat: 1.3580, lng: 124.7920 },
  "Gunung Soputan": { lat: 1.1120, lng: 124.7370 },
  "Gunung Gamalama (Ternate)": { lat: 0.8000, lng: 127.3300 },
  "Gunung Gamkonora": { lat: 1.3800, lng: 127.5300 },
  "Gunung Api Banda": { lat: -4.5250, lng: 129.8710 },
  "Bukit Baka": { lat: -0.6167, lng: 112.3167 },

  // Sweden
  ...swedenTinyPeakCoordinates,
};


/** Resolve coordinates for a catalog key (`hp:Country`, `fp:Peak name`, or `pl:Place`). */
export const coordsForKey = (key: string): LatLng | null => {
  if (key.startsWith("hp:")) {
    const detail = peakDetails[key.slice(3)];
    return detail ? detail.coordinates : null;
  }
  if (key.startsWith("pl:")) {
    const place = findPlace(key);
    if (place && typeof place.lat === "number" && typeof place.lng === "number") {
      return { lat: place.lat, lng: place.lng };
    }
    return null;
  }
  return famousPeakCoordinates[key.slice(3)] ?? null;
};
