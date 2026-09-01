/**
 * URL-safe slug helpers for country highpoint pages.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findCountryBySlug(slug: string, countries: { country: string }[]): string | null {
  const target = slug.toLowerCase();
  const match = countries.find((c) => slugify(c.country) === target);
  return match?.country ?? null;
}
