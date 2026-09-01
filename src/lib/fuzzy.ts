/**
 * Shared fuzzy matching used across the whole site.
 *
 * Everything is accent-insensitive, case-insensitive and typo tolerant, so
 * "babia gora", "Babià Góra" and "babbia gora" all land on the same result.
 */

export const fuzzyNorm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ø]/gi, "o")
    .replace(/[æ]/gi, "ae")
    .replace(/[ð]/gi, "d")
    .replace(/[ł]/gi, "l")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const levenshtein = (a: string, b: string, max = 3): number => {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(row[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
      row.push(v);
      if (v < best) best = v;
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length]!;
};

const subsequence = (q: string, t: string) => {
  let i = 0;
  for (const ch of t) if (ch === q[i]) i++;
  return i === q.length;
};

/**
 * Score a query against one text field. Lower is better, `Infinity` means no
 * match at all.
 */
export const fuzzyFieldScore = (query: string, text: string): number => {
  const q = fuzzyNorm(query);
  const t = fuzzyNorm(text);
  if (!q) return 0;
  if (!t) return Infinity;

  if (t === q) return 0;
  if (t.startsWith(q)) return 1;
  if (t.includes(q)) return 2;

  const words = t.split(/[\s(),./'-]+/).filter(Boolean);
  if (words.some((w) => w.startsWith(q))) return 3;
  if (q.length >= 3 && subsequence(q, t)) return 4;

  if (q.length >= 4) {
    const d = Math.min(
      levenshtein(q, t.slice(0, q.length + 2)),
      ...words.map((w) => levenshtein(q, w)),
    );
    const allowed = q.length >= 7 ? 3 : 2;
    if (d <= allowed) return 5 + d;
  }
  return Infinity;
};

/** Best (lowest) score across several fields. */
export const fuzzyScore = (query: string, ...fields: (string | null | undefined)[]) =>
  Math.min(...fields.map((f) => (f ? fuzzyFieldScore(query, f) : Infinity)));

/** Boolean helper for simple `.filter()` use. */
export const fuzzyMatch = (query: string, ...fields: (string | null | undefined)[]) =>
  !query.trim() || fuzzyScore(query, ...fields) !== Infinity;

/**
 * Filter + rank a list by fuzzy relevance. Original order is preserved for
 * equally relevant items.
 */
export const fuzzyRank = <T>(
  items: T[],
  query: string,
  fields: (item: T) => (string | null | undefined)[],
): T[] => {
  if (!query.trim()) return items;
  return items
    .map((item, i) => ({ item, i, score: fuzzyScore(query, ...fields(item)) }))
    .filter((r) => r.score !== Infinity)
    .sort((a, b) => a.score - b.score || a.i - b.i)
    .map((r) => r.item);
};
