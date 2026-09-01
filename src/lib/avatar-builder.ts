/**
 * Climber avatar builder — a small dress-up game for member profiles.
 *
 * Avatars are pure SVG generated from a config object, so nothing is uploaded.
 * The config is stored in `profiles.avatar_url` as `gen:<encoded json>` and
 * turned back into a data URL by `resolveAvatarUrl`, which means every existing
 * `MemberAvatar` call site renders designed avatars with no extra plumbing.
 *
 * Items unlock with the climber's XP level (see `@/lib/xp`).
 */

export interface AvatarParts {
  skin: string;
  hair: string;
  hairColor: string;
  beard: string;
  eyes: string;
  mouth: string;
  jacket: string;
  headwear: string;
  accessory: string;
  bg: string;
}

export interface AvatarConfig extends AvatarParts {
  /** Preview/render animation preference, stored with the avatar so it follows the member across devices. */
  animated?: boolean;
}

export interface AvatarOption {
  id: string;
  label: string;
  /** XP level required to equip this item. 1 = available to everyone. */
  level: number;
  /** Illustration colour, for swatch-style pickers. */
  color?: string;
}

export interface AvatarPart {
  key: keyof AvatarParts;
  label: string;
  swatch?: boolean;
  options: AvatarOption[];
}

const free = (id: string, label: string, color?: string): AvatarOption =>
  color === undefined ? { id, label, level: 1 } : { id, label, level: 1, color };


export const avatarParts: AvatarPart[] = [
  {
    key: "skin",
    label: "Skin tone",
    swatch: true,
    options: [
      free("porcelain", "Porcelain", "#f2d3bd"),
      free("light", "Light", "#e0ac86"),
      free("tan", "Tan", "#c68642"),
      free("brown", "Brown", "#8d5524"),
      free("deep", "Deep", "#5a3418"),
      free("sunburnt", "Sunburnt", "#e0996f"),
    ],
  },
  {
    key: "hair",
    label: "Hair",
    options: [
      free("none", "Bald"),
      free("buzz", "Buzz cut"),
      free("short", "Short"),
      free("curly", "Curly"),
      { id: "ponytail", label: "Ponytail", level: 4 },
      { id: "long", label: "Long", level: 6 },
      { id: "mohawk", label: "Mohawk", level: 9 },
      { id: "dreads", label: "Dreads", level: 12 },
    ],
  },
  {
    key: "hairColor",
    label: "Hair colour",
    swatch: true,
    options: [
      free("black", "Black", "#1d1a17"),
      free("brown", "Brown", "#5a3a22"),
      free("blond", "Blond", "#d9a441"),
      free("ginger", "Ginger", "#b5522a"),
      free("grey", "Grey", "#a8a29e"),
      { id: "snow", label: "Snow white", level: 10, color: "#f5f5f4" },
      { id: "alpine", label: "Alpine cyan", level: 15, color: "#22d3ee" },
    ],
  },
  {
    key: "beard",
    label: "Beard",
    options: [
      free("none", "Clean shaven"),
      free("stubble", "Stubble"),
      free("goatee", "Goatee"),
      { id: "full", label: "Full beard", level: 3 },
      { id: "viking", label: "Expedition beard", level: 11 },
    ],
  },
  {
    key: "eyes",
    label: "Eyes",
    options: [
      free("normal", "Normal"),
      free("happy", "Happy"),
      free("focused", "Focused"),
      { id: "shades", label: "Sunglasses", level: 5 },
      { id: "goggles", label: "Ski goggles", level: 8 },
      { id: "glacier", label: "Glacier glasses", level: 13 },
    ],
  },
  {
    key: "mouth",
    label: "Mouth",
    options: [
      free("smile", "Smile"),
      free("neutral", "Neutral"),
      free("grin", "Grin"),
      { id: "shout", label: "Summit shout", level: 7 },
    ],
  },
  {
    key: "jacket",
    label: "Jacket",
    swatch: true,
    options: [
      free("red", "Red shell", "#dc2626"),
      free("blue", "Blue shell", "#2563eb"),
      free("green", "Green shell", "#16a34a"),
      free("black", "Black shell", "#27272a"),
      free("orange", "Orange shell", "#ea580c"),
      { id: "cyan", label: "Onsight cyan", level: 6, color: "#06b6d4" },
      { id: "down", label: "Down suit", level: 14, color: "#facc15" },
      { id: "gold", label: "Gold expedition suit", level: 18, color: "#eab308" },
    ],
  },
  {
    key: "headwear",
    label: "Headwear",
    options: [
      free("none", "Nothing"),
      free("beanie", "Beanie"),
      free("cap", "Cap"),
      { id: "helmet", label: "Climbing helmet", level: 9 },
      { id: "hood", label: "Storm hood", level: 12 },
      { id: "oxygen", label: "Oxygen mask", level: 16 },
      { id: "crown", label: "Summit crown", level: 20 },
    ],
  },
  {
    key: "accessory",
    label: "Gear",
    options: [
      free("none", "None"),
      { id: "poles", label: "Trekking poles", level: 2 },
      { id: "axe", label: "Ice axe", level: 4 },
      { id: "rope", label: "Rope coil", level: 7 },
      { id: "flag", label: "Summit flag", level: 15 },
    ],
  },
  {
    key: "bg",
    label: "Backdrop",
    options: [
      free("plain", "Plain"),
      free("ridge", "Ridge"),
      free("glacier", "Glacier"),
      { id: "sunset", label: "Alpenglow", level: 5 },
      { id: "night", label: "Night sky", level: 10 },
      { id: "aurora", label: "Aurora", level: 17 },
    ],
  },
];

export const defaultAvatarConfig: AvatarConfig = {
  skin: "light",
  hair: "short",
  hairColor: "brown",
  beard: "stubble",
  eyes: "normal",
  mouth: "smile",
  jacket: "red",
  headwear: "beanie",
  accessory: "none",
  bg: "ridge",
};

const colorOf = (key: keyof AvatarParts, id: string, fallback: string) =>
  avatarParts.find((p) => p.key === key)?.options.find((o) => o.id === id)?.color ?? fallback;

export const isUnlocked = (option: AvatarOption, level: number) => level >= option.level;

/** Options a climber can currently equip, given their level. */
export const unlockedCount = (level: number) =>
  avatarParts.reduce((n, p) => n + p.options.filter((o) => isUnlocked(o, level)).length, 0);

export const totalOptionCount = avatarParts.reduce((n, p) => n + p.options.length, 0);

/** Strip anything the climber has not unlocked yet back to a free option. */
export const sanitizeConfig = (config: AvatarConfig, level: number): AvatarConfig => {
  const next = { ...config };
  for (const part of avatarParts) {
    const chosen = part.options.find((o) => o.id === next[part.key]);
    if (!chosen || !isUnlocked(chosen, level)) {
      next[part.key] = part.options.find((o) => isUnlocked(o, level))?.id ?? part.options[0]!.id;
    }
  }
  return next;
};

export const randomConfig = (level: number): AvatarConfig => {
  const out = { ...defaultAvatarConfig };
  for (const part of avatarParts) {
    const pool = part.options.filter((o) => isUnlocked(o, level));
    out[part.key] = pool[Math.floor(Math.random() * pool.length)]!.id;
  }
  return out;
};

/* ---------------------------------------------------------------- drawing */

const backdrop = (id: string) => {
  switch (id) {
    case "ridge":
      return `<rect width="128" height="128" fill="#0f172a"/><path d="M0 96 L34 56 L58 84 L82 44 L128 96 Z" fill="#1e293b"/><path d="M82 44 L94 60 L70 60 Z" fill="#e2e8f0"/><path d="M34 56 L44 70 L24 70 Z" fill="#e2e8f0"/>`;
    case "glacier":
      return `<rect width="128" height="128" fill="#0e7490"/><path d="M0 100 L30 70 L60 100 L90 66 L128 100 Z" fill="#a5f3fc" opacity="0.7"/>`;
    case "sunset":
      return `<defs><linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fb7185"/><stop offset="1" stop-color="#7c2d12"/></linearGradient></defs><rect width="128" height="128" fill="url(#bgg)"/><circle cx="96" cy="34" r="14" fill="#fde68a" opacity="0.9"/><path d="M0 100 L38 62 L70 100 L96 70 L128 100 Z" fill="#431407"/>`;
    case "night":
      return `<rect width="128" height="128" fill="#0b1220"/><circle cx="24" cy="22" r="2" fill="#fff"/><circle cx="52" cy="14" r="1.5" fill="#fff"/><circle cx="98" cy="26" r="2" fill="#fff"/><circle cx="76" cy="40" r="1.2" fill="#fff"/><circle cx="112" cy="52" r="1.5" fill="#fff"/><path d="M0 102 L36 66 L72 102 L100 74 L128 102 Z" fill="#111827"/>`;
    case "aurora":
      return `<defs><linearGradient id="bga" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1220"/><stop offset="0.5" stop-color="#065f46"/><stop offset="1" stop-color="#4c1d95"/></linearGradient></defs><rect width="128" height="128" fill="url(#bga)"/><path d="M-8 44 Q32 14 64 42 T136 34 L136 62 Q96 40 64 66 T-8 66 Z" fill="#34d399" opacity="0.45"/><path d="M-8 60 Q40 34 72 58 T136 50 L136 74 Q88 56 60 80 T-8 80 Z" fill="#a78bfa" opacity="0.35"/><path d="M0 104 L34 70 L70 104 L98 78 L128 104 Z" fill="#0b1220"/>`;
    default:
      return `<rect width="128" height="128" fill="#1e293b"/>`;
  }
};

const jacketLayer = (id: string) => {
  const c = colorOf("jacket", id, "#dc2626");
  const puffy = id === "down" || id === "gold";
  const body = `<path d="M22 128 C22 104 42 94 64 94 C86 94 106 104 106 128 Z" fill="${c}"/>`;
  const collar = `<path d="M50 96 L64 110 L78 96 C74 93 54 93 50 96 Z" fill="#0f172a" opacity="0.35"/>`;
  const baffles = puffy
    ? `<g stroke="#00000033" stroke-width="2" fill="none"><path d="M26 112 H102"/><path d="M23 120 H105"/></g>`
    : "";
  const shine = id === "gold" ? `<path d="M64 94 C86 94 106 104 106 128 L92 128 C92 108 80 98 64 96 Z" fill="#fff" opacity="0.25"/>` : "";
  return body + baffles + collar + shine;
};

/** Anime/JRPG head silhouette: tall crown, soft cheeks, tapered chin. */
const HEAD_PATH =
  "M64 34 C83 34 91 47 91 62 C91 78 80 92 64 99 C48 92 37 78 37 62 C37 47 45 34 64 34 Z";

/** Hard cel-shade wedge on the shadow side of the face. */
const CEL_FACE_SHADE = `<path d="M64 34 C83 34 91 47 91 62 C91 78 80 92 64 99 L64 34 Z" fill="#000" opacity="0.10"/>
<path d="M46 52 C42 62 44 74 52 84 C44 78 39 70 38 60 Z" fill="#000" opacity="0.07"/>`;

const hairLayer = (style: string, color: string) => {
  const c = colorOf("hairColor", color, "#5a3a22");
  // Layered spikes + a hard specular band, the way JRPG portraits render hair.
  const gloss = (d: string) => `<path d="${d}" fill="#fff" opacity="0.22"/>`;
  switch (style) {
    case "buzz":
      return `<path d="M39 56 C39 34 89 34 89 56 C85 46 78 43 64 43 C50 43 43 46 39 56 Z" fill="${c}"/>${gloss("M48 46 C56 41 72 41 80 46 C72 44 56 44 48 46 Z")}`;
    case "short":
      return `<path d="M37 60 C35 32 93 32 91 60 C88 50 84 44 76 42 L70 50 L64 40 L56 50 L50 42 C43 45 39 50 37 60 Z" fill="${c}"/>${gloss("M46 48 C54 40 74 40 82 48 C72 42 56 42 46 48 Z")}`;
    case "curly":
      return `<g fill="${c}"><circle cx="46" cy="47" r="11"/><circle cx="60" cy="39" r="12"/><circle cx="75" cy="41" r="11"/><circle cx="86" cy="52" r="9"/></g>${gloss("M52 36 C60 30 72 31 78 36 C70 33 60 33 52 36 Z")}`;
    case "ponytail":
      return `<path d="M37 58 C36 32 92 32 91 58 C86 46 78 42 64 42 C50 42 42 46 37 58 Z" fill="${c}"/><path d="M88 50 C104 56 106 82 94 94 C102 76 94 60 84 56 Z" fill="${c}"/>${gloss("M48 46 C56 40 72 40 80 46 C70 43 58 43 48 46 Z")}`;
    case "long":
      return `<path d="M35 58 C33 28 95 28 93 58 L93 96 C88 80 86 70 86 60 C76 50 52 50 42 60 C42 70 40 80 35 96 Z" fill="${c}"/><path d="M42 40 L54 54 L60 36 L68 54 L78 38 L86 52 C80 38 50 34 42 40 Z" fill="${c}"/>${gloss("M44 52 C48 66 48 78 46 90 C44 76 42 64 44 52 Z")}`;
    case "mohawk":
      return `<path d="M54 46 L58 18 L64 40 L70 16 L74 46 Z" fill="${c}"/>${gloss("M60 40 L62 22 L64 40 Z")}`;
    case "dreads":
      return `<path d="M37 58 C37 32 91 32 91 58 Z" fill="${c}"/><g fill="${c}"><rect x="33" y="52" width="6" height="36" rx="3"/><rect x="43" y="54" width="6" height="28" rx="3"/><rect x="79" y="54" width="6" height="28" rx="3"/><rect x="89" y="52" width="6" height="36" rx="3"/></g>`;
    default:
      return "";
  }
};

/** Oversized JRPG eyes: gradient iris, hard lash line, two catch-lights. */
const animeEye = (cx: number, iris: string, flip = false) => {
  const s = flip ? -1 : 1;
  return `<g>
<ellipse cx="${cx}" cy="66" rx="7" ry="8.4" fill="#f8fafc"/>
<ellipse cx="${cx + s * 0.6}" cy="66.5" rx="5.2" ry="7" fill="${iris}"/>
<ellipse cx="${cx + s * 0.6}" cy="69" rx="5.2" ry="4" fill="#000" opacity="0.28"/>
<ellipse cx="${cx + s * 0.6}" cy="67" rx="2.4" ry="3.4" fill="#0b1220"/>
<circle cx="${cx + s * 2.4}" cy="62.6" r="2.1" fill="#fff"/>
<circle cx="${cx - s * 2}" cy="70" r="1.1" fill="#fff" opacity="0.8"/>
<path d="M${cx - 7.4} 62 C${cx - 4} 56.4 ${cx + 4} 56.4 ${cx + 7.4} 62.6 L${cx + 6.6} 64 C${cx + 3} 59.4 ${cx - 3.6} 59.4 ${cx - 6.6} 63.6 Z" fill="#0b1220"/>
<path d="M${cx - 8} 55.5 C${cx - 3} 51.5 ${cx + 4} 51.8 ${cx + 8} 55" stroke="#0b1220" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.85"/>
</g>`;
};

const eyesLayer = (id: string) => {
  switch (id) {
    case "happy":
      return `<g stroke="#0b1220" stroke-width="3.4" stroke-linecap="round" fill="none"><path d="M47 66 Q54 58 61 66"/><path d="M67 66 Q74 58 81 66"/></g>`;
    case "focused":
      return `${animeEye(53, "#f59e0b")}${animeEye(75, "#f59e0b", true)}<g stroke="#0b1220" stroke-width="2.6" stroke-linecap="round"><path d="M45 54 L61 58"/><path d="M83 54 L67 58"/></g>`;
    case "shades":
      return `<g fill="#0b1220"><path d="M42 56 L62 56 L60 70 C52 73 44 70 42 62 Z"/><path d="M86 56 L66 56 L68 70 C76 73 84 70 86 62 Z"/><rect x="60" y="58" width="8" height="3"/></g><path d="M45 59 L57 59 L48 68 Z" fill="#fff" opacity="0.25"/>`;
    case "goggles":
      return `<rect x="38" y="50" width="52" height="22" rx="11" fill="#0f172a"/><rect x="42" y="53" width="44" height="16" rx="8" fill="#22d3ee"/><path d="M45 67 L66 54 L76 54 L50 70 Z" fill="#fff" opacity="0.5"/><rect x="32" y="57" width="8" height="8" rx="2" fill="#0f172a"/><rect x="88" y="57" width="8" height="8" rx="2" fill="#0f172a"/>`;
    case "glacier":
      return `<g><rect x="41" y="55" width="19" height="14" rx="3" fill="#111827"/><rect x="68" y="55" width="19" height="14" rx="3" fill="#111827"/><rect x="60" y="60" width="8" height="3" fill="#111827"/><path d="M35 57 L41 57 L41 69 Z" fill="#4b5563"/><path d="M93 57 L87 57 L87 69 Z" fill="#4b5563"/></g>`;
    default:
      return `${animeEye(53, "#38bdf8")}${animeEye(75, "#38bdf8", true)}`;
  }
};

const mouthLayer = (id: string) => {
  switch (id) {
    case "neutral":
      return `<path d="M59 83 H69" stroke="#9f1239" stroke-width="2.4" stroke-linecap="round"/>`;
    case "grin":
      return `<path d="M56 80 Q64 89 72 80 Z" fill="#7f1d1d"/><path d="M57.5 80.5 H70.5 L69 83.5 H59 Z" fill="#fff"/>`;
    case "shout":
      return `<path d="M57 79 Q64 76 71 79 Q69 91 64 91 Q59 91 57 79 Z" fill="#7f1d1d"/><path d="M58.5 79.5 Q64 77.5 69.5 79.5 Q64 82 58.5 79.5 Z" fill="#fff"/>`;
    default:
      return `<path d="M58 81 Q64 87 70 81" stroke="#9f1239" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
};


const beardLayer = (id: string, color: string) => {
  const c = colorOf("hairColor", color, "#5a3a22");
  switch (id) {
    case "stubble":
      return `<path d="M40 66 C40 92 88 92 88 66 C88 84 76 92 64 92 C52 92 40 84 40 66 Z" fill="${c}" opacity="0.28"/>`;
    case "goatee":
      return `<path d="M56 82 C56 94 72 94 72 82 C70 90 58 90 56 82 Z" fill="${c}"/>`;
    case "full":
      return `<path d="M40 62 C40 96 88 96 88 62 C88 88 78 96 64 96 C50 96 40 88 40 62 Z" fill="${c}"/>`;
    case "viking":
      return `<path d="M38 60 C38 104 90 104 90 60 C90 96 82 112 64 112 C46 112 38 96 38 60 Z" fill="${c}"/><path d="M52 100 Q64 112 76 100" fill="${c}"/>`;
    default:
      return "";
  }
};

const headwearLayer = (id: string, jacket: string) => {
  const j = colorOf("jacket", jacket, "#dc2626");
  switch (id) {
    case "beanie":
      return `<path d="M36 54 C36 26 92 26 92 54 Z" fill="${j}"/><rect x="34" y="50" width="60" height="10" rx="5" fill="#0f172a" opacity="0.55"/><circle cx="64" cy="24" r="6" fill="#f8fafc"/>`;
    case "cap":
      return `<path d="M38 52 C38 28 90 28 90 52 Z" fill="${j}"/><path d="M88 50 C104 50 108 58 106 60 L86 58 Z" fill="${j}"/>`;
    case "helmet":
      return `<path d="M34 56 C34 24 94 24 94 56 Z" fill="#f8fafc"/><rect x="32" y="52" width="64" height="8" rx="4" fill="#0ea5e9"/><g stroke="#94a3b8" stroke-width="2"><path d="M50 30 L54 52"/><path d="M78 30 L74 52"/></g>`;
    case "hood":
      return `<path d="M28 74 C22 34 106 34 100 74 C96 46 84 38 64 38 C44 38 32 46 28 74 Z" fill="${j}"/><path d="M30 72 C26 40 102 40 98 72" fill="none" stroke="#0f172a" stroke-width="3" opacity="0.35"/>`;
    case "oxygen":
      return `<path d="M36 54 C36 26 92 26 92 54 Z" fill="#f97316"/><path d="M46 66 C46 86 82 86 82 66 C82 82 46 82 46 66 Z" fill="#e2e8f0"/><rect x="44" y="62" width="40" height="16" rx="8" fill="#cbd5e1"/><path d="M84 70 C100 74 100 92 92 100" stroke="#475569" stroke-width="4" fill="none"/>`;
    case "crown":
      return `<path d="M40 40 L48 22 L56 34 L64 16 L72 34 L80 22 L88 40 Z" fill="#eab308"/><rect x="40" y="38" width="48" height="8" rx="3" fill="#ca8a04"/><circle cx="64" cy="28" r="3" fill="#22d3ee"/>`;
    default:
      return "";
  }
};

const accessoryLayer = (id: string) => {
  switch (id) {
    case "poles":
      return `<g stroke="#94a3b8" stroke-width="3" stroke-linecap="round"><path d="M18 70 L22 128"/><path d="M110 70 L106 128"/></g><g fill="#0f172a"><rect x="14" y="66" width="10" height="6" rx="3"/><rect x="104" y="66" width="10" height="6" rx="3"/></g>`;
    case "axe":
      return `<g><rect x="14" y="60" width="5" height="60" rx="2.5" fill="#0f172a"/><path d="M8 62 C18 54 30 58 32 66 L20 64 Z" fill="#cbd5e1"/><path d="M16 118 L20 128 L12 128 Z" fill="#cbd5e1"/></g>`;
    case "rope":
      return `<g fill="none" stroke="#22d3ee" stroke-width="4"><path d="M100 106 a12 8 0 1 0 0.1 0"/><path d="M98 114 a12 8 0 1 0 0.1 0"/></g>`;
    case "flag":
      return `<rect x="100" y="46" width="4" height="70" rx="2" fill="#e2e8f0"/><path d="M104 48 L128 56 L104 66 Z" fill="#22d3ee"/>`;
    default:
      return "";
  }
};

/** SMIL/CSS-free keyframe styles used by the animated preview. */
const animationStyle = `<style>
@keyframes av-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }
@keyframes av-blink { 0%,92%,100% { transform: scaleY(1); } 96% { transform: scaleY(0.08); } }
@keyframes av-sway { 0%,100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
@keyframes av-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.015); } }
.av-head { animation: av-bob 3.6s ease-in-out infinite; }
.av-eyes { animation: av-blink 5s ease-in-out infinite; transform-origin: 64px 62px; }
.av-gear { animation: av-sway 4.4s ease-in-out infinite; transform-origin: 64px 120px; }
.av-body { animation: av-breathe 3.6s ease-in-out infinite; transform-origin: 64px 128px; }
@media (prefers-reduced-motion: reduce) { :root:not([data-motion="full"]) .av-head, :root:not([data-motion="full"]) .av-eyes, :root:not([data-motion="full"]) .av-gear, :root:not([data-motion="full"]) .av-body { animation: none; } }
[data-motion="reduced"] .av-head, [data-motion="reduced"] .av-eyes, [data-motion="reduced"] .av-gear, [data-motion="reduced"] .av-body { animation: none; }
</style>`;

/* --------------------------------------------------------------- 3D look */

/**
 * Shared gradient/filter defs that give the flat SVG puppets a rounded, lit,
 * "3D" feel: a key light from the upper left, ambient occlusion under the chin
 * and shoulders, a rim light on the right edge and a soft contact shadow.
 *
 * Ids are namespaced with `uid` so several avatars can share a page.
 */
const depthDefs = (uid: string, skin: string) => `<defs>
<radialGradient id="sk${uid}" cx="0.34" cy="0.28" r="0.85">
  <stop offset="0" stop-color="#fff" stop-opacity="0.42"/>
  <stop offset="0.55" stop-color="#fff" stop-opacity="0.06"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.32"/>
</radialGradient>
<linearGradient id="bd${uid}" x1="0.1" y1="0" x2="0.95" y2="1">
  <stop offset="0" stop-color="#fff" stop-opacity="0.28"/>
  <stop offset="0.5" stop-color="#fff" stop-opacity="0.02"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.35"/>
</linearGradient>
<radialGradient id="vg${uid}" cx="0.5" cy="0.42" r="0.75">
  <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
</radialGradient>
<filter id="sh${uid}" x="-40%" y="-40%" width="180%" height="180%">
  <feDropShadow dx="1.5" dy="2.5" stdDeviation="2.2" flood-color="#000" flood-opacity="0.35"/>
</filter>
<linearGradient id="rim${uid}" x1="1" y1="0" x2="0" y2="0">
  <stop offset="0" stop-color="${skin}" stop-opacity="0.9"/>
  <stop offset="1" stop-color="${skin}" stop-opacity="0"/>
</linearGradient>
</defs>`;

/** Stable per-config id suffix so SSR and client markup match. */
const uidFor = (config: AvatarConfig) => {
  const src = JSON.stringify(config);
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h << 5) + h + src.charCodeAt(i)) >>> 0;
  return h.toString(36);
};

const headSculpt = (uid: string) => `
<path d="${HEAD_PATH}" fill="url(#sk${uid})"/>
${CEL_FACE_SHADE}
<path d="M86 48 C92 56 92 70 84 82 C90 68 90 58 84 50 Z" fill="#7dd3fc" opacity="0.5"/>
<ellipse cx="49" cy="76" rx="5" ry="3" fill="#f472b6" opacity="0.22"/>
<ellipse cx="79" cy="76" rx="5" ry="3" fill="#f472b6" opacity="0.22"/>`;

export const buildAvatarSvg = (config: AvatarConfig, animated = false): string => {
  const skin = colorOf("skin", config.skin, "#e0ac86");
  const uid = uidFor(config);
  const cls = (name: string) => (animated ? ` class="${name}"` : "");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="Climber avatar">`,
    animated ? animationStyle : "",
    depthDefs(uid, skin),
    backdrop(config.bg),
    `<rect width="128" height="128" fill="url(#vg${uid})"/>`,
    `<ellipse cx="64" cy="124" rx="42" ry="8" fill="#000" opacity="0.3"/>`,
    `<g${cls("av-gear")}>`,
    accessoryLayer(config.accessory),
    `</g>`,
    `<g${cls("av-body")} filter="url(#sh${uid})">`,
    jacketLayer(config.jacket),
    `<path d="M22 128 C22 104 42 94 64 94 C86 94 106 104 106 128 Z" fill="url(#bd${uid})"/>`,
    `<path d="M96 104 C102 110 106 118 106 128 L98 128 C98 118 96 110 92 105 Z" fill="#7dd3fc" opacity="0.45"/>`,
    `</g>`,
    `<g${cls("av-head")} filter="url(#sh${uid})">`,
    `<path d="M56 86 L72 86 L72 98 C72 102 56 102 56 98 Z" fill="${skin}"/>`,
    `<path d="M56 86 L72 86 L72 94 C64 98 58 96 56 92 Z" fill="#000" opacity="0.24"/>`,
    `<path d="${HEAD_PATH}" fill="${skin}"/>`,
    `<ellipse cx="37" cy="68" rx="4" ry="6" fill="${skin}"/><ellipse cx="91" cy="68" rx="4" ry="6" fill="${skin}"/>`,
    headSculpt(uid),
    beardLayer(config.beard, config.hairColor),
    hairLayer(config.hair, config.hairColor),
    `<g${cls("av-eyes")}>${eyesLayer(config.eyes)}</g>`,
    mouthLayer(config.mouth),
    `<path d="M62 70 L60.5 76 L64 76.5" stroke="#000" stroke-opacity="0.18" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
    headwearLayer(config.headwear, config.jacket),
    `</g>`,
    `</svg>`,
  ].join("");
};


/* ------------------------------------------------------- full-body figure */

/**
 * A standing, full-body version of the avatar used in the activity feed and
 * the Base Camp scene. Transparent background, contact shadow on the ground,
 * same head/gear parts as the portrait so the two always match.
 */
export type AvatarView = "front" | "back";

export const buildAvatarFigureSvg = (
  config: AvatarConfig,
  animated = false,
  view: AvatarView = "front",
): string => {
  const skin = colorOf("skin", config.skin, "#e0ac86");
  const jacket = colorOf("jacket", config.jacket, "#dc2626");
  const hairColor = colorOf("hairColor", config.hairColor, "#3b2314");
  const uid = `f${view === "back" ? "b" : ""}${uidFor(config)}`;
  const cls = (name: string) => (animated ? ` class="${name}"` : "");

  const head =
    view === "front"
      ? [
          `<path d="M56 86 L72 86 L72 100 C72 104 56 104 56 100 Z" fill="${skin}"/>`,
          `<path d="M56 86 L72 86 L72 95 C64 99 58 97 56 93 Z" fill="#000" opacity="0.26"/>`,
          `<path d="${HEAD_PATH}" fill="${skin}"/>`,
          `<ellipse cx="37" cy="68" rx="4" ry="6" fill="${skin}"/><ellipse cx="91" cy="68" rx="4" ry="6" fill="${skin}"/>`,
          headSculpt(uid),
          beardLayer(config.beard, config.hairColor),
          hairLayer(config.hair, config.hairColor),
          `<g${cls("av-eyes")}>${eyesLayer(config.eyes)}</g>`,
          mouthLayer(config.mouth),
          headwearLayer(config.headwear, config.jacket),
        ].join("")
      : [
          // Back of the head: same silhouette, no face, hair mass covering it.
          `<path d="M56 86 L72 86 L72 100 C72 104 56 104 56 100 Z" fill="${skin}"/>`,
          `<path d="${HEAD_PATH}" fill="${skin}"/>`,
          `<path d="${HEAD_PATH}" fill="url(#sk${uid})"/>`,
          `<ellipse cx="37" cy="68" rx="4" ry="6" fill="${skin}"/><ellipse cx="91" cy="68" rx="4" ry="6" fill="${skin}"/>`,
          `<path d="M64 24 C88 24 96 44 94 64 C92 78 90 84 88 88 C90 66 86 50 64 50 C42 50 38 66 40 88 C38 84 36 78 34 64 C32 44 40 24 64 24 Z" fill="${hairColor}"/>`,
          `<path d="M40 48 C48 44 80 44 88 48 C90 62 90 76 88 88 C86 66 42 66 40 88 C38 76 38 62 40 48 Z" fill="${hairColor}"/>`,
          `<path d="M52 30 C62 26 76 28 84 36 C74 32 62 30 52 30 Z" fill="#fff" opacity="0.18"/>`,
          headwearLayer(config.headwear, config.jacket),
        ].join("");

  // Slim, heroic JRPG proportions: tapered torso, long legs, coat tails.
  const torso =
    "M42 76 C42 60 50 53 56 51 L64 48 L72 51 C78 53 86 60 86 76 L84 104 C84 110 78 113 64 113 C50 113 44 110 44 104 Z";
  const frontDetails = `
<path d="M64 48 L64 113 C78 113 84 110 84 104 L86 76 C86 60 78 53 72 51 Z" fill="#000" opacity="0.12"/>
<path d="M55 50 L64 64 L73 50 C69 47 59 47 55 50 Z" fill="#0f172a" opacity="0.4"/>`;
  const backDetails = `
<path d="M64 48 L64 113 C50 113 44 110 44 104 L42 76 C42 60 50 53 56 51 Z" fill="#000" opacity="0.12"/>
<path d="M63 50 L65 50 L65 112 L63 112 Z" fill="#0f172a" opacity="0.35"/>
<path d="M50 56 C56 74 56 92 52 108 L58 108 C61 90 61 72 56 55 Z" fill="#0f172a" opacity="0.28"/>
<path d="M78 56 C72 74 72 92 76 108 L70 108 C67 90 67 72 72 55 Z" fill="#0f172a" opacity="0.28"/>
<rect x="54" y="70" width="20" height="8" rx="3" fill="#0f172a" opacity="0.45"/>`;
  const body = `
<path d="${torso}" fill="${jacket}"/>
<path d="${torso}" fill="url(#bd${uid})"/>
${view === "front" ? frontDetails : backDetails}
<path d="M44 104 L40 132 L52 126 L54 106 Z" fill="${jacket}"/>
<path d="M84 104 L88 132 L76 126 L74 106 Z" fill="${jacket}"/>
<path d="M84 104 L88 132 L82 129 L79 105 Z" fill="#000" opacity="0.18"/>
<path d="M43 70 C35 78 33 94 35 108 C35 114 44 114 44 108 C42 96 44 84 47 78 Z" fill="${jacket}"/>
<path d="M85 70 C93 78 95 94 93 108 C93 114 84 114 84 108 C86 96 84 84 81 78 Z" fill="${jacket}"/>
<path d="M88 74 C94 84 95 98 93 108 C96 96 95 82 90 74 Z" fill="#7dd3fc" opacity="0.5"/>
<circle cx="39" cy="112" r="5.5" fill="${skin}"/><circle cx="89" cy="112" r="5.5" fill="${skin}"/>
<path d="M50 110 L48 150 L59 150 L62 110 Z" fill="#1f2937"/>
<path d="M78 110 L80 150 L69 150 L66 110 Z" fill="#1f2937"/>
<path d="M78 110 L80 150 L76 150 L74 110 Z" fill="#000" opacity="0.2"/>
${
  view === "front"
    ? `<path d="M46 148 L61 148 L61 159 L42 159 C40 159 40 150 46 148 Z" fill="#0f172a"/>
<path d="M82 148 L67 148 L67 159 L86 159 C88 159 88 150 82 148 Z" fill="#0f172a"/>`
    : `<path d="M46 148 L61 148 L61 159 L48 159 C44 159 44 150 46 148 Z" fill="#0f172a"/>
<path d="M82 148 L67 148 L67 159 L80 159 C84 159 84 150 82 148 Z" fill="#0f172a"/>`
}`;


  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 176" width="128" height="176" role="img" aria-label="Climber figure">`,
    animated ? animationStyle : "",
    depthDefs(uid, skin),
    `<ellipse cx="64" cy="166" rx="40" ry="7" fill="#000" opacity="0.35"/>`,
    `<g${cls("av-gear")} transform="translate(0,32)">${accessoryLayer(config.accessory)}</g>`,
    `<g${cls("av-body")} filter="url(#sh${uid})">${body}</g>`,
    `<g${cls("av-head")} filter="url(#sh${uid})" transform="translate(64,40) scale(0.70) translate(-64,-66)">${head}</g>`,
    `</svg>`,
  ].join("");
};


export const avatarFigureDataUrl = (config: AvatarConfig, animated = false) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildAvatarFigureSvg(config, animated))}`;


export const AVATAR_PREFIX = "gen:";

export const encodeAvatarConfig = (config: AvatarConfig) =>
  `${AVATAR_PREFIX}${encodeURIComponent(JSON.stringify(config))}`;

export const decodeAvatarConfig = (value: string | null | undefined): AvatarConfig | null => {
  if (!value || !value.startsWith(AVATAR_PREFIX)) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value.slice(AVATAR_PREFIX.length)));
    return { ...defaultAvatarConfig, ...parsed } as AvatarConfig;
  } catch {
    return null;
  }
};

export const avatarDataUrl = (config: AvatarConfig, animated = false) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildAvatarSvg(config, animated))}`;
