import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

interface MergeInput {
  identifier: string;
  password: string;
}

export interface MergeResult {
  merged?: boolean;
  message?: string;
  email?: string;
  moved?: Record<string, number>;
  error?: string;
}

/**
 * Merges a Google-created account into an existing password account.
 *
 * The caller must be signed in with Google (JWT in the Authorization header)
 * AND prove ownership of the target account with its username/email + password.
 */
export const mergeGoogleAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): MergeInput => {
    const body = (input ?? {}) as Record<string, unknown>;
    return {
      identifier: typeof body["identifier"] === "string" ? body["identifier"].trim() : "",
      password: typeof body["password"] === "string" ? body["password"] : "",
    };
  })
  .handler(async ({ data }): Promise<MergeResult> => {
    try {
      const url = process.env["SUPABASE_URL"]!;
      const anonKey = (process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"])!;
      const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;

      const token = (getRequestHeader("Authorization") ?? "").replace("Bearer ", "");
      if (!token) return { error: "Not signed in" };

      const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

      const { data: caller } = await admin.auth.getUser(token);
      const callerUser = caller?.user;
      if (!callerUser) return { error: "Not signed in" };

      const { identifier, password } = data;
      if (!identifier || identifier.length > 255 || !password || password.length > 200) {
        return { error: "Enter the username/email and password of your existing account" };
      }

      const googleEmail = callerUser.email;
      const hasGoogle = (callerUser.identities ?? []).some((i) => i.provider === "google");
      if (!hasGoogle || !googleEmail) {
        return { error: "Sign in with Google first, then merge." };
      }

      // Resolve username -> email server side so member emails stay private.
      let primaryEmail = identifier;
      if (!identifier.includes("@")) {
        const { data: profile } = await admin
          .from("profiles")
          .select("id")
          .ilike("username", identifier)
          .maybeSingle();
        if (!profile) return { error: "Invalid username or password" };
        const { data: target } = await admin.auth.admin.getUserById(profile.id);
        if (!target?.user?.email) return { error: "Invalid username or password" };
        primaryEmail = target.user.email;
      }

      // Proof of ownership of the account we are merging into.
      const anon = createClient(url, anonKey, { auth: { persistSession: false } });
      const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
        email: primaryEmail,
        password,
      });
      if (signInError || !signIn.user) return { error: "Invalid username or password" };

      const primaryId = signIn.user.id;
      if (primaryId === callerUser.id) {
        return { merged: false, message: "Google is already connected to this account." };
      }

      // Move everything the duplicate created over to the primary account.
      const moves: Array<[string, string]> = [
        ["ascents", "user_id"],
        ["adventures", "creator_id"],
        ["adventure_signups", "user_id"],
        ["follows", "follower_id"],
        ["follows", "following_id"],
      ];
      const moved: Record<string, number> = {};
      for (const [table, column] of moves) {
        const { data: rows, error } = await admin
          .from(table)
          .update({ [column]: primaryId })
          .eq(column, callerUser.id)
          .select("id");
        if (error) {
          // Unique-constraint clashes (already following, already signed up) are fine to skip.
          console.error(`merge ${table}.${column} failed: ${error.message}`);
          continue;
        }
        moved[`${table}.${column}`] = rows?.length ?? 0;
      }

      // Point the primary account at the Google address so Google sign-in
      // resolves to it from now on (matching verified emails auto-link).
      const { error: emailError } = await admin.auth.admin.updateUserById(primaryId, {
        email: googleEmail,
        email_confirm: true,
      });
      if (emailError) {
        console.error(`could not move email to primary account: ${emailError.message}`);
        return { error: "Could not complete the merge. Nothing was deleted." };
      }

      const { error: deleteError } = await admin.auth.admin.deleteUser(callerUser.id);
      if (deleteError) console.error(`could not delete duplicate account: ${deleteError.message}`);

      return { merged: true, email: googleEmail, moved };
    } catch (e) {
      console.error("merge-google-account failed", e);
      return { error: "Merge failed" };
    }
  });
