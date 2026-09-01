import type { DatePrecision } from "@/lib/peak-catalog";

export interface DupeCandidate {
  id: string;
  peak_name: string;
  peak_type: string;
  country: string | null;
  ascent_date: string;
  date_precision?: DatePrecision | null;
}

/** The [start, end] day range an ascent covers, given its date precision. */
export const dateWindow = (date: string, precision: DatePrecision | null | undefined) => {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7)) || 1;
  if (precision === "year") return [`${year}-01-01`, `${year}-12-31`] as const;
  if (precision === "month") {
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const mm = String(month).padStart(2, "0");
    return [`${year}-${mm}-01`, `${year}-${mm}-${String(last).padStart(2, "0")}`] as const;
  }
  return [date, date] as const;
};

export const windowsOverlap = (
  a: { date: string; precision: DatePrecision | null | undefined },
  b: { date: string; precision: DatePrecision | null | undefined },
) => {
  const [aStart, aEnd] = dateWindow(a.date, a.precision);
  const [bStart, bEnd] = dateWindow(b.date, b.precision);
  return aStart <= bEnd && bStart <= aEnd;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Finds an existing ascent that clashes with the one being logged:
 * the same peak, or the same country high point, on an overlapping date range.
 */
export const findDuplicateAscent = (
  existing: DupeCandidate[],
  next: {
    id?: string | undefined;
    peak_name: string;
    peak_type: string;
    country: string | null | undefined;
    date: string;
    precision: DatePrecision;
  },
): { match: DupeCandidate; reason: "peak" | "highpoint" } | null => {
  for (const a of existing) {
    if (next.id && a.id === next.id) continue;
    if (!windowsOverlap({ date: a.ascent_date, precision: a.date_precision }, { date: next.date, precision: next.precision }))
      continue;
    const samePeak = norm(a.peak_name) === norm(next.peak_name);
    const sameHighpoint =
      a.peak_type === "country_highpoint" &&
      next.peak_type === "country_highpoint" &&
      !!a.country &&
      !!next.country &&
      norm(a.country) === norm(next.country);
    if (samePeak) return { match: a, reason: "peak" };
    if (sameHighpoint) return { match: a, reason: "highpoint" };
  }
  return null;
};
