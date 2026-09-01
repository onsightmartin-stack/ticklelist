import { useEffect, useState } from "react";
import Seo from "@/components/Seo";
import { Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BORDERS, COASTS, SEAS, RANGES, CAPITALS, CITIES, COUNTRIES, type LL } from "@/lib/map-geo";

const PASSWORD = "keepithiddenkeepitsafe";
const STORAGE_KEY = "balkan-route-unlocked";

const BalkanRoute = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  return (
    <>
      <Seo
        title="Balkan High Point Route — Kraków to Olympus"
        description="A fuel-efficient driving order for the Ukraine, Moldova and Balkan country high points, from Kraków to Mount Olympus."
        noindex
      />
      <Navbar />
      <div className="pt-16">
        {unlocked ? (
          <RoutePlanContent />
        ) : (
          <main className="min-h-screen bg-background flex items-center justify-center px-4">
            <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-primary">
                <Lock className="h-4 w-4" />
                <h1 className="font-display text-lg tracking-wider text-foreground">Protected route plan</h1>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter the password to view the Balkan high point route.
              </p>
              <Input
                type="password"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(false);
                }}
                placeholder="Password"
                aria-label="Password"
                className="mt-4"
                autoFocus
              />
              {error && <p className="mt-2 text-sm text-destructive">Wrong password.</p>}
              <Button type="submit" className="mt-4 w-full">
                Unlock
              </Button>
            </form>
          </main>
        )}
      </div>
    </>
  );
};

export default BalkanRoute;

type Stop = {
  n: number;
  peak: string;
  country: string;
  code: string;
  elev: string;
  lat: number;
  lon: number;
  leg: number | null;
};

const STOPS: Stop[] = [
  { n: 0, peak: "Kraków (start)", country: "Poland", code: "PL", elev: "—", lat: 50.06, lon: 19.94, leg: null },
  { n: 1, peak: "Hoverla", country: "Ukraine", code: "UA", elev: "2 061 m", lat: 48.16, lon: 24.5, leg: 480 },
  { n: 2, peak: "Bălănești Hill", country: "Moldova", code: "MD", elev: "430 m", lat: 47.3, lon: 28.41, leg: 460 },
  { n: 3, peak: "Moldoveanu", country: "Romania", code: "RO", elev: "2 544 m", lat: 45.6, lon: 24.74, leg: 620 },
  { n: 4, peak: "Midžor", country: "Serbia", code: "RS", elev: "2 169 m", lat: 43.4, lon: 22.67, leg: 500 },
  { n: 5, peak: "Maglić", country: "Bosnia & Herz.", code: "BA", elev: "2 386 m", lat: 43.28, lon: 18.7, leg: 520 },
  { n: 6, peak: "Bobotov Kuk", country: "Montenegro (Durmitor)", code: "ME", elev: "2 523 m", lat: 43.13, lon: 19.03, leg: 90 },
  { n: 7, peak: "Zla Kolata", country: "Montenegro", code: "ME", elev: "2 534 m", lat: 42.47, lon: 19.85, leg: 150 },
  { n: 8, peak: "Gjeravica", country: "Kosovo", code: "XK", elev: "2 656 m", lat: 42.54, lon: 20.28, leg: 120 },
  { n: 9, peak: "Golem Korab", country: "Albania / N. Macedonia", code: "AL+MK", elev: "2 764 m", lat: 41.79, lon: 20.55, leg: 180 },
  { n: 10, peak: "Rudoka e Madhe", country: "N. Macedonia / Kosovo (Šar)", code: "MK+XK", elev: "2 658 m", lat: 42.05, lon: 20.83, leg: 110 },
  { n: 11, peak: "Musala", country: "Bulgaria", code: "BG", elev: "2 925 m", lat: 42.18, lon: 23.59, leg: 330 },
  { n: 12, peak: "Mount Olympus", country: "Greece", code: "GR", elev: "2 918 m", lat: 40.09, lon: 22.36, leg: 380 },
];

const TOTAL = STOPS.reduce((s, p) => s + (p.leg ?? 0), 0);

type Anchor = "start" | "end" | "middle";
const LABELS: Record<number, { dx: number; dy: number; anchor: Anchor }> = {
  0: { dx: 18, dy: -6, anchor: "start" },
  1: { dx: 18, dy: 0, anchor: "start" },
  2: { dx: -20, dy: 0, anchor: "end" },
  3: { dx: -20, dy: 0, anchor: "end" },
  4: { dx: -20, dy: 0, anchor: "end" },
  5: { dx: -18, dy: -6, anchor: "end" },
  6: { dx: 16, dy: -30, anchor: "start" },
  7: { dx: -16, dy: 26, anchor: "end" },
  8: { dx: -18, dy: -14, anchor: "end" },
  9: { dx: 16, dy: 22, anchor: "start" },
  10: { dx: 16, dy: -14, anchor: "start" },
  11: { dx: 18, dy: 0, anchor: "start" },
  12: { dx: -20, dy: 0, anchor: "end" },
};



// Equirectangular projection tuned to the corridor
const W = 900;
const LON0 = 16.0;
const LON1 = 31.0;
const LAT0 = 37.5;
const LAT1 = 52.4;
const K = Math.cos((45 * Math.PI) / 180);
const H = Math.round((W * ((LAT1 - LAT0) / K)) / (LON1 - LON0));

function px(lon: number) {
  return ((lon - LON0) / (LON1 - LON0)) * W;
}
function py(lat: number) {
  return H - ((lat - LAT0) / (LAT1 - LAT0)) * H;
}
function line(pts: LL[]) {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${px(p[0]).toFixed(1)} ${py(p[1]).toFixed(1)}`).join(" ");
}
function poly(pts: LL[]) {
  return pts.map((p) => `${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(" ");
}

function RoutePlanContent() {
  const pts = STOPS.map((s) => ({ ...s, x: px(s.lon), y: py(s.lat) }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <main className="min-h-screen bg-background px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-border pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            Single sweep · Croatia omitted
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl">
            Twelve high points,
            <br />
            <span className="text-primary">Kraków to Olympus</span>
          </h1>
          <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat label="Summits" value="12" />
            <Stat label="Countries" value="11" />
            <Stat label="Driving" value={`~${TOTAL.toLocaleString()} km`} />
            <Stat label="Backtracking" value="None" />
          </dl>
        </header>

        <section className="mt-10 overflow-hidden rounded-xl border border-border bg-card">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Map of the high point driving route from Poland to Greece, with country borders, capitals, mountain ranges and seas">
            <defs>
              <pattern id="grid" width="45" height="45" patternUnits="userSpaceOnUse">
                <path d="M45 0 L0 0 0 45" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="hsl(var(--card))" />
            <rect width={W} height={H} fill="url(#grid)" />

            {/* Seas */}
            {SEAS.map((s) => (
              <polygon key={s.name} points={poly(s.poly)} fill="hsl(var(--muted))" opacity="0.7" />
            ))}
            {SEAS.map((s) => (
              <text
                key={`l-${s.name}`}
                x={px(s.label[0])}
                y={py(s.label[1])}
                transform={s.rot ? `rotate(${s.rot} ${px(s.label[0])} ${py(s.label[1])})` : undefined}
                textAnchor="middle"
                fontSize="13"
                fontStyle="italic"
                letterSpacing="1.5"
                fill="hsl(var(--muted-foreground))"
              >
                {s.name}
              </text>
            ))}

            {/* Coastlines */}
            {COASTS.map((c, i) => (
              <path key={`c-${i}`} d={line(c)} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.6" opacity="0.7" />
            ))}

            {/* Country borders */}
            {BORDERS.map((b, i) => (
              <path
                key={`b-${i}`}
                d={line(b)}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.1"
                strokeDasharray="5 4"
                opacity="0.65"
              />
            ))}

            {/* Country names */}
            {COUNTRIES.map((c) => (
              <text
                key={c.name}
                x={px(c.at[0])}
                y={py(c.at[1])}
                textAnchor="middle"
                fontSize="11"
                letterSpacing="2.5"
                fill="hsl(var(--muted-foreground))"
                opacity="0.85"
              >
                {c.name}
              </text>
            ))}

            {/* Mountain ranges */}
            {RANGES.map((r) => {
              const x = px(r.at[0]);
              const y = py(r.at[1]);
              return (
                <text
                  key={r.name}
                  x={x}
                  y={y}
                  transform={`rotate(${r.rot} ${x} ${y})`}
                  textAnchor="middle"
                  fontSize="11"
                  fontStyle="italic"
                  letterSpacing="1.2"
                  fill="hsl(var(--foreground))"
                  opacity="0.55"
                >
                  ▲ {r.name}
                </text>
              );
            })}

            {/* Capitals */}
            {CAPITALS.map((c) => {
              const x = px(c.at[0]);
              const y = py(c.at[1]);
              return (
                <g key={c.name}>
                  <rect x={x - 3.5} y={y - 3.5} width="7" height="7" fill="hsl(var(--foreground))" opacity="0.8" />
                  <text
                    x={x + (c.dx ?? 8)}
                    y={y + (c.dy ?? 4)}
                    textAnchor={c.anchor ?? "start"}
                    fontSize="12"
                    fill="hsl(var(--foreground))"
                    opacity="0.8"
                  >
                    {c.name}
                  </text>
                </g>
              );
            })}

            {/* Other cities */}
            {CITIES.map((c) => {
              const x = px(c.at[0]);
              const y = py(c.at[1]);
              return (
                <g key={c.name}>
                  <circle cx={x} cy={y} r="3" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.75" />
                  <text
                    x={x + (c.dx ?? 8)}
                    y={y + 4}
                    textAnchor={c.anchor ?? "start"}
                    fontSize="12"
                    fill="hsl(var(--foreground))"
                    opacity="0.75"
                  >
                    {c.name}
                  </text>
                </g>
              );
            })}

            <path
              d={path}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="1 0"
              opacity="0.85"
            />

            {pts.map((p) => {
              const L = LABELS[p.n] ?? { dx: 18, dy: 0, anchor: "start" as const };
              return (
                <g key={p.n}>
                  <circle cx={p.x} cy={p.y} r={p.n === 0 ? 9 : 11} fill="hsl(var(--primary))" />
                  <text
                    x={p.x}
                    y={p.y + 4}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="hsl(var(--primary-foreground))"
                  >
                    {p.n === 0 ? "S" : p.n}
                  </text>
                  <text
                    x={p.x + L.dx}
                    y={p.y + L.dy - 2}
                    textAnchor={L.anchor}
                    fontSize="15"
                    fontWeight="600"
                    fill="hsl(var(--foreground))"
                    stroke="hsl(var(--card))"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    {p.peak}
                  </text>
                  <text
                    x={p.x + L.dx}
                    y={p.y + L.dy + 15}
                    textAnchor={L.anchor}
                    fontSize="12"
                    fill="hsl(var(--muted-foreground))"
                    fontFamily="ui-monospace, monospace"
                    stroke="hsl(var(--card))"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    {p.n === 0 ? "PL · start" : `${p.code} · ${p.elev}`}
                  </text>
                </g>
              );
            })}

          </svg>
        </section>

        <section className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          <span>■ Capital city</span>
          <span>○ Other city</span>
          <span>▲ Mountain range</span>
          <span>— — Country border</span>
          <span className="text-primary">— Driving route</span>
        </section>


        <section className="mt-12">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            Order of travel
          </h2>
          <ol className="mt-6 divide-y divide-border border-y border-border">
            {STOPS.map((s) => (
              <li key={s.n} className="flex items-baseline gap-4 py-4 sm:gap-6">
                <span className="w-8 shrink-0 font-mono text-sm text-muted-foreground">
                  {s.n === 0 ? "—" : String(s.n).padStart(2, "0")}
                </span>
                <span className="flex-1">
                  <span className="text-base font-medium text-foreground">{s.peak}</span>{" "}
                  <span className="text-sm text-muted-foreground">— {s.country}</span>
                </span>
                <span className="hidden w-24 shrink-0 text-right font-mono text-sm text-muted-foreground sm:block">
                  {s.elev}
                </span>
                <span className="w-20 shrink-0 text-right font-mono text-sm text-foreground">
                  {s.leg ? `${s.leg} km` : "start"}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12 grid gap-6 sm:grid-cols-2">
          <Note title="Why this order">
            The route is one continuous arc: east to the Carpathians and Moldova, back west along the
            Danube into Serbia, a westward loop through Bosnia, Montenegro, Kosovo and Korab, then east
            to Musala and finally south to Olympus. No leg is ever retraced.
          </Note>
          <Note title="The one trade-off">
            Bălănești Hill sits far east and Maglić far west, so the Romania leg is unavoidably long.
            Doing Bulgaria early would force a second crossing of the Balkan range — costing roughly
            600 km more fuel than taking Musala on the way down to Greece.
          </Note>
          <Note title="Croatia skipped">
            Dinara is omitted as requested, which also keeps the loop inland and away from the coastal
            detour. Slovenia's Triglav is left out too — reaching it without Croatia means a long
            Hungarian bypass.
          </Note>
          <Note title="The two extra summits">
            Bobotov Kuk slots in between Maglić and Zla Kolata — Durmitor is almost exactly on that
            line, so it adds only ~90 km. Rudoka e Madhe sits in the Šar range between Korab and the
            road east to Musala, another near-free ~110 km detour.
          </Note>
          <Note title="Two summits, one stop">
            Golem Korab is the high point of both Albania and North Macedonia, so stop 9 banks two
            countries for a single approach.
          </Note>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</dd>
    </div>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
