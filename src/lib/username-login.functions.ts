import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

interface UsernameLoginInput {
  identifier: string;
  password: string;
}

export interface UsernameLoginResult {
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

/**
 * Signs a member in with either a username or an email address.
 * The username -> email lookup happens server side with the service role so
 * member email addresses are never exposed to the browser.
 */
export const usernameLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): UsernameLoginInput => {
    const body = (input ?? {}) as Record<string, unknown>;
    if (typeof body["identifier"] !== "string" || typeof body["password"] !== "string") {
      throw new Error("Missing credentials");
    }
    return { identifier: body["identifier"], password: body["password"] };
  })
  .handler(async ({ data }): Promise<UsernameLoginResult> => {
    try {
      const id = data.identifier.trim();
      const password = data.password;
      if (id.length < 1 || id.length > 255 || password.length < 1 || password.length > 200) {
        return { error: "Invalid credentials" };
      }

      const url = process.env["SUPABASE_URL"]!;
      const anonKey = (process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"])!;
      const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;

      let email = id;

      if (!id.includes("@")) {
        const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
        const { data: profile } = await admin
          .from("profiles")
          .select("id")
          .ilike("username", id)
          .maybeSingle();

        if (!profile) return { error: "Invalid username or password" };

        const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
        if (!authUser?.user?.email) return { error: "Invalid username or password" };
        email = authUser.user.email;
      }

      const anon = createClient(url, anonKey, { auth: { persistSession: false } });
      const { data: signIn, error } = await anon.auth.signInWithPassword({ email, password });

      if (error || !signIn.session) {
        return { error: "Invalid username or password" };
      }

      return {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      };
    } catch (_e) {
      return { error: "Sign-in failed" };
    }
  });
