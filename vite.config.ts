// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// NOTE: vite is pinned to an exact version (8.1.5) on purpose.
// Vite 8.2.x ships a rolldown chunk-splitting bug that produced a broken
// production SSR bundle (circular chunks -> "createMiddleware is not a function",
// and an "Export 'ssr_exports' is not defined in module" worker boot crash),
// making every published request return 500. Do not widen this range without
// verifying `bun run build` + a wrangler run of dist/server.
export default defineConfig({});
