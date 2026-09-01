import { useEffect, useState } from "react";
import Seo from "@/components/Seo";
import { Link, useNavigate } from "@/lib/router-compat";
import { Link2, Loader2, ShieldCheck, Unlink } from "lucide-react";
import type { UserIdentity } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "@/hooks/use-toast";
import { mergeGoogleAccount } from "@/lib/merge-google-account.functions";
import { useAuth } from "@/hooks/useAuth";

const LinkedAccounts = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [busy, setBusy] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const refresh = async () => {
    const { data } = await supabase.auth.getUserIdentities();
    setIdentities(data?.identities ?? []);
  };

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  const google = identities.find((i) => i.provider === "google");
  const emailIdentity = identities.find((i) => i.provider === "email");

  const handleLink = async () => {
    setBusy(true);
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account/linked` },
    });
    setBusy(false);
    if (error) {
      toast({
        title: "Could not start Google linking",
        description:
          "Direct linking is unavailable on this account. Use the merge option below instead: sign in with Google, then confirm your existing password here.",
        variant: "destructive",
      });
    }
  };

  const handleUnlink = async () => {
    if (!google) return;
    if (!emailIdentity) {
      toast({
        title: "Cannot unlink",
        description: "Google is the only way into this account. Set a password first.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.unlinkIdentity(google);
    setBusy(false);
    if (error) {
      toast({ title: "Could not unlink Google", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Google disconnected" });
    refresh();
  };

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    let data: { merged?: boolean; message?: string; email?: string; error?: string } | null = null;
    try {
      data = await mergeGoogleAccount({ data: { identifier: identifier.trim(), password } });
    } catch {
      data = null;
    }
    setBusy(false);
    if (!data || data.error) {
      toast({
        title: "Merge failed",
        description: data?.error ?? "Check the username and password of your existing account.",
        variant: "destructive",
      });
      return;
    }
    setPassword("");
    if (data?.merged === false) {
      toast({ title: "Already connected", description: data.message });
      return;
    }
    toast({
      title: "Accounts merged",
      description: "Everything now lives on your original account. Sign in again with Google.",
    });
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/account/linked`,
    });
    if (result.error) {
      setBusy(false);
      toast({ title: "Google sign-in failed", description: String(result.error), variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    setBusy(false);
    refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Linked Accounts — Ticklelist"
        description="Connect or merge your Google sign-in with your Ticklelist account."
        noindex
      />
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-28 pb-20 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl tracking-wider">Linked accounts</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="text-foreground">{user?.email}</span>
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Google</p>
              <p className="text-sm text-muted-foreground">
                {google ? `Connected as ${google.identity_data?.["email"] ?? "your Google account"}` : "Not connected"}
              </p>
            </div>
            {google ? (
              <Button variant="outline" onClick={handleUnlink} disabled={busy}>
                <Unlink className="w-4 h-4 mr-2" /> Disconnect
              </Button>
            ) : (
              <Button onClick={handleLink} disabled={busy}>Connect Google</Button>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                {emailIdentity ? "Enabled" : "Not set"}
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/account/password">Change</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="font-medium">Ended up with two accounts?</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            If Google created a separate account, sign in with Google, then confirm your original
            login below. Your ascents, adventures, sign-ups and follows move across, the duplicate is
            removed, and Google sign-in will land on your original account from then on.
          </p>

          {!google && (
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={busy}>
              Sign in with Google first
            </Button>
          )}

          <form onSubmit={handleMerge} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merge-id">Original username or email</Label>
              <Input
                id="merge-id"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="onsightmartin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merge-pw">Original password</Label>
              <Input
                id="merge-pw"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !google}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Merge into my original account
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default LinkedAccounts;
