import Seo from "@/components/Seo";
import { Link } from "@/lib/router-compat";
import { AtSign, Heart, MessageCircle, PartyPopper, UserPlus } from "lucide-react";
import CommunityLayout from "@/components/community/CommunityLayout";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationPrefs, type NotificationPrefs } from "@/hooks/useNotificationPrefs";

const rows: { kind: keyof NotificationPrefs; label: string; hint: string; Icon: typeof Heart }[] = [
  { kind: "follow", label: "New followers", hint: "When a climber starts following you.", Icon: UserPlus },
  { kind: "like", label: "Likes", hint: "When someone likes one of your posts.", Icon: Heart },
  { kind: "comment", label: "Comments", hint: "When someone comments on your posts.", Icon: MessageCircle },
  { kind: "cheer", label: "Cheers", hint: "When someone cheers one of your logged ascents.", Icon: PartyPopper },
  { kind: "mention", label: "Mentions", hint: "When someone @mentions you in a post or comment.", Icon: AtSign },
];

const NotificationPrefsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { prefs, setPref, loading, saving } = useNotificationPrefs();

  return (
    <CommunityLayout>
      <Seo
        title="Notification Settings — Ticklelist"
        description="Choose which follow, like, comment and mention alerts you receive in Ticklelist."
        noindex
      />

      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Ticklelist</p>
        <h1 className="font-display tracking-wider text-2xl mt-1">Notification settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Turn off any alert you don't want — we simply won't create it.
        </p>
      </div>

      {!user ? (
        <p className="text-sm text-muted-foreground">
          {authLoading ? "Checking your session…" : (
            <>
              <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to manage your alerts.
            </>
          )}
        </p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {rows.map(({ kind, label, hint, Icon }) => (
            <div key={kind} className="flex items-center gap-4 px-4 py-4">
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-display tracking-wider">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              <Switch
                checked={prefs[kind]}
                onCheckedChange={(v) => setPref(kind, v)}
                aria-label={label}
              />
            </div>
          ))}
        </div>
      )}

      {saving && <p className="text-xs text-muted-foreground mt-3">Saving…</p>}

      <p className="text-xs text-muted-foreground mt-6">
        Looking for your alerts? <Link to="/community/notifications" className="text-primary hover:underline">Open notifications</Link>.
      </p>
    </CommunityLayout>
  );
};

export default NotificationPrefsPage;
