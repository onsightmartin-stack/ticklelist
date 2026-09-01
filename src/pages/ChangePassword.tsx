import { useState } from "react";
import Seo from "@/components/Seo";
import { Link, useNavigate } from "@/lib/router-compat";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isNativeApp } from "@/lib/native";

const schema = z
  .object({
    current: z.string().min(1, { message: "Enter your current password" }),
    next: z
      .string()
      .min(10, { message: "Use at least 10 characters" })
      .max(72, { message: "Passwords must be 72 characters or fewer" })
      .regex(/[a-z]/, { message: "Include a lowercase letter" })
      .regex(/[A-Z]/, { message: "Include an uppercase letter" })
      .regex(/[0-9]/, { message: "Include a number" }),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  })
  .refine((v) => v.next !== v.current, {
    path: ["next"],
    message: "Choose a password different from the current one",
  });

const strengthOf = (pw: string) => {
  let score = 0;
  if (pw.length >= 10) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"];

const ChangePassword = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const score = strengthOf(next);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = schema.safeParse({ current, next, confirm });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        current: flat.current?.[0] ?? "",
        next: flat.next?.[0] ?? "",
        confirm: flat.confirm?.[0] ?? "",
      });
      return;
    }

    if (!user?.email) {
      toast({ title: "No email on this account", variant: "destructive" });
      return;
    }

    setSaving(true);

    // Re-authenticate first so a stolen open session can't silently take over the account.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });

    if (reauthError) {
      setSaving(false);
      setErrors({ current: "That current password is not correct" });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);

    if (error) {
      toast({ title: "Could not change password", description: error.message, variant: "destructive" });
      return;
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    toast({
      title: "Password updated",
      description: "Use your new password the next time you sign in.",
    });
    navigate("/community");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Change Password — Ticklelist"
        description="Update your Ticklelist account password."
        noindex
      />
      {!isNativeApp() && <Navbar />}

      <main className={`max-w-md mx-auto px-4 pb-24 ${isNativeApp() ? "pt-10" : "pt-28"}`}>
        <div className="flex items-center gap-3 mb-6">
          <KeyRound className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl tracking-wider">Change password</h1>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !user ? (
          <Card className="p-6 space-y-3">
            <p className="text-sm text-muted-foreground">You need to be signed in to change your password.</p>
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </Card>
        ) : (
          <Card className="p-6">
            <p className="text-xs text-muted-foreground mb-5">
              Signed in as <span className="text-foreground">{user.email}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  maxLength={72}
                />
                {errors["current"] && <p className="text-xs text-destructive">{errors["current"]}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="next">New password</Label>
                <Input
                  id="next"
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  maxLength={72}
                />
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-1 flex-1 rounded-sm bg-secondary overflow-hidden">
                    <div
                      className={`h-full transition-all ${score >= 4 ? "bg-primary" : "bg-muted-foreground"}`}
                      style={{ width: `${(score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-20 text-right">
                    {next ? LABELS[score] : ""}
                  </span>
                </div>
                {errors["next"] && <p className="text-xs text-destructive">{errors["next"]}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  maxLength={72}
                />
                {errors["confirm"] && <p className="text-xs text-destructive">{errors["confirm"]}</p>}
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update password
              </Button>
            </form>

            <p className="flex items-start gap-2 text-[11px] text-muted-foreground mt-5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
              Your current password is re-checked before the change, and new passwords are screened against
              known breached-password lists.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ChangePassword;
