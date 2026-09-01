import { useEffect, useState } from "react";
import Seo from "@/components/Seo";
import { useNavigate, Link } from "@/lib/router-compat";
import { Mountain, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { POST_AUTH_KEY } from "@/components/PostAuthRedirect";
import { toast } from "@/hooks/use-toast";
import { usernameLogin } from "@/lib/username-login.functions";
import {
  setRememberMe,
  rememberMeDefault,
  rememberIdentifier,
  getLastIdentifier,
  signInLockoutRemaining,
  recordFailedSignIn,
  clearSignInAttempts,
  formatDuration,
} from "@/lib/session-policy";

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [remember, setRemember] = useState(false);

  // Browser-only: prefill the remembered identifier and default the checkbox
  // to on for desktop browsers so returning users stay signed in.
  useEffect(() => {
    setRemember(rememberMeDefault());
    const last = getLastIdentifier();
    if (last) setIdentifier(last);
  }, []);


  const failSignIn = (description: string) => {
    const { remaining, lockedMs } = recordFailedSignIn();
    setBusy(false);
    if (lockedMs) {
      toast({
        title: "Too many attempts",
        description: `Sign-in is locked for ${formatDuration(lockedMs)}.`,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Could not sign in",
      description: `${description} ${remaining} attempt${remaining === 1 ? "" : "s"} left before a temporary lock.`,
      variant: "destructive",
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const locked = signInLockoutRemaining();
    if (locked > 0) {
      toast({
        title: "Too many attempts",
        description: `Try again in ${formatDuration(locked)}.`,
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    setRememberMe(remember);
    const id = identifier.trim();

    if (id.includes("@")) {
      const { error } = await supabase.auth.signInWithPassword({ email: id, password });
      if (error) {
        failSignIn(error.message);
        return;
      }
      clearSignInAttempts();
      rememberIdentifier(id);
      setBusy(false);

      navigate("/community");
      return;
    }

    // Username sign-in — resolved server side so emails stay private.
    let result: { access_token?: string; refresh_token?: string; error?: string };
    try {
      result = await usernameLogin({ data: { identifier: id, password } });
    } catch {
      result = {};
    }
    if (!result.access_token || !result.refresh_token) {
      failSignIn("Invalid username or password.");
      return;
    }
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });
    setBusy(false);
    if (sessionError) {
      toast({ title: "Could not sign in", description: sessionError.message, variant: "destructive" });
      return;
    }
    clearSignInAttempts();
    rememberIdentifier(id);
    navigate("/community");

  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/community`,
        data: { display_name: displayName || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) {
      toast({ title: "Could not sign up", description: error.message, variant: "destructive" });
      return;
    }
    if (!data.session) {
      setCheckEmail(true);
      return;
    }
    navigate("/community");
  };

  const handleGoogle = async () => {
    setBusy(true);
    // Google returns through a fresh page load, so mark the session as
    // remembered first — otherwise the transient-session guard signs it
    // straight back out and the user lands on "Sign in" again.
    setRememberMe(true);
    try {
      sessionStorage.setItem(POST_AUTH_KEY, "/community");
    } catch {
      /* ignore */
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast({ title: "Google sign-in failed", description: String(result.error), variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    navigate("/community");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="Sign In — Ticklelist by Onsight Martin"
        description="Sign in or join Ticklelist to log ascents, tick challenge lists and find climbing partners."
        noindex
      />
      <Navbar />
      <main className="max-w-md mx-auto px-4 pt-28 pb-20">
        <Link to="/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to community
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <Mountain className="w-5 h-5 text-primary" />
          <h1 className="font-display text-2xl tracking-wider">Climbing Community</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Sign in to post the peaks you want to climb and to join other climbers' adventures.
        </p>

        {checkEmail ? (
          <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            Check your inbox — we sent a confirmation link to <span className="text-foreground">{email}</span>.
            Click it to activate your account, then come back and sign in.
          </div>
        ) : (
          <>
            <Button variant="outline" className="w-full mb-6" onClick={handleGoogle} disabled={busy}>
              Continue with Google
            </Button>
            <div className="relative mb-6 text-center">
              <span className="bg-background px-3 text-xs uppercase tracking-widest text-muted-foreground relative z-10">or</span>
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
            </div>

            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4" method="post" action="#" name="signin">
                  <div className="space-y-2">
                    <Label htmlFor="signin-id">Username or email</Label>
                    <Input id="signin-id" name="username" autoComplete="username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="onsightmartin or you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} className="mt-0.5" />
                    <Label htmlFor="remember" className="text-sm font-normal leading-snug text-muted-foreground">
                      Keep me signed in on this device
                      <span className="block text-xs">
                        Off: session ends when you close the browser or after 30 minutes idle.
                      </span>
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4" method="post" action="#" name="signup">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display name</Label>
                    <Input id="signup-name" name="name" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} placeholder="How other climbers see you" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="new-password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>

                  <Button type="submit" className="w-full" disabled={busy}>Create account</Button>
                </form>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default AuthPage;
