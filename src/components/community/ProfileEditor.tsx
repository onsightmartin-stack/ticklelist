import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AvatarStudio from "./AvatarStudio";
import MemberAvatar from "./MemberAvatar";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { clearAvatarCache } from "@/lib/community";
import { useAuth } from "@/hooks/useAuth";

const ProfileEditor = ({ onDone, initialStudio = false }: { onDone: () => void; initialStudio?: boolean }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [busy, setBusy] = useState(false);
  const [studio, setStudio] = useState(initialStudio);


  if (!user) return null;

  const uploadAvatar = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please pick an image under 5 MB.", variant: "destructive" });
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      clearAvatarCache(path);
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      await refreshProfile();
      toast({ title: "Profile picture updated" });
    } else {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast({ title: "Display name is required", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim().slice(0, 50),
        bio: bio.trim().slice(0, 500) || null,
        country: country.trim().slice(0, 60) || null,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast({ title: "Could not save profile", description: error.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    toast({ title: "Profile saved" });
    onDone();
  };

  return (
    <form onSubmit={save} className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h3 className="font-display tracking-wider text-lg">Your profile</h3>

      <div className="flex items-center gap-4">
        <MemberAvatar path={profile?.avatar_url ?? null} name={displayName || "Climber"} className="h-16 w-16" />
        <div className="space-y-2">
          <Label htmlFor="avatar" className="text-sm">Profile picture</Label>
          <Input
            id="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="mt-1"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
            }}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => setStudio((s) => !s)}>
            <Sparkles className="w-4 h-4 mr-2" />
            {studio ? "Close avatar studio" : "Customize avatar"}
          </Button>
        </div>
      </div>

      {studio && <AvatarStudio onClose={() => setStudio(false)} />}


      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display name *</Label>
          <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="home">Home country</Label>
          <Input id="home" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={60} placeholder="Sweden" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={3} placeholder="Peaks climbed, experience, what you're looking for..." />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>Save profile</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Close</Button>
      </div>
    </form>
  );
};

export default ProfileEditor;
