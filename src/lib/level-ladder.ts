/**
 * Endless level ladder. The curated titles cover the first stretch; past the
 * last rung levels keep coming forever, each one costing a bit more than the
 * last. Nobody ever hits a ceiling.
 */

export interface LadderLevel {
  level: number;
  title: string;
  min: number;
}

/** Each level past the table costs this much more than the previous one. */
const GROWTH = 1.12;

const ROMAN: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

export const roman = (n: number): string => {
  let out = "";
  let left = n;
  for (const [value, sym] of ROMAN) {
    while (left >= value) {
      out += sym;
      left -= value;
    }
  }
  return out;
};

const step = (span: number) => Math.max(50, Math.round((span * GROWTH) / 50) * 50);

/**
 * Resolve the level for an XP total, extending the ladder indefinitely beyond
 * the curated titles. Always returns a `next` level — there is no cap.
 */
export const resolveLevel = <T extends LadderLevel>(
  table: T[],
  total: number,
): { level: LadderLevel; next: LadderLevel } => {
  const last = table[table.length - 1]!;
  const prev = table[table.length - 2] ?? { min: 0 };

  if (total < last.min) {
    let level: LadderLevel = table[0]!;
    for (const l of table) if (total >= l.min) level = l;
    const next = table.find((l) => l.min > total)!;
    return { level, next };
  }

  const extended = (n: number, min: number): LadderLevel => ({
    level: n,
    title: `${last.title} ${roman(n - last.level + 1)}`,
    min,
  });

  let n = last.level;
  let min = last.min;
  let span = Math.max(50, last.min - prev.min);

  for (;;) {
    const nextSpan = step(span);
    const nextMin = min + nextSpan;
    if (total < nextMin) {
      const level: LadderLevel = n === last.level ? last : extended(n, min);
      return { level, next: extended(n + 1, nextMin) };
    }
    min = nextMin;
    span = nextSpan;
    n += 1;
  }
};
