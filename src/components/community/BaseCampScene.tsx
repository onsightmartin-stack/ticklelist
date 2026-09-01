import { memo, useEffect, useState, type ReactElement } from "react";

import type { CampZoneId } from "@/lib/camp-zones";
import { campPeaks, formatCampAlt } from "@/lib/camp-peaks";

/** Deterministic pseudo-random 0..1 so scenery never reshuffles between renders. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

/** Current hour in GMT+2 (the project's home timezone). */
const gmt2Hour = () => {
  const now = new Date();
  return (now.getUTCHours() + 2) % 24;
};

/** Minecraft-style day cycle: sunny 05:00–17:59, night 18:00–04:59 (GMT+2). */
export const isNightHour = (hour: number) => hour >= 18 || hour < 5;

interface Palette {
  sky: string[];
  sunCore: string;
  sunGlow: string;
  sunY: number;
  stars: number;
  cloud: string;
  cloudOpacity: number;
  farRidge: string;
  midRidge: string;
  snow: string;
  backTree: { tint: string; dark: string };
  frontTree: { tint: string; dark: string };
  meadowBack: string;
  meadowFront: string;
  grass: string;
  lakeTop: string;
  lakeBottom: string;
  fireOpacity: number;
  overlay: string | null;
  overlayOpacity: number;
}

const DAY: Palette = {
  sky: ["#38bdf8", "#7dd3fc", "#bae6fd", "#fef3c7"],
  sunCore: "#fff8d6",
  sunGlow: "#ffe9a8",
  sunY: 210,
  stars: 0,
  cloud: "#ffffff",
  cloudOpacity: 0.75,
  farRidge: "#6d5f9e",
  midRidge: "#4b4a8f",
  snow: "#ffffff",
  backTree: { tint: "#2f9d63", dark: "#1c6b43" },
  frontTree: { tint: "#1e8049", dark: "#125230" },
  meadowBack: "#4cb26f",
  meadowFront: "#63c97f",
  grass: "#166534",
  lakeTop: "#7dd3fc",
  lakeBottom: "#0e7490",
  fireOpacity: 0.5,
  overlay: null,
  overlayOpacity: 0,
};

const NIGHT: Palette = {
  sky: ["#05061a", "#0d1338", "#1b1b4b", "#2f2160"],
  sunCore: "#e8eefc",
  sunGlow: "#c7d2fe",
  sunY: 250,
  stars: 90,
  cloud: "#4c4a7a",
  cloudOpacity: 0.35,
  farRidge: "#241543",
  midRidge: "#1a1440",
  snow: "#c9c7ef",
  backTree: { tint: "#123f2e", dark: "#0b2b20" },
  frontTree: { tint: "#0d3a22", dark: "#082616" },
  meadowBack: "#134e33",
  meadowFront: "#186142",
  grass: "#0b3320",
  lakeTop: "#1e3a8a",
  lakeBottom: "#082f49",
  fireOpacity: 1,
  overlay: "#050818",
  overlayOpacity: 0.35,
};

const GLACIER_DAY: Palette = {
  ...DAY,
  sky: ["#0ea5e9", "#7dd3fc", "#dbeafe", "#f8fafc"],
  sunCore: "#ffffff",
  sunGlow: "#e0f2fe",
  farRidge: "#8ea9d6",
  midRidge: "#6c8bc4",
  snow: "#ffffff",
  backTree: { tint: "#bae6fd", dark: "#7dd3fc" },
  frontTree: { tint: "#e0f2fe", dark: "#93c5fd" },
  meadowBack: "#dbeafe",
  meadowFront: "#f1f8ff",
  grass: "#bfdbfe",
  lakeTop: "#bae6fd",
  lakeBottom: "#38bdf8",
  cloudOpacity: 0.85,
};

const GLACIER_NIGHT: Palette = {
  ...NIGHT,
  sky: ["#020617", "#0b1a3a", "#12305e", "#1e3a8a"],
  farRidge: "#22375f",
  midRidge: "#16294a",
  snow: "#cbd5e1",
  backTree: { tint: "#31537f", dark: "#1f3a5c" },
  frontTree: { tint: "#3f6796", dark: "#26456c" },
  meadowBack: "#1b3355",
  meadowFront: "#24406a",
  grass: "#3b5c86",
  lakeTop: "#1e3a8a",
  lakeBottom: "#0c1e42",
};

/** 8,000 m: thin indigo sky, blinding snow, no colour left in the world. */
const DEATH_DAY: Palette = {
  ...DAY,
  sky: ["#1e1b4b", "#3730a3", "#93c5fd", "#e0f2fe"],
  sunCore: "#ffffff",
  sunGlow: "#c7d2fe",
  farRidge: "#6b7fae",
  midRidge: "#4c5f8a",
  snow: "#ffffff",
  backTree: { tint: "#e2e8f0", dark: "#a5b4fc" },
  frontTree: { tint: "#f8fafc", dark: "#c7d2fe" },
  meadowBack: "#e2e8f0",
  meadowFront: "#f8fafc",
  grass: "#cbd5e1",
  lakeTop: "#e0e7ff",
  lakeBottom: "#a5b4fc",
  cloudOpacity: 0.5,
};

const DEATH_NIGHT: Palette = {
  ...NIGHT,
  sky: ["#020617", "#0b1030", "#1e1b4b", "#312e81"],
  farRidge: "#2a3358",
  midRidge: "#1b2140",
  snow: "#e2e8f0",
  backTree: { tint: "#475569", dark: "#334155" },
  frontTree: { tint: "#64748b", dark: "#475569" },
  meadowBack: "#1e293b",
  meadowFront: "#334155",
  grass: "#475569",
  lakeTop: "#312e81",
  lakeBottom: "#0f172a",
};

const DESERT_DAY: Palette = {
  ...DAY,
  sky: ["#f59e0b", "#fbbf24", "#fde68a", "#fff7ed"],
  sunCore: "#fffbeb",
  sunGlow: "#fdba74",
  farRidge: "#b45309",
  midRidge: "#92400e",
  snow: "#fed7aa",
  backTree: { tint: "#4d7c0f", dark: "#3f6212" },
  frontTree: { tint: "#65a30d", dark: "#3f6212" },
  meadowBack: "#e7b96a",
  meadowFront: "#f2cf8b",
  grass: "#a16207",
  lakeTop: "#5eead4",
  lakeBottom: "#0f766e",
  cloudOpacity: 0.35,
};

const DESERT_NIGHT: Palette = {
  ...NIGHT,
  sky: ["#0b0616", "#241033", "#3b1449", "#5b2130"],
  farRidge: "#4a2110",
  midRidge: "#361708",
  snow: "#a1663a",
  backTree: { tint: "#1f3a12", dark: "#152808" },
  frontTree: { tint: "#274d17", dark: "#16300c" },
  meadowBack: "#4a3417",
  meadowFront: "#5c4220",
  grass: "#4a3417",
  lakeTop: "#134e4a",
  lakeBottom: "#062723",
};

const SHROOM_DAY: Palette = {
  ...DAY,
  sky: ["#5b21b6", "#7c3aed", "#c084fc", "#fbcfe8"],
  sunCore: "#fdf4ff",
  sunGlow: "#f0abfc",
  farRidge: "#4c1d95",
  midRidge: "#3b0764",
  snow: "#f5d0fe",
  backTree: { tint: "#a855f7", dark: "#7e22ce" },
  frontTree: { tint: "#e879f9", dark: "#c026d3" },
  meadowBack: "#3f2d63",
  meadowFront: "#4c3579",
  grass: "#22d3ee",
  lakeTop: "#67e8f9",
  lakeBottom: "#7c3aed",
  cloudOpacity: 0.4,
  cloud: "#e9d5ff",
};

const SHROOM_NIGHT: Palette = {
  ...NIGHT,
  sky: ["#0b021a", "#1e0a3c", "#3b0764", "#4a1d6e"],
  sunCore: "#f5d0fe",
  sunGlow: "#d8b4fe",
  farRidge: "#2a0d4d",
  midRidge: "#1b0733",
  snow: "#c4b5fd",
  backTree: { tint: "#7e22ce", dark: "#581c87" },
  frontTree: { tint: "#c026d3", dark: "#86198f" },
  meadowBack: "#1d1236",
  meadowFront: "#271846",
  grass: "#22d3ee",
  lakeTop: "#5b21b6",
  lakeBottom: "#1e1b4b",
  overlay: "#12002b",
  overlayOpacity: 0.3,
};

/** Cold desert: high, grey, wind-scoured rock — Dolomite towers over gravel. */
const COLD_DAY: Palette = {
  ...DAY,
  sky: ["#5c6674", "#7c8794", "#a3adb8", "#cbd2d8"],
  sunCore: "#e2e8f0",
  sunGlow: "#94a3b8",
  farRidge: "#5b6470",
  midRidge: "#454c57",
  snow: "#e2e8f0",
  backTree: { tint: "#6b7280", dark: "#4b5563" },
  frontTree: { tint: "#8a93a0", dark: "#5a626e" },
  meadowBack: "#4a5058",
  meadowFront: "#5a606a",
  grass: "#6b7280",
  lakeTop: "#64748b",
  lakeBottom: "#334155",
  cloud: "#cbd5e1",
  cloudOpacity: 0.5,
};

const COLD_NIGHT: Palette = {
  ...NIGHT,
  sky: ["#04060b", "#0e131c", "#1b222d", "#2c343f"],
  sunCore: "#cbd5e1",
  sunGlow: "#94a3b8",
  farRidge: "#242a34",
  midRidge: "#181d25",
  snow: "#94a3b8",
  backTree: { tint: "#2f3540", dark: "#20252d" },
  frontTree: { tint: "#3b424e", dark: "#272c35" },
  meadowBack: "#1c2129",
  meadowFront: "#242a33",
  grass: "#3b424e",
  lakeTop: "#1e293b",
  lakeBottom: "#0b1220",
  overlay: "#04060b",
  overlayOpacity: 0.4,
};

/** Volcano: ash plain, glowing lava and a smoking cone. */
const VOLCANO_DAY: Palette = {
  ...DAY,
  sky: ["#7f1d1d", "#b45309", "#d97706", "#fbbf24"],
  sunCore: "#fde68a",
  sunGlow: "#fb923c",
  farRidge: "#3f2a22",
  midRidge: "#2b1c17",
  snow: "#f87171",
  backTree: { tint: "#4b3b33", dark: "#2f241f" },
  frontTree: { tint: "#57443b", dark: "#332722" },
  meadowBack: "#3a2f2a",
  meadowFront: "#463830",
  grass: "#f97316",
  lakeTop: "#fb923c",
  lakeBottom: "#b91c1c",
  cloud: "#9ca3af",
  cloudOpacity: 0.5,
};

const VOLCANO_NIGHT: Palette = {
  ...NIGHT,
  sky: ["#0a0304", "#26090a", "#4c1008", "#7c2d12"],
  sunCore: "#fed7aa",
  sunGlow: "#ea580c",
  farRidge: "#1d1310",
  midRidge: "#140d0b",
  snow: "#ef4444",
  backTree: { tint: "#2a201c", dark: "#181211" },
  frontTree: { tint: "#332722", dark: "#1d1614" },
  meadowBack: "#1a1412",
  meadowFront: "#231a16",
  grass: "#ea580c",
  lakeTop: "#ea580c",
  lakeBottom: "#7f1d1d",
  overlay: "#1a0503",
  overlayOpacity: 0.3,
};

/** Caribbean islet: turquoise sea, white sand and leaning palms. */
const ISLAND_DAY: Palette = {
  ...DAY,
  sky: ["#0284c7", "#38bdf8", "#a5f3fc", "#fef9c3"],
  sunCore: "#fffbeb",
  sunGlow: "#fde68a",
  farRidge: "#2f7d6a",
  midRidge: "#1f6b62",
  snow: "#d1fae5",
  backTree: { tint: "#15803d", dark: "#166534" },
  frontTree: { tint: "#22c55e", dark: "#15803d" },
  meadowBack: "#7fd8c6",
  meadowFront: "#fdf1c8",
  grass: "#16a34a",
  lakeTop: "#5eead4",
  lakeBottom: "#0891b2",
  cloudOpacity: 0.85,
};

const ISLAND_NIGHT: Palette = {
  ...NIGHT,
  sky: ["#020617", "#062036", "#0b3552", "#155e75"],
  farRidge: "#12433c",
  midRidge: "#0c322f",
  snow: "#99f6e4",
  backTree: { tint: "#0f3f2a", dark: "#0a2b1c" },
  frontTree: { tint: "#155e39", dark: "#0d3a24" },
  meadowBack: "#0d3b3a",
  meadowFront: "#3f4a52",
  grass: "#15803d",
  lakeTop: "#0e7490",
  lakeBottom: "#082f49",
};

const PALETTES: Record<CampZoneId, { day: Palette; night: Palette }> = {
  valley: { day: DAY, night: NIGHT },
  glacier: { day: GLACIER_DAY, night: GLACIER_NIGHT },
  deathZone: { day: DEATH_DAY, night: DEATH_NIGHT },
  desert: { day: DESERT_DAY, night: DESERT_NIGHT },
  mushroom: { day: SHROOM_DAY, night: SHROOM_NIGHT },
  coldDesert: { day: COLD_DAY, night: COLD_NIGHT },
  volcano: { day: VOLCANO_DAY, night: VOLCANO_NIGHT },
  island: { day: ISLAND_DAY, night: ISLAND_NIGHT },
};

interface FloraProps {
  x: number;
  y: number;
  scale: number;
  tint: string;
  dark: string;
}

/** Chunky low-poly conifer, matching the N64 look of the avatars. */
const Tree = ({ x, y, scale, tint, dark }: FloraProps) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="2" rx="16" ry="4" fill="#0b1f16" opacity="0.35" />
    <rect x="-4" y="-18" width="8" height="20" fill="#5b3a21" />
    <polygon points="0,-78 22,-34 -22,-34" fill={tint} />
    <polygon points="0,-78 22,-34 0,-34" fill={dark} />
    <polygon points="0,-58 28,-8 -28,-8" fill={tint} />
    <polygon points="0,-58 28,-8 0,-8" fill={dark} />
  </g>
);

/** Ice tower on the glacier — a low-poly serac. */
const Serac = ({ x, y, scale, tint, dark }: FloraProps) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="2" rx="18" ry="4" fill="#1e3a8a" opacity="0.25" />
    <polygon points="-18,0 -10,-56 4,-72 14,-30 20,0" fill={tint} />
    <polygon points="4,-72 14,-30 20,0 6,0" fill={dark} />
    <polygon points="-10,-56 -2,-40 -14,-30" fill="#ffffff" opacity="0.65" />
  </g>
);

/** Saguaro cactus for the desert belt. */
const Cactus = ({ x, y, scale, tint, dark }: FloraProps) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="2" rx="14" ry="4" fill="#3f2a12" opacity="0.3" />
    <rect x="-7" y="-70" width="14" height="70" rx="7" fill={tint} />
    <rect x="0" y="-70" width="7" height="70" fill={dark} opacity="0.45" />
    <rect x="-24" y="-52" width="10" height="26" rx="5" fill={tint} />
    <rect x="-24" y="-52" width="10" height="10" rx="5" fill={tint} />
    <rect x="-24" y="-56" width="10" height="20" rx="5" fill={tint} />
    <rect x="14" y="-60" width="10" height="30" rx="5" fill={dark} />
  </g>
);

/** Giant fantasy toadstool with glowing gills and speckled cap. */
const Toadstool = ({ x, y, scale, tint, dark }: FloraProps) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="2" rx="22" ry="5" fill="#1b0733" opacity="0.4" />
    <ellipse cx="0" cy="-26" rx="34" ry="18" fill="#67e8f9" opacity="0.18" />
    <path d="M-9 0 q-4 -34 2 -46 h14 q6 12 2 46 z" fill="#f5f3ff" />
    <path d="M2 0 q4 -34 -0 -46 h5 q6 12 2 46 z" fill="#d8b4fe" opacity="0.7" />
    <path d="M-34 -44 a34 26 0 0 1 68 0 q-34 14 -68 0 z" fill={tint} />
    <path d="M0 -70 a34 26 0 0 1 34 26 q-17 7 -34 7 z" fill={dark} />
    <circle cx="-16" cy="-52" r="5" fill="#fdf4ff" opacity="0.85" />
    <circle cx="8" cy="-58" r="4" fill="#fdf4ff" opacity="0.8" />
    <circle cx="20" cy="-46" r="3" fill="#fdf4ff" opacity="0.7" />
    <path d="M-30 -42 q30 12 60 0" stroke="#67e8f9" strokeWidth="2.5" fill="none" opacity="0.8" />
  </g>
);

/**
 * Goofy sentient tree for the mushroom forest: wobbly trunk, googly eyes,
 * a big grin and noodly arms. `variant` swaps the face so no two are twins.
 */
const SillyTree = ({
  x,
  y,
  scale,
  tint,
  dark,
  variant = 0,
}: FloraProps & { variant?: number }) => {
  const v = variant % 3;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="2" rx="26" ry="6" fill="#1b0733" opacity="0.4" />
      {/* Wobbly trunk */}
      <path d="M-11 0 q-9 -34 4 -52 q-11 -22 9 -34 q-6 22 6 34 q10 20 3 52 z" fill="#7c4a21" />
      <path d="M2 0 q7 -30 3 -52 q9 -18 4 -30 q10 18 2 32 q-6 22 -1 50 z" fill="#5b3416" />
      {/* Noodly arms */}
      <path
        d={v === 1 ? "M-13 -46 q-30 -6 -34 -30" : "M-13 -46 q-28 6 -30 -22"}
        stroke="#7c4a21"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={v === 2 ? "M12 -50 q30 -12 32 -36" : "M12 -50 q26 8 34 -14"}
        stroke="#7c4a21"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Lumpy glowing canopy */}
      <ellipse cx="0" cy="-104" rx="46" ry="34" fill={tint} />
      <ellipse cx="-26" cy="-92" rx="26" ry="20" fill={dark} opacity="0.85" />
      <ellipse cx="26" cy="-96" rx="24" ry="19" fill={dark} opacity="0.7" />
      <ellipse cx="4" cy="-124" rx="22" ry="16" fill={tint} opacity="0.9" />
      <ellipse cx="0" cy="-104" rx="48" ry="36" fill="#67e8f9" opacity="0.12" />
      {/* Googly eyes */}
      <circle cx="-15" cy="-58" r="11" fill="#fdf4ff" />
      <circle cx="14" cy="-60" r={v === 2 ? 8 : 11} fill="#fdf4ff" />
      <circle cx={v === 0 ? -12 : -18} cy={-56} r="5" fill="#1e1b4b" />
      <circle cx={v === 1 ? 18 : 12} cy={-58} r={v === 2 ? 4 : 5} fill="#1e1b4b" />
      {/* Grin + tongue */}
      {v === 1 ? (
        <ellipse cx="0" cy="-38" rx="9" ry="11" fill="#3b0764" />
      ) : (
        <path d="M-14 -42 q14 16 28 -2" stroke="#3b0764" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      {v === 2 && <path d="M-2 -36 q7 10 10 -2 z" fill="#f472b6" />}
      {/* Eyebrow tufts */}
      <path d="M-25 -72 q9 -8 18 -2" stroke={dark} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M6 -74 q9 -6 18 2" stroke={dark} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </g>
  );
};

/** Dolomite-style limestone tower for the cold desert. */
const RockSpire = ({ x, y, scale, tint, dark }: FloraProps) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="2" rx="20" ry="4" fill="#0f172a" opacity="0.35" />
    <polygon points="-20,0 -12,-46 -2,-92 8,-50 20,0" fill={tint} />
    <polygon points="-2,-92 8,-50 20,0 4,0" fill={dark} />
    <polygon points="-12,-46 -4,-60 2,-42" fill="#e2e8f0" opacity="0.35" />
    <polygon points="-30,0 -22,-26 -14,0" fill={dark} opacity="0.8" />
  </g>
);

/** Charred, wind-bent snag standing in volcanic ash. */
const AshSnag = ({ x, y, scale, tint, dark }: FloraProps) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="2" rx="16" ry="4" fill="#160b08" opacity="0.45" />
    <path d="M-4 0 q2 -34 -6 -52 q14 12 12 -18 q6 26 8 70 z" fill={tint} />
    <path d="M2 0 q4 -30 10 -44 q-2 22 -4 44 z" fill={dark} />
    <polygon points="-16,0 -8,-14 0,0" fill={dark} opacity="0.7" />
  </g>
);

/** Leaning coconut palm for the cay. */
const Palm = ({ x, y, scale, tint, dark }: FloraProps) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="6" cy="2" rx="20" ry="4" fill="#0f2d24" opacity="0.3" />
    <path d="M-3 0 q-8 -40 10 -66 h7 q-16 28 -7 66 z" fill="#8b5a2b" />
    <path d="M4 -66 q26 -16 44 -4 q-24 -2 -40 10 z" fill={tint} />
    <path d="M4 -66 q-28 -18 -46 -6 q24 -2 42 12 z" fill={dark} />
    <path d="M6 -68 q10 -30 34 -34 q-20 14 -26 38 z" fill={tint} />
    <path d="M4 -68 q-12 -28 -34 -32 q20 14 28 36 z" fill={dark} />
    <circle cx="2" cy="-60" r="4" fill="#a16207" />
    <circle cx="12" cy="-58" r="4" fill="#a16207" />
  </g>
);

/** Cold desert local: a low-poly ibex with big curled horns. */
const Ibex = ({ x, y, scale = 1, flip = false, name }: { x: number; y: number; scale?: number; flip?: boolean; name: string }) => (
  <g>
    <text
      x={x}
      y={y - 96 * scale}
      textAnchor="middle"
      fontSize={14 * Math.max(0.8, scale)}
      fontWeight="700"
      fill="#e2e8f0"
      stroke="#0f172a"
      strokeWidth="3"
      paintOrder="stroke"
    >
      {name}
    </text>
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <ellipse cx="0" cy="2" rx="24" ry="5" fill="#0f172a" opacity="0.35" />
      <rect x="-14" y="-24" width="6" height="25" fill="#57534e" />
      <rect x="-3" y="-24" width="6" height="25" fill="#57534e" />
      <rect x="9" y="-24" width="6" height="25" fill="#57534e" />
      <rect x="17" y="-24" width="6" height="25" fill="#57534e" />
      <polygon points="-20,-44 22,-42 24,-22 -18,-24" fill="#a8a29e" />
      <polygon points="-20,-44 22,-42 24,-22" fill="#78716c" opacity="0.5" />
      <polygon points="-20,-42 -30,-38 -21,-30" fill="#a8a29e" />
      <polygon points="14,-44 24,-44 30,-70 22,-72" fill="#a8a29e" />
      <polygon points="21,-76 34,-74 33,-62 20,-64" fill="#d6d3d1" />
      <path d="M24 -76 q10 -22 -6 -26" stroke="#57534e" strokeWidth="4" fill="none" />
      <path d="M30 -76 q12 -20 -4 -26" stroke="#78716c" strokeWidth="4" fill="none" />
      <circle cx="30" cy="-70" r="1.8" fill="#1c1917" />
    </g>
  </g>
);

/** Volcano local: a fire salamander picking its way over warm rock. */
const Salamander = ({ x, y, scale = 1, flip = false, name }: { x: number; y: number; scale?: number; flip?: boolean; name: string }) => (
  <g>
    <text
      x={x}
      y={y - 52 * scale}
      textAnchor="middle"
      fontSize={14 * Math.max(0.8, scale)}
      fontWeight="700"
      fill="#fff7ed"
      stroke="#431407"
      strokeWidth="3"
      paintOrder="stroke"
    >
      {name}
    </text>
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <ellipse cx="0" cy="2" rx="30" ry="4" fill="#160b08" opacity="0.45" />
      <path d="M-34 -8 q8 -6 16 0 z" fill="#1c1917" />
      <polygon points="-30,-10 26,-14 30,-4 -26,-2" fill="#1c1917" />
      <polygon points="-38,-8 -28,-12 -26,-4" fill="#1c1917" />
      <polygon points="26,-14 40,-22 44,-10 30,-4" fill="#292524" />
      <circle cx="38" cy="-16" r="2" fill="#fbbf24" />
      <circle cx="-14" cy="-11" r="4" fill="#f97316" />
      <circle cx="2" cy="-13" r="4" fill="#fbbf24" />
      <circle cx="16" cy="-12" r="3" fill="#f97316" />
      <rect x="-18" y="-4" width="5" height="8" fill="#292524" />
      <rect x="10" y="-5" width="5" height="8" fill="#292524" />
    </g>
  </g>
);

/** Island local: a stout hermit crab guarding the tideline. */
const Crab = ({ x, y, scale = 1, flip = false, name }: { x: number; y: number; scale?: number; flip?: boolean; name: string }) => (
  <g>
    <text
      x={x}
      y={y - 56 * scale}
      textAnchor="middle"
      fontSize={14 * Math.max(0.8, scale)}
      fontWeight="700"
      fill="#f0fdfa"
      stroke="#134e4a"
      strokeWidth="3"
      paintOrder="stroke"
    >
      {name}
    </text>
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <ellipse cx="0" cy="2" rx="24" ry="4" fill="#134e4a" opacity="0.3" />
      <path d="M-22 0 l-8 -8 M-14 0 l-8 -10 M14 0 l10 -8 M22 0 l8 -10" stroke="#c2410c" strokeWidth="3" />
      <polygon points="-24,-10 24,-10 18,-30 -18,-30" fill="#ea580c" />
      <polygon points="0,-10 24,-10 18,-30 0,-30" fill="#c2410c" />
      <polygon points="-30,-26 -20,-38 -12,-26 -20,-22" fill="#ea580c" />
      <polygon points="30,-26 20,-40 12,-26 20,-22" fill="#c2410c" />
      <circle cx="-8" cy="-34" r="3.4" fill="#f8fafc" />
      <circle cx="8" cy="-34" r="3.4" fill="#f8fafc" />
      <circle cx="-8" cy="-34" r="1.6" fill="#0f172a" />
      <circle cx="8" cy="-34" r="1.6" fill="#0f172a" />
    </g>
  </g>
);

interface CritterProps {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  fleece: string;
  shade: string;
  name: string;
}

/** Low-poly alpaca loitering around camp — pure comedy livestock. */
const Alpaca = ({ x, y, scale = 1, flip = false, fleece, shade, name }: CritterProps) => (
  <g>
    {/* Name plate, kept upright even when the alpaca faces the other way */}
    <text
      x={x}
      y={y - 108 * scale}
      textAnchor="middle"
      fontSize={15 * Math.max(0.8, scale)}
      fontWeight="700"
      fill="#f8fafc"
      stroke="#0f172a"
      strokeWidth="3"
      paintOrder="stroke"
    >
      {name}
    </text>
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
    <ellipse cx="0" cy="2" rx="26" ry="5" fill="#0b1f16" opacity="0.3" />
    {/* legs */}
    <rect x="-16" y="-24" width="6" height="25" fill={shade} />
    <rect x="-4" y="-24" width="6" height="25" fill={shade} />
    <rect x="10" y="-24" width="6" height="25" fill={shade} />
    <rect x="18" y="-24" width="6" height="25" fill={shade} />
    {/* woolly body */}
    <polygon points="-22,-48 24,-44 26,-22 -20,-24" fill={fleece} />
    <polygon points="-22,-48 24,-44 26,-22" fill={shade} opacity="0.45" />
    {/* tail */}
    <polygon points="-22,-46 -32,-40 -22,-32" fill={fleece} />
    {/* neck + head */}
    <polygon points="14,-46 24,-46 30,-82 22,-84" fill={fleece} />
    <polygon points="21,-88 34,-86 33,-74 20,-76" fill={fleece} />
    <polygon points="34,-86 38,-78 33,-76" fill={shade} />
    {/* ears */}
    <polygon points="22,-88 25,-100 28,-87" fill={fleece} />
    <polygon points="29,-88 32,-99 34,-87" fill={shade} />
    {/* face */}
    <circle cx="30" cy="-82" r="1.8" fill="#1f2937" />
    <path d="M33 -76 q3 1 4 3" stroke="#1f2937" strokeWidth="1.4" fill="none" />
    </g>
  </g>
);

/** Glacier local: a stout low-poly penguin. */
const Penguin = ({ x, y, scale = 1, flip = false, name }: { x: number; y: number; scale?: number; flip?: boolean; name: string }) => (
  <g>
    <text
      x={x}
      y={y - 74 * scale}
      textAnchor="middle"
      fontSize={14 * Math.max(0.8, scale)}
      fontWeight="700"
      fill="#f8fafc"
      stroke="#0f172a"
      strokeWidth="3"
      paintOrder="stroke"
    >
      {name}
    </text>
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <ellipse cx="0" cy="2" rx="18" ry="4" fill="#1e3a8a" opacity="0.3" />
      <polygon points="-4,0 6,0 8,-6 -6,-6" fill="#f59e0b" />
      <polygon points="-14,-8 14,-8 10,-52 -10,-52" fill="#0f172a" />
      <polygon points="-8,-10 8,-10 6,-46 -6,-46" fill="#f8fafc" />
      <polygon points="-14,-40 -22,-20 -12,-16" fill="#0f172a" />
      <polygon points="10,-52 16,-62 -10,-62 -10,-52" fill="#0f172a" />
      <circle cx="4" cy="-56" r="1.8" fill="#f8fafc" />
      <polygon points="8,-56 18,-52 8,-50" fill="#f59e0b" />
    </g>
  </g>
);

/** Desert local: a two-humped low-poly camel. */
const Camel = ({ x, y, scale = 1, flip = false, name }: { x: number; y: number; scale?: number; flip?: boolean; name: string }) => (
  <g>
    <text
      x={x}
      y={y - 112 * scale}
      textAnchor="middle"
      fontSize={15 * Math.max(0.8, scale)}
      fontWeight="700"
      fill="#fff7ed"
      stroke="#431407"
      strokeWidth="3"
      paintOrder="stroke"
    >
      {name}
    </text>
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <ellipse cx="0" cy="2" rx="30" ry="5" fill="#431407" opacity="0.3" />
      <rect x="-18" y="-32" width="7" height="33" fill="#a16207" />
      <rect x="-6" y="-32" width="7" height="33" fill="#a16207" />
      <rect x="10" y="-32" width="7" height="33" fill="#a16207" />
      <rect x="19" y="-32" width="7" height="33" fill="#a16207" />
      <polygon points="-24,-56 26,-52 28,-28 -22,-32" fill="#d4a05a" />
      <polygon points="-14,-56 -4,-80 6,-56" fill="#c98f45" />
      <polygon points="6,-54 16,-78 26,-52" fill="#c98f45" />
      <polygon points="18,-52 28,-52 36,-92 28,-94" fill="#d4a05a" />
      <polygon points="27,-98 42,-96 41,-84 26,-86" fill="#d4a05a" />
      <polygon points="28,-98 31,-108 34,-97" fill="#c98f45" />
      <circle cx="36" cy="-93" r="1.8" fill="#1f2937" />
    </g>
  </g>
);

/** Hollow local: a bioluminescent snail with a toadstool for a shell. */
const Sporeling = ({ x, y, scale = 1, flip = false, name }: { x: number; y: number; scale?: number; flip?: boolean; name: string }) => (
  <g>
    <text
      x={x}
      y={y - 82 * scale}
      textAnchor="middle"
      fontSize={14 * Math.max(0.8, scale)}
      fontWeight="700"
      fill="#fdf4ff"
      stroke="#2e1065"
      strokeWidth="3"
      paintOrder="stroke"
    >
      {name}
    </text>
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <ellipse cx="0" cy="2" rx="26" ry="5" fill="#1b0733" opacity="0.4" />
      <ellipse cx="0" cy="-22" rx="40" ry="26" fill="#67e8f9" opacity="0.15" />
      <path d="M-26 0 q-6 -14 10 -16 h30 q14 4 10 16 z" fill="#c4b5fd" />
      <circle cx="2" cy="-26" r="20" fill="#a21caf" />
      <circle cx="2" cy="-26" r="12" fill="#e879f9" />
      <circle cx="2" cy="-26" r="5" fill="#fdf4ff" />
      <path d="M22 -12 q14 -2 16 -18" stroke="#c4b5fd" strokeWidth="4" fill="none" />
      <circle cx="39" cy="-32" r="3.5" fill="#67e8f9" />
      <path d="M28 -10 q12 -6 12 -16" stroke="#c4b5fd" strokeWidth="4" fill="none" />
      <circle cx="41" cy="-28" r="3" fill="#67e8f9" />
    </g>
  </g>
);

interface TentProps {
  x: number;
  y: number;
  scale: number;
  color: string;
  shade: string;
}

const Tent = ({ x, y, scale, color, shade }: TentProps) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="2" rx="34" ry="6" fill="#0b1f16" opacity="0.3" />
    <polygon points="0,-46 34,0 -34,0" fill={color} />
    <polygon points="0,-46 34,0 8,0" fill={shade} />
    <polygon points="0,-46 10,0 -10,0" fill="#0f172a" opacity="0.55" />
    <rect x="-36" y="-2" width="72" height="4" fill="#1e293b" opacity="0.5" />
  </g>
);

/**
 * One screen of the Base Camp world, drawn as flat low-poly SVG: layered
 * ridges, a water body, a scenery belt and local wildlife. The zone prop swaps
 * the whole palette and cast — home valley, glacier basin or desert range.
 * Purely decorative; climbers are rendered on top by the page.
 */
const BaseCampScene = memo(
  ({
    width = 2000,
    height = 900,
    zone = "valley",
  }: {
    width?: number;
    height?: number;
    zone?: CampZoneId;
  }) => {
    // Start on the day palette for SSR, then sync to the real GMT+2 hour after
    // hydration and keep ticking so the sun sets at 18:00 and rises at 05:00.
    const [hour, setHour] = useState<number | null>(null);
    useEffect(() => {
      setHour(gmt2Hour());
      const id = window.setInterval(() => setHour(gmt2Hour()), 60_000);
      return () => window.clearInterval(id);
    }, []);
    const night = hour !== null && isNightHour(hour);
    const set = PALETTES[zone] ?? PALETTES.valley;
    const p = night ? set.night : set.day;

    // Zone-specific scenery seeds so each screen looks its own.
    const SEEDS: Record<CampZoneId, number> = {
      valley: 0,
      glacier: 700,
      deathZone: 5100,
      desert: 1400,
      mushroom: 2100,
      coldDesert: 2800,
      volcano: 3500,
      island: 4200,
    };
    const BACK_COUNTS: Record<CampZoneId, number> = {
      valley: 26,
      glacier: 14,
      deathZone: 8,
      desert: 10,
      mushroom: 20,
      coldDesert: 16,
      volcano: 9,
      island: 12,
    };
    const FRONT_COUNTS: Record<CampZoneId, number> = {
      valley: 16,
      glacier: 10,
      deathZone: 6,
      desert: 9,
      mushroom: 13,
      coldDesert: 12,
      volcano: 8,
      island: 9,
    };
    const seed = SEEDS[zone] ?? 0;
    const backCount = BACK_COUNTS[zone] ?? 12;
    const frontCount = FRONT_COUNTS[zone] ?? 10;


    const backProps = Array.from({ length: backCount }, (_, i) => ({
      x: 40 + rand(seed + i + 1) * (width - 80),
      y: 470 + rand(seed + i + 9) * 40,
      scale: 0.5 + rand(seed + i + 3) * 0.3,
    }));
    const frontProps = Array.from({ length: frontCount }, (_, i) => ({
      x: 30 + rand(seed + i + 41) * (width - 60),
      y: 812 + rand(seed + i + 17) * 60,
      scale: 1.1 + rand(seed + i + 7) * 0.7,
    }));

    const FLORA: Record<CampZoneId, (props: FloraProps) => ReactElement> = {
      valley: Tree,
      glacier: Serac,
      deathZone: Serac,
      desert: Cactus,
      mushroom: Toadstool,
      coldDesert: RockSpire,
      volcano: AshSnag,
      island: Palm,
    };
    const Flora = FLORA[zone] ?? Tree;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`bc-sky-${zone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.sky[0]} />
            <stop offset="42%" stopColor={p.sky[1]} />
            <stop offset="72%" stopColor={p.sky[2]} />
            <stop offset="100%" stopColor={p.sky[3]} />
          </linearGradient>
          <linearGradient id={`bc-lake-${zone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.lakeTop} />
            <stop offset="100%" stopColor={p.lakeBottom} />
          </linearGradient>
          <radialGradient id={`bc-sun-${zone}`}>
            <stop offset="0%" stopColor={p.sunGlow} />
            <stop offset="100%" stopColor={p.sunGlow} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bc-fire">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky, sun and stars */}
        <rect width={width} height={height} fill={`url(#bc-sky-${zone})`} />
        {Array.from({ length: p.stars }, (_, i) => (
          <circle
            key={`star-${i}`}
            cx={rand(i + 101) * width}
            cy={rand(i + 202) * 420}
            r={rand(i + 303) * 1.8 + 0.6}
            fill="#fdf4ff"
            opacity={0.35 + rand(i + 404) * 0.5}
          />
        ))}
        <circle cx={width * 0.68} cy={p.sunY} r={190} fill={`url(#bc-sun-${zone})`} />
        <circle cx={width * 0.68} cy={p.sunY} r={62} fill={p.sunCore} />
        {night && <circle cx={width * 0.68 + 26} cy={p.sunY - 16} r={54} fill={p.sky[0]} />}

        {/* Clouds */}
        {[0.14, 0.42, 0.83].map((cx, i) => (
          <g key={`cloud-${i}`} opacity={p.cloudOpacity} fill={p.cloud}>
            <ellipse cx={width * cx} cy={180 + i * 40} rx={110} ry={26} />
            <ellipse cx={width * cx + 60} cy={168 + i * 40} rx={70} ry={20} />
          </g>
        ))}

        {/* Far ridge */}
        <polygon
          points={`0,470 ${width * 0.08},300 ${width * 0.17},430 ${width * 0.28},250 ${width * 0.4},420 ${width * 0.52},280 ${width * 0.64},430 ${width * 0.76},260 ${width * 0.88},420 ${width},310 ${width},560 0,560`}
          fill={p.farRidge}
        />
        <polygon points={`${width * 0.28},250 ${width * 0.33},320 ${width * 0.23},320`} fill={p.snow} />
        <polygon points={`${width * 0.76},260 ${width * 0.81},330 ${width * 0.71},330`} fill={p.snow} />

        {/* Mid ridge — this crest is the walkable skyline (see camp-terrain.ts) */}
        <polygon
          points={`0,560 ${width * 0.13},420 ${width * 0.26},545 ${width * 0.41},400 ${width * 0.58},550 ${width * 0.72},430 ${width * 0.87},545 ${width},450 ${width},680 0,680`}
          fill={p.midRidge}
        />

        {/* Named summits — every crest of this zone has a name and altitude */}
        {campPeaks(zone).map((pk) => (
          <g key={`pk-${pk.name}`} opacity={night ? 0.7 : 0.85}>
            <text
              x={width * pk.fx}
              y={pk.y - 26}
              textAnchor="middle"
              fill={p.snow}
              fontSize="19"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontWeight="600"
              stroke="#0f172a"
              strokeWidth="4"
              paintOrder="stroke"
              letterSpacing="0.5"
            >
              {pk.name}
            </text>
            <text
              x={width * pk.fx}
              y={pk.y - 8}
              textAnchor="middle"
              fill="#67e8f9"
              fontSize="15"
              fontFamily="ui-monospace, monospace"
              stroke="#0f172a"
              strokeWidth="4"
              paintOrder="stroke"
            >
              {formatCampAlt(pk.alt)}
            </text>
          </g>
        ))}



        {/* Back scenery belt */}
        {backProps.map((t, i) => (
          <Flora
            key={`bt-${i}`}
            x={t.x}
            y={t.y + 120}
            scale={t.scale}
            tint={p.backTree.tint}
            dark={p.backTree.dark}
          />
        ))}

        {/* Ground */}
        <path
          d={`M0 640 Q ${width * 0.25} 600 ${width * 0.5} 645 T ${width} 630 L ${width} ${height} L0 ${height} Z`}
          fill={p.meadowBack}
        />
        <path
          d={`M0 720 Q ${width * 0.3} 690 ${width * 0.62} 730 T ${width} 710 L ${width} ${height} L0 ${height} Z`}
          fill={p.meadowFront}
        />

        {/* Water: alpine lake / frozen lake / oasis */}
        <ellipse
          cx={width * 0.2}
          cy={760}
          rx={zone === "desert" ? 150 : 230}
          ry={zone === "desert" ? 40 : 54}
          fill={`url(#bc-lake-${zone})`}
        />
        <ellipse
          cx={width * 0.2}
          cy={748}
          rx={zone === "desert" ? 96 : 150}
          ry={18}
          fill="#e0f2fe"
          opacity="0.5"
        />

        {zone === "valley" && (
          <>
            {/* Camp: tents, campfire, bunting */}
            <Tent x={width * 0.44} y={742} scale={1} color="#ef4444" shade="#b91c1c" />
            <Tent x={width * 0.56} y={756} scale={1.15} color="#facc15" shade="#ca8a04" />
            <Tent x={width * 0.78} y={744} scale={0.95} color="#38bdf8" shade="#0284c7" />

            <g transform={`translate(${width * 0.5} 790)`}>
              <circle cx="0" cy="0" r={night ? 90 : 60} fill="url(#bc-fire)" opacity={p.fireOpacity} />
              <rect x="-22" y="-4" width="44" height="7" rx="3" fill="#78350f" transform="rotate(12)" />
              <rect x="-22" y="-4" width="44" height="7" rx="3" fill="#92400e" transform="rotate(-14)" />
              <polygon points="0,-34 11,-6 -11,-6" fill="#fb923c" />
              <polygon points="0,-22 6,-6 -6,-6" fill="#fef08a" />
            </g>

            <g stroke="#fbcfe8" strokeWidth="2" fill="none" opacity="0.85">
              <path d={`M${width * 0.38} 660 Q ${width * 0.5} 700 ${width * 0.62} 655`} />
            </g>
            {[0.41, 0.46, 0.5, 0.54, 0.59].map((fx, i) => (
              <polygon
                key={`flag-${i}`}
                points={`${width * fx},672 ${width * fx + 16},680 ${width * fx},690`}
                fill={["#f472b6", "#facc15", "#34d399", "#60a5fa", "#fb923c"][i]}
              />
            ))}
          </>
        )}

        {zone === "glacier" && (
          <>
            {/* Crevasse field across the ice plain */}
            {[0.3, 0.48, 0.66, 0.84].map((cx, i) => (
              <path
                key={`crev-${i}`}
                d={`M${width * cx} ${770 + i * 22} q 70 -14 150 6 q -70 22 -150 -6 z`}
                fill="#1d4ed8"
                opacity="0.45"
              />
            ))}
            {/* Igloo */}
            <g transform={`translate(${width * 0.55} 792)`}>
              <ellipse cx="0" cy="4" rx="70" ry="10" fill="#1e3a8a" opacity="0.25" />
              <path d="M-62 0 a62 52 0 0 1 124 0 z" fill="#f8fafc" />
              <path d="M-62 0 a62 52 0 0 1 124 0 z" fill="#bfdbfe" opacity="0.5" />
              <path d="M-18 0 a18 22 0 0 1 36 0 z" fill="#1e3a8a" />
              <path d="M-40 -22 h80 M-52 -6 h104" stroke="#cbd5e1" strokeWidth="2" />
            </g>
            {/* Ice axe cairn marker */}
            <g transform={`translate(${width * 0.83} 800)`}>
              <rect x="-3" y="-70" width="6" height="70" fill="#334155" />
              <polygon points="-3,-70 -30,-58 -3,-52" fill="#94a3b8" />
              <polygon points="3,-70 26,-60 3,-54" fill="#cbd5e1" />
            </g>
          </>
        )}

        {zone === "deathZone" && (
          <>
            {/* Wind-blasted col: hard snow ripples across the saddle */}
            {[0.18, 0.4, 0.62, 0.86].map((cx, i) => (
              <path
                key={`sastrugi-${i}`}
                d={`M${width * cx - 200} ${800 + i * 16} q 200 -${18 + i * 4} 400 0 z`}
                fill="#ffffff"
                opacity="0.5"
              />
            ))}
            {/* Prayer flags strung between two old picket anchors */}
            <g transform={`translate(${width * 0.22} 800)`}>
              <rect x="-3" y="-96" width="6" height="96" fill="#334155" />
              <rect x="297" y="-70" width="6" height="70" fill="#334155" />
              <path d="M0 -92 q150 34 300 -64" stroke="#475569" strokeWidth="3" fill="none" />
              {["#ef4444", "#facc15", "#22c55e", "#3b82f6", "#f8fafc", "#ef4444", "#facc15"].map(
                (c, i) => (
                  <polygon
                    key={`flag-${i}`}
                    points={`${20 + i * 40},${-88 + i * 4} ${44 + i * 40},${-84 + i * 4} ${32 + i * 40},${-62 + i * 4}`}
                    fill={c}
                    opacity="0.9"
                  />
                ),
              )}
            </g>
            {/* Altitude signpost, Camp IV style */}
            <g transform={`translate(${width * 0.09} 820)`}>
              <rect x="-4" y="-120" width="8" height="120" fill="#475569" />
              <g transform="translate(0 -150)">
                <rect x="-92" y="-34" width="184" height="66" rx="8" fill="#0f172a" opacity="0.92" />
                <rect
                  x="-92"
                  y="-34"
                  width="184"
                  height="66"
                  rx="8"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                />
                <text
                  x="0"
                  y="-10"
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="20"
                  fontFamily="monospace"
                  letterSpacing="3"
                >
                  CAMP IV
                </text>
                <text
                  x="0"
                  y="18"
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize="24"
                  fontFamily="monospace"
                  letterSpacing="2"
                >
                  7,950 m
                </text>
              </g>
            </g>
            {/* Abandoned high camp tent, half buried */}

            <g transform={`translate(${width * 0.42} 812)`}>
              <ellipse cx="0" cy="4" rx="54" ry="8" fill="#1e293b" opacity="0.25" />
              <polygon points="0,-44 44,0 -44,0" fill="#f97316" opacity="0.85" />
              <polygon points="0,-44 44,0 8,0" fill="#c2410c" opacity="0.9" />
              <path d="M-52 0 h104" stroke="#e2e8f0" strokeWidth="6" />
            </g>
            {/* The serac with the ladder — the only way to the oxygen cache */}
            <g transform={`translate(${width * 0.75} 830)`}>
              <ellipse cx="0" cy="6" rx="110" ry="14" fill="#1e3a8a" opacity="0.25" />
              <polygon points="-96,0 -60,-210 -6,-300 40,-268 74,-120 104,0" fill="#dbeafe" />
              <polygon points="-6,-300 40,-268 74,-120 104,0 24,0" fill="#93c5fd" />
              <polygon points="-60,-210 -22,-186 -50,-150" fill="#ffffff" opacity="0.7" />
              <polygon points="10,-236 44,-208 8,-190" fill="#ffffff" opacity="0.55" />
              {/* Aluminium ladder lashed to the ice */}
              <g>
                <rect x="-26" y="-300" width="7" height="304" fill="#e2e8f0" />
                <rect x="14" y="-300" width="7" height="304" fill="#cbd5e1" />
                {Array.from({ length: 13 }, (_, i) => (
                  <rect
                    key={`rung-${i}`}
                    x="-26"
                    y={-286 + i * 23}
                    width="47"
                    height="5"
                    fill="#f1f5f9"
                  />
                ))}
              </g>
              {/* Fixed rope flapping off the top */}
              <path d="M22 -298 q46 26 34 78" stroke="#f97316" strokeWidth="4" fill="none" />
            </g>
          </>
        )}

        {zone === "desert" && (
          <>
            {/* Rolling dunes over the sand plain */}
            {[0.12, 0.38, 0.62, 0.9].map((cx, i) => (
              <path
                key={`dune-${i}`}
                d={`M${width * cx - 260} 830 q 260 -${70 + i * 12} 520 0 z`}
                fill={i % 2 ? "#e0b06a" : "#d9a55c"}
                opacity="0.75"
              />
            ))}
            {/* Bedouin tent */}
            <g transform={`translate(${width * 0.58} 800)`}>
              <ellipse cx="0" cy="4" rx="80" ry="10" fill="#431407" opacity="0.25" />
              <path d="M-84 0 q 42 -46 84 -20 q 42 -26 84 20 z" fill="#7c2d12" />
              <path d="M0 -20 v20" stroke="#431407" strokeWidth="4" />
            </g>
            {/* Ruined stone arch */}
            <g transform={`translate(${width * 0.85} 806)`} fill="#a8642c">
              <rect x="-56" y="-90" width="20" height="90" />
              <rect x="36" y="-90" width="20" height="90" />
              <rect x="-56" y="-104" width="112" height="18" />
            </g>
          </>
        )}

        {zone === "mushroom" && (
          <>
            {/* Grinning, googly-eyed trees watching the forest */}
            {[
              { cx: 0.12, cy: 806, s: 1.15 },
              { cx: 0.44, cy: 776, s: 0.85 },
              { cx: 0.71, cy: 830, s: 1.3 },
              { cx: 0.93, cy: 788, s: 0.95 },
            ].map((t, i) => (
              <SillyTree
                key={`silly-${i}`}
                x={width * t.cx}
                y={t.cy}
                scale={t.s}
                tint={p.frontTree.tint}
                dark={p.frontTree.dark}
                variant={i}
              />
            ))}
            {/* Fairy rings glowing on the moss floor */}
            {[0.34, 0.62, 0.88].map((cx, i) => (
              <g key={`ring-${i}`}>
                <ellipse
                  cx={width * cx}
                  cy={790 + i * 18}
                  rx={110}
                  ry={26}
                  fill="none"
                  stroke="#67e8f9"
                  strokeWidth="3"
                  opacity="0.5"
                />
                {[0, 1, 2, 3, 4, 5].map((k) => (
                  <circle
                    key={k}
                    cx={width * cx + Math.cos((k / 6) * Math.PI * 2) * 110}
                    cy={790 + i * 18 + Math.sin((k / 6) * Math.PI * 2) * 26}
                    r="6"
                    fill="#e879f9"
                  />
                ))}
              </g>
            ))}
            {/* Lantern keeper's hut, carved into a fallen cap */}
            <g transform={`translate(${width * 0.5} 800)`}>
              <ellipse cx="0" cy="4" rx="76" ry="10" fill="#1b0733" opacity="0.35" />
              <path d="M-70 0 a70 46 0 0 1 140 0 z" fill="#a21caf" />
              <path d="M0 -46 a70 46 0 0 1 70 46 h-70 z" fill="#701a75" />
              <circle cx="-30" cy="-24" r="7" fill="#fdf4ff" opacity="0.8" />
              <circle cx="24" cy="-30" r="5" fill="#fdf4ff" opacity="0.7" />
              <path d="M-16 0 a16 20 0 0 1 32 0 z" fill="#2e1065" />
              <circle cx="0" cy="-12" r="4" fill="#fde68a" />
            </g>
            {/* Drifting spores */}
            {Array.from({ length: 34 }, (_, i) => (
              <circle
                key={`spore-${i}`}
                cx={rand(seed + i + 71) * width}
                cy={560 + rand(seed + i + 131) * 320}
                r={1.5 + rand(seed + i + 191) * 3}
                fill="#a5f3fc"
                opacity={0.35 + rand(seed + i + 251) * 0.5}
              />
            ))}
          </>
        )}

        {zone === "coldDesert" && (
          <>
            {/* Extra jagged Dolomite towers biting into the skyline */}
            {[0.18, 0.36, 0.52, 0.69, 0.9].map((cx, i) => (
              <g key={`tower-${i}`}>
                <polygon
                  points={`${width * cx - 70},600 ${width * cx - 34},${330 + i * 26} ${width * cx - 6},${430 + i * 12} ${width * cx + 22},${300 + i * 30} ${width * cx + 64},600`}
                  fill={i % 2 ? p.farRidge : p.midRidge}
                />
                <polygon
                  points={`${width * cx + 22},${300 + i * 30} ${width * cx + 40},${360 + i * 26} ${width * cx + 4},${368 + i * 24}`}
                  fill={p.snow}
                  opacity="0.5"
                />
              </g>
            ))}
            {/* Scree fans and frost-shattered boulders */}
            {[0.1, 0.28, 0.47, 0.64, 0.81, 0.95].map((cx, i) => (
              <g key={`scree-${i}`}>
                <polygon
                  points={`${width * cx},${700 + i * 8} ${width * cx + 120},${800 + i * 10} ${width * cx - 120},${800 + i * 10}`}
                  fill="#57606c"
                  opacity="0.55"
                />
                <polygon
                  points={`${width * cx - 40},${812 + i * 6} ${width * cx - 12},${784 + i * 6} ${width * cx + 20},${812 + i * 6}`}
                  fill="#6b7280"
                />
              </g>
            ))}
            {/* Drystone bivouac hut */}
            <g transform={`translate(${width * 0.56} 806)`}>
              <ellipse cx="0" cy="4" rx="64" ry="9" fill="#0f172a" opacity="0.3" />
              <rect x="-52" y="-54" width="104" height="54" fill="#6b7280" />
              <polygon points="-60,-54 0,-88 60,-54" fill="#475569" />
              <rect x="-12" y="-30" width="24" height="30" fill="#1f2937" />
              <path d="M-52 -40 h104 M-52 -22 h104" stroke="#4b5563" strokeWidth="2" />
            </g>
            {/* Wind-blown grit */}
            {Array.from({ length: 26 }, (_, i) => (
              <rect
                key={`grit-${i}`}
                x={rand(seed + i + 61) * width}
                y={640 + rand(seed + i + 121) * 230}
                width={18 + rand(seed + i + 181) * 26}
                height="2"
                fill="#94a3b8"
                opacity="0.25"
              />
            ))}
          </>
        )}

        {zone === "volcano" && (
          <>
            {/* The cone itself, smoking away behind camp */}
            <g>
              <polygon
                points={`${width * 0.62},640 ${width * 0.74},250 ${width * 0.8},250 ${width * 0.94},640`}
                fill="#2b1c17"
              />
              <polygon points={`${width * 0.74},250 ${width * 0.8},250 ${width * 0.86},430 ${width * 0.78},380`} fill="#1b110e" />
              <polygon
                points={`${width * 0.745},262 ${width * 0.795},262 ${width * 0.79},330 ${width * 0.76},300`}
                fill="#f97316"
              />
              {/* Lava tongues down the flank */}
              <path
                d={`M${width * 0.77} 268 q -22 120 -56 372 l 34 0 q 22 -240 40 -372 z`}
                fill="#ef4444"
                opacity="0.85"
              />
              <path d={`M${width * 0.775} 280 q -14 110 -34 350 l 12 0 q 16 -230 28 -350 z`} fill="#fbbf24" />
              {/* Ash plume */}
              {[0, 1, 2, 3].map((i) => (
                <ellipse
                  key={`plume-${i}`}
                  cx={width * 0.77 + i * 28}
                  cy={210 - i * 52}
                  rx={70 + i * 26}
                  ry={34 + i * 12}
                  fill="#57534e"
                  opacity={0.5 - i * 0.08}
                />
              ))}
            </g>
            {/* Lava river across the ash plain */}
            <path
              d={`M0 782 q ${width * 0.25} -30 ${width * 0.5} 6 T ${width} 776 l 0 26 q -${width * 0.5} 36 -${width} 0 z`}
              fill="#7f1d1d"
            />
            <path
              d={`M0 790 q ${width * 0.25} -28 ${width * 0.5} 6 T ${width} 784`}
              stroke="#fb923c"
              strokeWidth="10"
              fill="none"
            />
            <path
              d={`M0 790 q ${width * 0.25} -28 ${width * 0.5} 6 T ${width} 784`}
              stroke="#fde68a"
              strokeWidth="4"
              fill="none"
            />
            {/* Steam vents */}
            {[0.16, 0.34, 0.5].map((cx, i) => (
              <g key={`vent-${i}`} opacity="0.5">
                <ellipse cx={width * cx} cy={846 + i * 8} rx="34" ry="8" fill="#1c1917" />
                <ellipse cx={width * cx} cy={800 - i * 10} rx="18" ry="26" fill="#d6d3d1" opacity="0.4" />
                <ellipse cx={width * cx + 8} cy={752 - i * 14} rx="26" ry="30" fill="#d6d3d1" opacity="0.25" />
              </g>
            ))}
            {/* Embers drifting up */}
            {Array.from({ length: 40 }, (_, i) => (
              <circle
                key={`ember-${i}`}
                cx={rand(seed + i + 71) * width}
                cy={520 + rand(seed + i + 131) * 360}
                r={1.4 + rand(seed + i + 191) * 2.6}
                fill={rand(seed + i + 251) > 0.5 ? "#fbbf24" : "#f97316"}
                opacity={0.4 + rand(seed + i + 311) * 0.5}
              />
            ))}
          </>
        )}

        {zone === "island" && (
          <>
            {/* Ocean filling the middle distance, with a reef line */}
            <rect x="0" y="640" width={width} height="150" fill={`url(#bc-lake-${zone})`} />
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={`swell-${i}`}
                d={`M0 ${668 + i * 24} q ${width * 0.08} -10 ${width * 0.16} 0 t ${width * 0.16} 0 t ${width * 0.16} 0 t ${width * 0.16} 0 t ${width * 0.16} 0 t ${width * 0.16} 0`}
                stroke="#e0f7fa"
                strokeWidth="2.5"
                fill="none"
                opacity={0.35}
              />
            ))}
            {/* White sand beach with surf line */}
            <path
              d={`M0 790 q ${width * 0.3} -40 ${width * 0.6} -6 T ${width} 780 L ${width} ${height} L0 ${height} Z`}
              fill="#fdf0c9"
            />
            <path
              d={`M0 790 q ${width * 0.3} -40 ${width * 0.6} -6 T ${width} 780`}
              stroke="#ffffff"
              strokeWidth="7"
              fill="none"
              opacity="0.8"
            />
            {/* Beach hut on stilts */}
            <g transform={`translate(${width * 0.55} 810)`}>
              <ellipse cx="0" cy="6" rx="70" ry="9" fill="#0f2d24" opacity="0.25" />
              <rect x="-46" y="-16" width="8" height="18" fill="#8b5a2b" />
              <rect x="38" y="-16" width="8" height="18" fill="#8b5a2b" />
              <rect x="-48" y="-52" width="96" height="36" fill="#c8a06a" />
              <path d="M-64 -52 l64 -34 l64 34 z" fill="#a3653a" />
              <rect x="-12" y="-42" width="24" height="26" fill="#5b3a21" />
            </g>
            {/* Hammock between two palms */}
            <g transform={`translate(${width * 0.28} 792)`}>
              <path d="M-70 -60 q70 46 140 -60" stroke="#e2e8f0" strokeWidth="3" fill="none" />
            </g>
            {/* Beached dinghy */}
            <g transform={`translate(${width * 0.82} 838)`}>
              <path d="M-52 0 q52 22 104 0 l-14 -18 h-76 z" fill="#0ea5e9" />
              <rect x="-4" y="-56" width="5" height="40" fill="#8b5a2b" />
              <polygon points="1,-56 34,-24 1,-24" fill="#f8fafc" />
            </g>
            {/* Seabirds */}
            {[0.2, 0.32, 0.44].map((cx, i) => (
              <path
                key={`bird-${i}`}
                d={`M${width * cx} ${300 + i * 40} q 14 -12 26 0 q 12 -12 26 0`}
                stroke={night ? "#cbd5e1" : "#0f172a"}
                strokeWidth="3"
                fill="none"
                opacity="0.6"
              />
            ))}
          </>
        )}

        {/* Foreground scenery belt */}
        {frontProps.map((t, i) => (
          <Flora
            key={`ft-${i}`}
            x={t.x}
            y={t.y}
            scale={t.scale}
            tint={p.frontTree.tint}
            dark={p.frontTree.dark}
          />
        ))}

        {/* Local wildlife */}
        {zone === "valley" && (
          <>
            <Alpaca x={width * 0.11} y={866} scale={0.9} fleece="#fef3c7" shade="#d6bd8a" name="Martin's Alpaca" />
            <Alpaca x={width * 0.2} y={872} scale={0.82} flip fleece="#e7d5c0" shade="#a9917a" name="Viggo's Alpaca" />
            <Alpaca x={width * 0.29} y={860} scale={0.85} fleece="#f9a8d4" shade="#db2777" name="Pawlak's Alpaca" />
          </>
        )}
        {zone === "glacier" && (
          <>
            <Penguin x={width * 0.14} y={862} scale={1} name="Crampon" />
            <Penguin x={width * 0.22} y={874} scale={0.85} flip name="Serac" />
            <Penguin x={width * 0.3} y={858} scale={0.9} name="Bergschrund" />
          </>
        )}
        {zone === "deathZone" && (
          <>
            <g transform={`translate(${width * 0.12} 856)`} opacity="0.9">
              <ellipse cx="0" cy="6" rx="20" ry="4" fill="#0f172a" opacity="0.3" />
              <ellipse cx="0" cy="-14" rx="22" ry="13" fill="#111827" />
              <circle cx="18" cy="-26" r="9" fill="#111827" />
              <polygon points="26,-27 42,-23 26,-20" fill="#64748b" />
              <circle cx="21" cy="-28" r="2" fill="#f8fafc" />
              <polygon points="-20,-18 -44,-6 -14,-8" fill="#0b1220" />
              <rect x="-4" y="-2" width="3" height="8" fill="#64748b" />
              <rect x="6" y="-2" width="3" height="8" fill="#64748b" />
            </g>
          </>
        )}
        {zone === "desert" && (
          <>
            <Camel x={width * 0.16} y={868} scale={0.95} name="Dromedary Dave" />
            <Camel x={width * 0.3} y={858} scale={0.85} flip name="Sandy" />
          </>
        )}
        {zone === "mushroom" && (
          <>
            <Sporeling x={width * 0.13} y={866} scale={1} name="Glimmer" />
            <Sporeling x={width * 0.24} y={876} scale={0.85} flip name="Truffle" />
            <Sporeling x={width * 0.33} y={856} scale={0.9} name="Fizz" />
          </>
        )}
        {zone === "coldDesert" && (
          <>
            <Ibex x={width * 0.13} y={864} scale={0.95} name="Grit" />
            <Ibex x={width * 0.24} y={874} scale={0.82} flip name="Slate" />
            <Ibex x={width * 0.34} y={856} scale={0.88} name="Cirque" />
          </>
        )}
        {zone === "volcano" && (
          <>
            <Salamander x={width * 0.14} y={868} scale={1.1} name="Cinder" />
            <Salamander x={width * 0.26} y={880} scale={0.9} flip name="Pumice" />
          </>
        )}
        {zone === "island" && (
          <>
            <Crab x={width * 0.15} y={870} scale={1.1} name="Pinch" />
            <Crab x={width * 0.25} y={882} scale={0.9} flip name="Coco" />
            <Crab x={width * 0.36} y={860} scale={0.85} name="Reef" />
          </>
        )}

        {Array.from({ length: 60 }, (_, i) => (
          <path
            key={`grass-${i}`}
            d={`M${rand(seed + i + 501) * width} ${height - 10} l4 -16 l4 16 z`}
            fill={p.grass}
            opacity="0.7"
          />
        ))}
        {p.overlay && (
          <rect width={width} height={height} fill={p.overlay} opacity={p.overlayOpacity} pointerEvents="none" />
        )}
      </svg>
    );
  },
);

BaseCampScene.displayName = "BaseCampScene";

export default BaseCampScene;
