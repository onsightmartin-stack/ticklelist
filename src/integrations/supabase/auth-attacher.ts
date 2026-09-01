import { createMiddleware } from "@tanstack/react-start";

/**
 * Client-side function middleware that forwards the current Supabase session's
 * access token as an Authorization header on every server-function RPC, so
 * server-side auth checks (merge-google-account, peakbagger-import) can
 * identify the caller. The Supabase client is imported lazily so this module
 * stays side-effect-free on the server/worker.
 */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;
    if (typeof window !== "undefined") {
      try {
        const { supabase } = await import("./client");
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token;
      } catch {
        token = undefined;
      }
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
