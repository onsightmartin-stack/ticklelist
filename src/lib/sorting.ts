import type { SortOption } from "@/components/community/SortSelect";
import { xpForAscent } from "@/lib/xp";

/** Sort keys shared by every ascent list on the site. */
export const ascentSortOptions: SortOption[] = [
  { value: "date_desc", label: "Latest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "elev_desc", label: "Highest first" },
  { value: "elev_asc", label: "Lowest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "country_asc", label: "Country A–Z" },
  { value: "xp_desc", label: "Most XP" },
];

export const visitSortOptions: SortOption[] = [
  { value: "date_desc", label: "Latest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "country_asc", label: "Country A–Z" },
  { value: "type_asc", label: "Place type" },
];

export const listSortOptions: SortOption[] = [
  { value: "pct_desc", label: "Most complete" },
  { value: "pct_asc", label: "Least complete" },
  { value: "done_desc", label: "Most ticked" },
  { value: "size_desc", label: "Biggest list" },
  { value: "size_asc", label: "Smallest list" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "category_asc", label: "Category" },
];

export const adventureSortOptions: SortOption[] = [
  { value: "date_asc", label: "Soonest first" },
  { value: "date_desc", label: "Latest first" },
  { value: "name_asc", label: "Peak A–Z" },
  { value: "country_asc", label: "Country A–Z" },
  { value: "elev_desc", label: "Highest first" },
  { value: "created_desc", label: "Newest posted" },
];

const text = (v: unknown) => (typeof v === "string" ? v : "");
const cmpText = (a: unknown, b: unknown) =>
  text(a).localeCompare(text(b), undefined, { sensitivity: "base" });
const time = (d: unknown) => {
  const t = Date.parse(text(d));
  return Number.isNaN(t) ? 0 : t;
};
const num = (v: unknown) =>
  typeof v === "number" ? v : parseInt(String(v ?? "").replace(/[^0-9.-]/g, ""), 10) || 0;

interface AscentLike {
  peak_name: string;
  country?: string | null;
  elevation?: string | number | null;
  ascent_date?: string | null;
}

export function sortAscents<T extends AscentLike>(items: T[], key: string): T[] {
  const out = [...items];
  out.sort((a, b) => {
    switch (key) {
      case "date_asc":
        return time(a.ascent_date) - time(b.ascent_date);
      case "elev_desc":
        return num(b.elevation) - num(a.elevation);
      case "elev_asc":
        return num(a.elevation) - num(b.elevation);
      case "name_asc":
        return cmpText(a.peak_name, b.peak_name);
      case "name_desc":
        return cmpText(b.peak_name, a.peak_name);
      case "country_asc":
        return cmpText(a.country, b.country) || cmpText(a.peak_name, b.peak_name);
      case "xp_desc":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return xpForAscent(b as any).xp - xpForAscent(a as any).xp;
      default:
        return time(b.ascent_date) - time(a.ascent_date);
    }
  });
  return out;
}

interface VisitLike {
  place_name: string;
  country?: string | null;
  place_type?: string | null;
  visit_date?: string | null;
}

export function sortVisits<T extends VisitLike>(items: T[], key: string): T[] {
  const out = [...items];
  out.sort((a, b) => {
    switch (key) {
      case "date_asc":
        return time(a.visit_date) - time(b.visit_date);
      case "name_asc":
        return cmpText(a.place_name, b.place_name);
      case "name_desc":
        return cmpText(b.place_name, a.place_name);
      case "country_asc":
        return cmpText(a.country, b.country) || cmpText(a.place_name, b.place_name);
      case "type_asc":
        return cmpText(a.place_type, b.place_type) || cmpText(a.place_name, b.place_name);
      default:
        return time(b.visit_date) - time(a.visit_date);
    }
  });
  return out;
}

interface ListProgressLike {
  list: { name: string; category: string };
  done: number;
  total: number;
  pct: number;
}

export function sortListProgress<T extends ListProgressLike>(items: T[], key: string): T[] {
  const out = [...items];
  out.sort((a, b) => {
    switch (key) {
      case "pct_asc":
        return a.pct - b.pct || a.done - b.done;
      case "done_desc":
        return b.done - a.done || b.pct - a.pct;
      case "size_desc":
        return b.total - a.total;
      case "size_asc":
        return a.total - b.total;
      case "name_asc":
        return cmpText(a.list.name, b.list.name);
      case "category_asc":
        return cmpText(a.list.category, b.list.category) || cmpText(a.list.name, b.list.name);
      default:
        return b.pct - a.pct || b.done - a.done;
    }
  });
  return out;
}

interface AdventureLike {
  peak_name?: string | null;
  country?: string | null;
  elevation?: string | number | null;
  target_date?: string | null;
  target_year?: number | null;
  created_at?: string | null;
}

const advTime = (a: AdventureLike) =>
  a.target_date ? time(a.target_date) : a.target_year ? Date.UTC(a.target_year, 0, 1) : 0;
const advElev = (a: AdventureLike) => parseInt(String(a.elevation ?? "").replace(/[^0-9]/g, ""), 10) || 0;

export function sortAdventures<T extends AdventureLike>(items: T[], key: string): T[] {
  const out = [...items];
  out.sort((a, b) => {
    switch (key) {
      case "date_desc":
        return advTime(b) - advTime(a);
      case "name_asc":
        return cmpText(a.peak_name, b.peak_name);
      case "country_asc":
        return cmpText(a.country, b.country) || cmpText(a.peak_name, b.peak_name);
      case "elev_desc":
        return advElev(b) - advElev(a);
      case "created_desc":
        return time(b.created_at) - time(a.created_at);
      default:
        return advTime(a) - advTime(b);
    }
  });
  return out;
}
