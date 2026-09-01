/**
 * Turns a profile's free-text country ("Norway", "SE", "Sweden") into a flag
 * emoji. The name→code lookup is built once from the browser's own locale data
 * so we don't have to ship a country table.
 */

let nameToCode: Map<string, string> | null = null;

const buildLookup = () => {
  const map = new Map<string, string>();
  let display: Intl.DisplayNames | null = null;
  try {
    display = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return map;
  }
  const A = 65;
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      const code = String.fromCharCode(A + i) + String.fromCharCode(A + j);
      let name: string | undefined;
      try {
        name = display.of(code);
      } catch {
        continue;
      }
      if (!name || name === code) continue;
      map.set(name.toLowerCase(), code);
    }
  }
  // A few common informal spellings.
  map.set("usa", "US");
  map.set("united states of america", "US");
  map.set("uk", "GB");
  map.set("great britain", "GB");
  map.set("england", "GB");
  map.set("scotland", "GB");
  map.set("wales", "GB");
  map.set("holland", "NL");
  map.set("czechia", "CZ");
  map.set("czech republic", "CZ");
  map.set("south korea", "KR");
  map.set("north korea", "KP");
  map.set("russia", "RU");
  return map;
};

/** ISO 3166-1 alpha-2 code for a country name, or null when unknown. */
export const countryCode = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const value = input.trim();
  if (!value) return null;
  if (/^[A-Za-z]{2}$/.test(value)) return value.toUpperCase();
  if (!nameToCode) nameToCode = buildLookup();
  return nameToCode.get(value.toLowerCase()) ?? null;
};

/** Regional-indicator flag emoji for a country name/code, or null. */
export const countryFlag = (input: string | null | undefined): string | null => {
  const code = countryCode(input);
  if (!code) return null;
  return String.fromCodePoint(
    ...code.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
};
