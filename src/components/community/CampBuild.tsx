import { memo } from "react";

import { buildById } from "@/lib/camp-builds";

interface Props {
  buildId: string;
  label: string;
  /** World coordinates of the build's base. */
  x: number;
  y: number;
  /** Highlighted outline for the signed-in member's own build. */
  mine?: boolean;
  onClick?: () => void;
}

const roof = (w: number, h: number, color: string, shade: string) => (
  <>
    <polygon points={`0,${-h} ${w / 2},${-h * 0.45} ${-w / 2},${-h * 0.45}`} fill={color} />
    <polygon points={`0,${-h} ${w / 2},${-h * 0.45} 0,${-h * 0.45}`} fill={shade} />
  </>
);

/** Flat low-poly artwork for every build tier, drawn from a shared baseline. */
const Art = ({ id }: { id: string }) => {
  switch (id) {
    case "campfire":
      return (
        <g>
          <ellipse cx="0" cy="2" rx="38" ry="7" fill="#0b1f16" opacity="0.35" />
          <circle cx="-30" cy="-2" r="5" fill="#64748b" />
          <circle cx="-14" cy="1" r="5" fill="#94a3b8" />
          <circle cx="14" cy="1" r="5" fill="#94a3b8" />
          <circle cx="30" cy="-2" r="5" fill="#64748b" />
          <rect x="-26" y="-12" width="52" height="9" rx="4" fill="#78350f" transform="rotate(-8)" />
          <rect x="-26" y="-12" width="52" height="9" rx="4" fill="#92400e" transform="rotate(9)" />
          <path d="M0 -46 Q 14 -28 10 -12 Q 4 -4 -10 -12 Q -14 -28 0 -46 Z" fill="#f97316" />
          <path d="M0 -34 Q 8 -22 4 -12 Q -2 -8 -6 -14 Q -6 -24 0 -34 Z" fill="#fbbf24" />
          <circle cx="-16" cy="-44" r="2.5" fill="#fed7aa" opacity="0.7" />
          <circle cx="12" cy="-52" r="2" fill="#fed7aa" opacity="0.5" />
        </g>
      );

    case "bivy":
      return (
        <g>
          <ellipse cx="0" cy="2" rx="34" ry="6" fill="#0b1f16" opacity="0.3" />
          <path d="M-32 0 Q 0 -26 32 0 Z" fill="#f97316" />
          <path d="M0 -20 Q 20 -14 30 0 L0 0 Z" fill="#c2410c" />
          <rect x="-34" y="-2" width="68" height="4" rx="2" fill="#1e293b" opacity="0.5" />
        </g>
      );
    case "small_tent":
      return (
        <g>
          <ellipse cx="0" cy="2" rx="34" ry="6" fill="#0b1f16" opacity="0.3" />
          <polygon points="0,-42 30,0 -30,0" fill="#22c55e" />
          <polygon points="0,-42 30,0 7,0" fill="#15803d" />
          <polygon points="0,-40 9,0 -9,0" fill="#0f172a" opacity="0.55" />
        </g>
      );
    case "big_tent":
      return (
        <g>
          <ellipse cx="0" cy="3" rx="52" ry="8" fill="#0b1f16" opacity="0.3" />
          <polygon points="-46,0 -46,-40 0,-62 46,-40 46,0" fill="#ef4444" />
          <polygon points="0,-62 46,-40 46,0 12,0 12,-40" fill="#b91c1c" />
          <polygon points="-14,0 -14,-34 0,-44 4,-40 4,0" fill="#0f172a" opacity="0.5" />
          <rect x="-52" y="-2" width="104" height="4" rx="2" fill="#1e293b" opacity="0.5" />
        </g>
      );
    case "yurt":
      return (
        <g>
          <ellipse cx="0" cy="3" rx="60" ry="9" fill="#0b1f16" opacity="0.3" />
          <rect x="-52" y="-36" width="104" height="36" fill="#f8fafc" />
          <rect x="-52" y="-36" width="104" height="8" fill="#cbd5e1" />
          <polygon points="0,-78 58,-34 -58,-34" fill="#e2e8f0" />
          <polygon points="0,-78 58,-34 0,-34" fill="#94a3b8" />
          <rect x="-10" y="-30" width="20" height="30" fill="#7c2d12" />
          <rect x="-3" y="-92" width="6" height="16" fill="#475569" />
          <path d="M-2 -96 q6 -10 0 -18" stroke="#cbd5e1" strokeWidth="3" fill="none" opacity="0.7" />
        </g>
      );
    case "tiny_hut":
      return (
        <g>
          <ellipse cx="0" cy="3" rx="52" ry="8" fill="#0b1f16" opacity="0.3" />
          <rect x="-40" y="-42" width="80" height="42" fill="#a16207" />
          <rect x="-40" y="-42" width="80" height="42" fill="#78350f" opacity="0.25" />
          {roof(104, 74, "#dc2626", "#991b1b")}
          <rect x="-10" y="-28" width="20" height="28" fill="#3f2412" />
          <rect x="14" y="-32" width="14" height="14" fill="#fde68a" />
        </g>
      );
    case "medium_hut":
      return (
        <g>
          <ellipse cx="0" cy="4" rx="72" ry="10" fill="#0b1f16" opacity="0.3" />
          <rect x="-62" y="-56" width="124" height="56" fill="#b45309" />
          <rect x="-62" y="-56" width="124" height="10" fill="#92400e" />
          {roof(150, 96, "#334155", "#1e293b")}
          <rect x="-12" y="-36" width="24" height="36" fill="#3f2412" />
          {[-46, -26, 22, 42].map((wx) => (
            <rect key={wx} x={wx} y={-44} width="16" height="16" fill="#fde68a" />
          ))}
          <rect x="34" y="-104" width="10" height="24" fill="#57534e" />
        </g>
      );
    case "large_hut":
      return (
        <g>
          <ellipse cx="0" cy="5" rx="94" ry="12" fill="#0b1f16" opacity="0.3" />
          <rect x="-84" y="-70" width="168" height="70" fill="#a16207" />
          <rect x="-84" y="-70" width="168" height="12" fill="#78350f" />
          {roof(196, 116, "#475569", "#27313f")}
          <rect x="-16" y="-44" width="32" height="44" fill="#3f2412" />
          {[-66, -42, 26, 50].map((wx) => (
            <rect key={wx} x={wx} y={-56} width="18" height="18" fill="#fde68a" />
          ))}
          {[-66, -42, 26, 50].map((wx) => (
            <rect key={`b${wx}`} x={wx} y={-30} width="18" height="18" fill="#fde68a" opacity="0.8" />
          ))}
          <rect x="-96" y="-8" width="192" height="8" rx="3" fill="#57534e" />
        </g>
      );
    case "lodge":
      return (
        <g>
          <ellipse cx="0" cy="6" rx="112" ry="13" fill="#0b1f16" opacity="0.3" />
          <rect x="-104" y="-14" width="208" height="14" fill="#7c5334" />
          <rect x="-92" y="-78" width="184" height="64" fill="#c2853f" />
          <rect x="-92" y="-78" width="184" height="12" fill="#92400e" />
          {roof(232, 132, "#1f2937", "#111827")}
          {[-74, -46, -18, 18, 46, 74].map((wx) => (
            <rect key={wx} x={wx - 9} y={-64} width="18" height="20" fill="#fde68a" />
          ))}
          <rect x="-18" y="-44" width="36" height="30" fill="#3f2412" />
          <rect x="66" y="-124" width="12" height="30" fill="#57534e" />
        </g>
      );
    case "refuge":
      return (
        <g>
          <ellipse cx="0" cy="6" rx="124" ry="14" fill="#0b1f16" opacity="0.3" />
          <polygon points="-118,0 -104,-30 104,-30 118,0" fill="#64748b" />
          <rect x="-100" y="-96" width="200" height="66" fill="#94a3b8" />
          <rect x="-100" y="-96" width="200" height="10" fill="#64748b" />
          {roof(240, 150, "#0f172a", "#020617")}
          {[-78, -44, -10, 26, 60].map((wx) => (
            <rect key={wx} x={wx} y={-84} width="20" height="22" fill="#fdba74" />
          ))}
          <rect x="-20" y="-62" width="40" height="32" fill="#1f2937" />
          <path d="M-140 0 l24 -22 l14 22 z" fill="#475569" />
        </g>
      );
    case "hamlet":
      return (
        <g>
          <ellipse cx="0" cy="6" rx="156" ry="15" fill="#0b1f16" opacity="0.3" />
          {[-110, -30, 66].map((hx, i) => (
            <g key={hx} transform={`translate(${hx} ${-i * 6})`}>
              <rect x="-40" y="-52" width="80" height="52" fill={["#c2853f", "#a16207", "#b45309"][i]} />
              {roof(100, 88, "#334155", "#1e293b")}
              <rect x="-10" y="-30" width="20" height="30" fill="#3f2412" />
              <rect x="16" y="-40" width="14" height="14" fill="#fde68a" />
            </g>
          ))}
          <g transform="translate(140 0)">
            <rect x="-18" y="-84" width="36" height="84" fill="#e2e8f0" />
            <polygon points="0,-118 22,-84 -22,-84" fill="#7f1d1d" />
            <rect x="-6" y="-70" width="12" height="16" fill="#1e293b" />
          </g>
        </g>
      );
    case "village":
      return (
        <g>
          <ellipse cx="0" cy="7" rx="188" ry="16" fill="#0b1f16" opacity="0.3" />
          {[-160, -96, -30, 40, 106].map((hx, i) => (
            <g key={hx} transform={`translate(${hx} ${-(i % 3) * 8})`}>
              <rect x="-34" y={-46 - (i % 2) * 14} width="68" height={46 + (i % 2) * 14} fill={["#c2853f", "#a16207", "#b45309", "#d97706", "#92400e"][i]} />
              {roof(88, 78 + (i % 2) * 14, i % 2 ? "#475569" : "#7f1d1d", i % 2 ? "#27313f" : "#581c1c")}
              <rect x="-8" y="-26" width="16" height="26" fill="#3f2412" />
              <rect x="12" y="-38" width="12" height="12" fill="#fde68a" />
            </g>
          ))}
          <g transform="translate(166 0)">
            <rect x="-20" y="-116" width="40" height="116" fill="#f1f5f9" />
            <polygon points="0,-158 24,-116 -24,-116" fill="#7f1d1d" />
            <circle cx="0" cy="-96" r="9" fill="#fbbf24" />
          </g>
          <path d="M-190 0 q190 -26 380 0" stroke="#78716c" strokeWidth="7" fill="none" opacity="0.6" />
        </g>
      );
    case "town":
      return (
        <g>
          <ellipse cx="0" cy="8" rx="220" ry="18" fill="#0b1f16" opacity="0.3" />
          {[-196, -140, -84, -26, 32, 92, 152].map((hx, i) => {
            const h = 52 + ((i * 37) % 60);
            return (
              <g key={hx} transform={`translate(${hx} 0)`}>
                <rect x="-28" y={-h} width="56" height={h} fill={["#c2853f", "#a16207", "#b45309", "#9a3412", "#78350f", "#d97706", "#92400e"][i]} />
                {roof(72, h + 30, i % 2 ? "#334155" : "#7f1d1d", i % 2 ? "#1e293b" : "#581c1c")}
                {[0, 1, 2].map((r) => (
                  <rect key={r} x="-18" y={-h + 10 + r * 20} width="12" height="12" fill="#fde68a" opacity={r * 0.2 + 0.6} />
                ))}
                {[0, 1, 2].map((r) => (
                  <rect key={`b${r}`} x="6" y={-h + 10 + r * 20} width="12" height="12" fill="#fde68a" opacity={r * 0.2 + 0.6} />
                ))}
              </g>
            );
          })}
          {/* Cable car up to the ridge */}
          <path d="M-210 -30 L 210 -190" stroke="#1f2937" strokeWidth="3" fill="none" />
          <rect x="30" y="-124" width="26" height="18" rx="4" fill="#ef4444" />
          <path d="M-224 0 q224 -30 448 0" stroke="#78716c" strokeWidth="8" fill="none" opacity="0.6" />
        </g>
      );
    case "city":
      return (
        <g>
          <ellipse cx="0" cy="9" rx="260" ry="20" fill="#0b1f16" opacity="0.3" />
          {/* Terraced ridge city, Fansipan style */}
          {[0, 1, 2, 3].map((t) => (
            <rect key={t} x={-250 + t * 34} y={-30 - t * 26} width={500 - t * 68} height={26} fill={["#78716c", "#8b8378", "#a1a1aa", "#b8b3ab"][t]} />
          ))}
          {[-210, -150, -92, -34, 30, 92, 152, 210].map((hx, i) => (
            <g key={hx} transform={`translate(${hx} ${-30 - (i % 3) * 26})`}>
              <rect x="-26" y="-54" width="52" height="54" fill="#b91c1c" />
              <polygon points="0,-92 44,-54 -44,-54" fill="#facc15" />
              <polygon points="0,-92 44,-54 0,-54" fill="#ca8a04" />
              <polygon points="0,-116 30,-88 -30,-88" fill="#fbbf24" />
              <rect x="-8" y="-30" width="16" height="30" fill="#7f1d1d" />
            </g>
          ))}
          {/* Great pagoda on the summit terrace */}
          <g transform="translate(0 -134)">
            {[0, 1, 2].map((t) => (
              <g key={t} transform={`translate(0 ${-t * 44})`}>
                <rect x={-34 + t * 6} y="-40" width={68 - t * 12} height="40" fill="#7f1d1d" />
                <polygon points={`0,-72 ${56 - t * 8},-38 ${-56 + t * 8},-38`} fill="#f59e0b" />
              </g>
            ))}
            <polygon points="0,-176 12,-140 -12,-140" fill="#fde68a" />
          </g>
          <path d="M-250 0 L 0 -134" stroke="#e2e8f0" strokeWidth="4" fill="none" opacity="0.5" />
        </g>
      );
    case "megacity":
      return (
        <g>
          <ellipse cx="0" cy="10" rx="310" ry="22" fill="#0b1f16" opacity="0.35" />
          {[-290, -236, -184, -128, -70, -8, 52, 112, 170, 232, 284].map((hx, i) => {
            const h = 90 + ((i * 63) % 210);
            return (
              <g key={hx} transform={`translate(${hx} 0)`}>
                <rect x="-24" y={-h} width="48" height={h} fill={i % 2 ? "#1e293b" : "#0f172a"} />
                <rect x="-24" y={-h} width="48" height="8" fill="#38bdf8" opacity="0.7" />
                {Array.from({ length: Math.floor(h / 26) }, (_, r) => (
                  <rect
                    key={r}
                    x={r % 2 ? -16 : 2}
                    y={-h + 16 + r * 24}
                    width="14"
                    height="12"
                    fill={r % 3 === 0 ? "#f472b6" : "#67e8f9"}
                    opacity="0.85"
                  />
                ))}
                <rect x="-2" y={-h - 26} width="4" height="26" fill="#94a3b8" />
                <circle cx="0" cy={-h - 30} r="4" fill="#f87171" />
              </g>
            );
          })}
          {/* Sky bridges */}
          <path d="M-236 -150 L -70 -190" stroke="#38bdf8" strokeWidth="5" opacity="0.8" fill="none" />
          <path d="M52 -210 L 232 -170" stroke="#f472b6" strokeWidth="5" opacity="0.8" fill="none" />
          <rect x="-320" y="-6" width="640" height="10" rx="4" fill="#334155" />
        </g>
      );
    default:
      return null;
  }
};

/**
 * A member's camp build, anchored to its base point in the Base Camp world
 * with a nameplate underneath ("Martin's hut").
 */
/** Natural drawing size of each artwork, so every build scales to its footprint. */
const ART: Record<string, { w: number; h: number }> = {
  campfire: { w: 84, h: 56 },
  bivy: { w: 76, h: 34 },

  small_tent: { w: 68, h: 50 },
  big_tent: { w: 110, h: 70 },
  yurt: { w: 126, h: 104 },
  tiny_hut: { w: 112, h: 82 },
  medium_hut: { w: 158, h: 116 },
  large_hut: { w: 204, h: 128 },
  lodge: { w: 240, h: 140 },
  refuge: { w: 288, h: 162 },
  hamlet: { w: 330, h: 132 },
  village: { w: 400, h: 172 },
  town: { w: 470, h: 210 },
  city: { w: 520, h: 330 },
  megacity: { w: 660, h: 340 },
};

const CampBuild = memo(({ buildId, label, x, y, mine, onClick }: Props) => {
  const kind = buildById(buildId);
  const art = ART[buildId];
  if (!kind || !art) return null;
  const w = kind.width;
  const h = Math.round((art.h / art.w) * w);

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full"
      style={{ left: x, top: y, zIndex: Math.round(y) - 1, width: w }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={
          onClick
            ? "block w-full cursor-pointer transition-transform hover:-translate-y-1"
            : "block w-full cursor-default"
        }
        aria-label={`${label} — ${kind.name}`}
      >
        <svg
          viewBox={`${-art.w / 2} ${-art.h} ${art.w} ${art.h + 12}`}
          className="w-full drop-shadow-xl"
          style={{ height: h }}
          aria-hidden
        >
          <Art id={buildId} />
        </svg>
      </button>

      <span
        className={`mx-auto mt-1 block w-fit max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-display tracking-wider ${
          mine
            ? "bg-primary/90 text-primary-foreground ring-1 ring-white/40"
            : "bg-slate-950/70 text-slate-100 ring-1 ring-white/20"
        }`}
      >
        {label}
      </span>
    </div>
  );
});

CampBuild.displayName = "CampBuild";

export default CampBuild;
