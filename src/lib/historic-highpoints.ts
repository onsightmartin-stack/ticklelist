/**
 * Historic country high points — summits that WERE the highest point of a
 * country until a documented date, and were then overtaken (glacier melt,
 * resurvey, border change).
 *
 * Rule on Ticklelist: an ascent of a historic high point counts as that
 * country's high point **only if it was climbed on or before `heldUntil`**.
 * Later ascents are still logged and still earn XP, they just don't tick the
 * country off the high-point lists — the current summit does.
 */
export interface HistoricHighpoint {
  country: string;
  /** Canonical name used in the peak catalog. */
  peak: string;
  /** Other spellings people may have logged it under. */
  aliases: string[];
  elevation: string;
  elevationM: number;
  /** Last date on which this summit counted as the country high point (ISO). */
  heldUntil: string;
  /** Peak that took over as the country high point. */
  supersededBy: string;
  coordinates: { lat: number; lng: number };
  note: string;
}

export const historicHighpoints: HistoricHighpoint[] = [
  {
    country: "Sweden",
    peak: "Kebnekaise Sydtoppen",
    aliases: [
      "Kebnekaise - Sydtoppen",
      "Kebnekaise (Sydtoppen)",
      "Kebnekaise South Peak",
      "Sydtoppen",
    ],
    elevation: "2,097 m",
    elevationM: 2097,
    heldUntil: "2018-08-05",
    supersededBy: "Kebnekaise (Nordtoppen)",
    coordinates: { lat: 67.901, lng: 18.5169 },
    note:
      "Sweden's highest point until 5 August 2018, when Stockholm University's Tarfala researchers measured the glacier-capped Sydtoppen at 2,096.5 m — 0.3 m below the bedrock Nordtoppen (2,096.8 m). It melted ~14 cm per day that July and has stayed lower every year since. Ascents on or before 5 August 2018 count as the high point of Sweden; later ones are logged as an ascent of the south summit only.",
  },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const byName = new Map<string, HistoricHighpoint>();
for (const h of historicHighpoints) {
  byName.set(norm(h.peak), h);
  h.aliases.forEach((a) => byName.set(norm(a), h));
}

/** Historic-high-point record for a logged peak name, if any. */
export const historicHighpointFor = (
  peakName: string | null | undefined,
  country?: string | null,
): HistoricHighpoint | null => {
  if (!peakName) return null;
  const hit = byName.get(norm(peakName));
  if (!hit) return null;
  if (country && norm(country) !== norm(hit.country)) return null;
  return hit;
};

interface AscentLike {
  peak_type: string;
  peak_name: string;
  country?: string | null;
  ascent_date?: string | null;
}

/**
 * Does this ascent tick the country high point? Historic high points only do
 * so when climbed on or before the date they lost the title.
 */
export const countsAsCountryHighpoint = (a: AscentLike): boolean => {
  if (a.peak_type !== "country_highpoint") return false;
  const historic = historicHighpointFor(a.peak_name, a.country);
  if (!historic) return true;
  return Boolean(a.ascent_date) && a.ascent_date! <= historic.heldUntil;
};

/** Catalog key an ascent should credit — `hp:Country` or `fp:Peak`. */
export const highpointCreditKey = (a: AscentLike): string =>
  countsAsCountryHighpoint(a) ? `hp:${a.country ?? a.peak_name}` : `fp:${a.peak_name}`;
