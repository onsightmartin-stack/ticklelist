export type ThemeId =
  | "alpine"
  | "midnight"
  | "snowline"
  | "granite"
  | "steampunk"
  | "flower-power"
  | "hobbit"
  | "cyberpunk";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  /** Swatch colours for the picker preview (plain CSS colours, preview only). */
  swatches: [string, string, string, string];
}

export const THEMES: ThemeOption[] = [
  {
    id: "alpine",
    name: "Alpine Dark",
    description: "The original Onsight Martin look — deep slate with orange summit accents.",
    swatches: ["#12171a", "#1c2226", "#e08b3c", "#3d9c96"],
  },
  {
    id: "midnight",
    name: "Midnight Black",
    description: "Near-black surfaces with crisp white type. Maximum contrast.",
    swatches: ["#000000", "#0f0f0f", "#f5f5f5", "#7dd3fc"],
  },
  {
    id: "snowline",
    name: "Snowline White",
    description: "Bright daylight theme — white paper, ink text, glacier blue accents.",
    swatches: ["#ffffff", "#eef2f5", "#12181d", "#1f7a8c"],
  },
  {
    id: "granite",
    name: "Granite Grey",
    description: "Soft neutral greys, easy on the eyes for long scroll sessions.",
    swatches: ["#3a3f44", "#4b5157", "#e6e8ea", "#9fb4c7"],
  },
  {
    id: "steampunk",
    name: "Steampunk",
    description: "Brass, copper and oiled leather with a warm gaslight glow.",
    swatches: ["#241a12", "#33251a", "#c98f2b", "#9c5a2d"],
  },
  {
    id: "flower-power",
    name: "Flower Power",
    description: "Seventies bloom — cream, marigold, poppy pink and avocado green.",
    swatches: ["#fdf3e2", "#f7e3c4", "#e0533d", "#7a9a3c"],
  },
  {
    id: "hobbit",
    name: "Hobbit",
    description: "Shire greens, parchment and Middle-earth lettering — Cinzel headings on EB Garamond.",
    swatches: ["#f2ecdf", "#e3d8c3", "#43602f", "#a5652b"],
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon-on-black Night City vibe — Orbitron headings on Rajdhani, magenta and cyan glow.",
    swatches: ["#0a0118", "#120024", "#ff2bd6", "#00f0ff"],
  },
];

export const DEFAULT_THEME: ThemeId = "alpine";
export const THEME_STORAGE_KEY = "onsight-theme";

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === "string" && THEMES.some((t) => t.id === value);

export const getStoredTheme = (): ThemeId => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

export const applyTheme = (theme: ThemeId) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
};

export const setTheme = (theme: ThemeId) => {
  applyTheme(theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
};

/** Inline script that applies the saved theme before first paint. */
export const themeBootstrapScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var ok=${JSON.stringify(
  THEMES.map((t) => t.id),
)};if(t&&ok.indexOf(t)>-1){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
