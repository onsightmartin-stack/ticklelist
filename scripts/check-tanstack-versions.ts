/**
 * Guards against mixed TanStack package versions.
 *
 * A version skew between @tanstack/react-start, @tanstack/react-router and
 * @tanstack/router-plugin previously produced a missing `createMiddleware`
 * export in the SSR bundle and a hard 500 on the live site. Dev, build and
 * install all run this check so it can never ship again.
 *
 * Checks:
 *  1. The core TanStack packages are pinned exactly in package.json (no ^ or ~).
 *  2. bun.lock resolves every @tanstack/* package to a single version
 *     (no duplicate/nested copies).
 *  3. The versions @tanstack/react-start declares for its TanStack deps match
 *     what the lockfile actually resolved.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

/** Packages that MUST be exact-pinned in package.json. */
const PINNED = [
  "@tanstack/react-start",
  "@tanstack/react-router",
  "@tanstack/router-plugin",
] as const;

const errors: string[] = [];

// ---------------------------------------------------------------- package.json
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const declared = { ...pkg.dependencies, ...pkg.devDependencies };

for (const name of PINNED) {
  const range = declared[name];
  if (!range) {
    errors.push(`${name} is missing from package.json`);
    continue;
  }
  if (!/^\d+\.\d+\.\d+/.test(range)) {
    errors.push(
      `${name} must be pinned to an exact version (found "${range}") — ranges let installs drift into a mixed TanStack set.`,
    );
  }
}

// -------------------------------------------------------------------- bun.lock
const lock = readFileSync(resolve(root, "bun.lock"), "utf8");

/** name -> set of resolved versions found anywhere in the lock tree. */
const resolved = new Map<string, Set<string>>();
const entry = /"(?:[^"]*\/)?(@tanstack\/[a-z0-9-]+)":\s*\["\1@([0-9][^"]*)"/g;
for (const m of lock.matchAll(entry)) {
  const [, name, version] = m as unknown as [string, string, string];
  if (!resolved.has(name)) resolved.set(name, new Set());
  resolved.get(name)!.add(version);
}

if (resolved.size === 0) {
  errors.push("bun.lock contains no @tanstack/* entries — lockfile looks stale or unreadable.");
}

for (const [name, versions] of resolved) {
  if (versions.size > 1) {
    errors.push(
      `${name} resolves to multiple versions in bun.lock: ${[...versions].sort().join(", ")}. Run "bun install" after aligning the pins, or dedupe the tree.`,
    );
  }
}

// package.json pin must equal what the lock resolved
for (const name of PINNED) {
  const pin = declared[name];
  const got = resolved.get(name);
  if (!pin || !got) continue;
  if (!got.has(pin)) {
    errors.push(
      `${name} is pinned to ${pin} but bun.lock has ${[...got].join(", ")}. Run "bun install" to refresh the lockfile.`,
    );
  }
}

// -------------------- @tanstack/react-start's own TanStack deps vs the lockfile
const startBlock = lock.match(/"@tanstack\/react-start":\s*\[.*?\],\n/s)?.[0] ?? "";
const depsBlock = startBlock.match(/"dependencies":\s*\{([^}]*)\}/)?.[1] ?? "";
for (const m of depsBlock.matchAll(/"(@tanstack\/[a-z0-9-]+)":\s*"([0-9][^"]*)"/g)) {
  const [, name, want] = m as unknown as [string, string, string];
  const got = resolved.get(name);
  if (got && !got.has(want)) {
    errors.push(
      `@tanstack/react-start expects ${name}@${want} but the lockfile resolved ${[...got].join(", ")} — this is the exact skew that broke SSR before.`,
    );
  }
}

// ----------------------------------------------------------------------- report
if (errors.length > 0) {
  console.error("\n✗ TanStack dependency check failed:\n");
  for (const e of errors) console.error(`  • ${e}`);
  console.error(
    "\nFix by pinning all TanStack packages to a compatible set and re-running bun install.\n",
  );
  process.exit(1);
}

const summary = PINNED.map((n) => `${n.replace("@tanstack/", "")}@${declared[n]}`).join(", ");
console.log(`✓ TanStack versions consistent (${resolved.size} packages, single version each): ${summary}`);
