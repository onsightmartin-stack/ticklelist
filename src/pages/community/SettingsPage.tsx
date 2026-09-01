import { useState } from "react";
import Seo from "@/components/Seo";
import { Link, useNavigate } from "@/lib/router-compat";
import { Bell, ChevronDown, KeyRound, Link2, LogOut, Palette, Scale, User } from "lucide-react";
import CommunityLayout from "@/components/community/CommunityLayout";
import ProfileEditor from "@/components/community/ProfileEditor";
import ThemePicker from "@/components/community/ThemePicker";
import ProfileGoalsPicker from "@/components/community/ProfileGoalsPicker";
import UnitsPicker from "@/components/community/UnitsPicker";
import DefinitionsPicker from "@/components/community/DefinitionsPicker";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/useAuth";

const SettingsPage = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const openAvatarStudio = typeof window !== "undefined" && window.location.hash.replace("#", "").toLowerCase() === "avatar";
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <CommunityLayout>
      <Seo
        title="Account Settings — Ticklelist"
        description="Manage your Ticklelist profile, password and linked accounts."
        noindex
      />

      <h1 className="font-display text-2xl tracking-wider mb-6">Settings</h1>

      {!user ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">{loading ? "Checking your session…" : "Sign in to manage your account."}</p>
          {!loading && <Button asChild className="mt-4"><Link to="/auth">Sign in</Link></Button>}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-display">Signed in as</p>
            <p className="font-display tracking-wider text-lg mt-1">{profile?.display_name ?? "Climber"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="secondary" size="sm" onClick={() => navigate(`/community/members/${user.id}`)}>
                <User className="w-4 h-4 mr-1" /> View public profile
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/account/password")}>
                <KeyRound className="w-4 h-4 mr-1" /> Change password
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/account/linked")}>
                <Link2 className="w-4 h-4 mr-1" /> Linked accounts
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/community/notifications/settings")}>
                <Bell className="w-4 h-4 mr-1" /> Notification settings
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/community/definitions")}>
                <Scale className="w-4 h-4 mr-1" /> Challenge definitions
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/community/appearance")}>
                <Palette className="w-4 h-4 mr-1" /> Appearance & theme
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-1" /> Sign out
              </Button>
            </div>
          </div>

          <UnitsPicker />

          <Collapsible open={themeOpen} onOpenChange={setThemeOpen} className="rounded-lg border border-border bg-card">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 p-5 text-left"
              >
                <span className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-primary font-display">Site theme</span>
                    <span className="block text-sm text-muted-foreground mt-0.5">Pick how the whole site looks on this device.</span>
                  </span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${themeOpen ? "rotate-180" : ""}`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-5 pt-0">
              <ThemePicker />
            </CollapsibleContent>
          </Collapsible>

          <div id="definitions" className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-display">Challenge definitions</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Choose which countries count and which Seven Summits list you're chasing.
            </p>
            <DefinitionsPicker />
          </div>

          <div id="goals" />
          <ProfileGoalsPicker userId={user.id} initial={(profile as { profile_goals?: string[] } | null)?.profile_goals} />

          <ProfileEditor onDone={() => navigate(`/community/members/${user.id}`)} initialStudio={openAvatarStudio} />
        </div>
      )}
    </CommunityLayout>
  );
};

export default SettingsPage;
