import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Loader2, Lock, Pause, Play, Shuffle, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import AvatarTurntable from "@/components/community/AvatarTurntable";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { computeXp } from "@/lib/xp";
import type { Ascent } from "@/lib/peak-catalog";
import { fileToDataUrl } from "@/lib/image-downscale";
import { suggestAvatarFromPhoto } from "@/lib/avatar-suggest.functions";
import {
  buildAvatarSvg,
  avatarParts,
  decodeAvatarConfig,
  defaultAvatarConfig,
  encodeAvatarConfig,
  isUnlocked,
  randomConfig,
  sanitizeConfig,
  totalOptionCount,
  unlockedCount,
  type AvatarConfig,
} from "@/lib/avatar-builder";

/** Dress-up game for the member avatar — gear unlocks as your XP level climbs. */
const AvatarStudio = ({ onClose }: { onClose: () => void }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [config, setConfig] = useState<AvatarConfig>(
    () => decodeAvatarConfig(profile?.avatar_url) ?? defaultAvatarConfig,
  );
  const [level, setLevel] = useState(1);
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const suggest = useServerFn(suggestAvatarFromPhoto);

  const suggestFromPhoto = async (file: File) => {
    setSuggesting(true);
    try {
      const image = await fileToDataUrl(file);
      const { config: suggested } = await suggest({ data: { image } });
      setConfig({ ...sanitizeConfig(suggested, level), animated: animate });
      toast({
        title: "Avatar suggested",
        description: "Built from your photo — tweak anything you like before saving.",
      });
    } catch (error) {
      toast({
        title: "Could not read that photo",
        description: error instanceof Error ? error.message : "Try another picture.",
        variant: "destructive",
      });
    } finally {
      setSuggesting(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("ascents")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!active) return;
        setLevel(computeXp((data ?? []) as Ascent[]).level.level);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const [animate, setAnimate] = useState(() => config.animated !== false);
  const previewSvg = useMemo(() => buildAvatarSvg(config, animate), [config, animate]);
  const unlocked = unlockedCount(level);

  const nextUnlock = useMemo(() => {
    const locked = avatarParts
      .flatMap((p) => p.options.map((o) => ({ ...o, part: p.label })))
      .filter((o) => o.level > level)
      .sort((a, b) => a.level - b.level);
    return locked[0] ?? null;
  }, [level]);

  if (!user) return null;

  const save = async () => {
    setBusy(true);
    const clean = { ...sanitizeConfig(config, level), animated: animate };
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: encodeAvatarConfig(clean) })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast({ title: "Could not save avatar", description: error.message, variant: "destructive" });
      return;
    }
    await refreshProfile();
    toast({ title: "Avatar saved", description: "Your new climber is live across the Ticklelist." });
    onClose();
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display tracking-wider text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Avatar studio
          </h3>
          <p className="text-sm text-muted-foreground">
            Build your climber. Gear unlocks as you log ascents and level up.
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div className="font-display tracking-wider text-primary text-sm">Level {level}</div>
          <div>
            {unlocked}/{totalOptionCount} items unlocked
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <div
          role="img"
          aria-label="Your climber avatar preview"
          className="h-28 w-28 overflow-hidden rounded-full border border-border bg-secondary [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />
        <AvatarTurntable
          config={{ ...config, animated: animate }}
          name="Your climber"
          animated={animate}
          stage
          className="h-52 w-40 overflow-hidden rounded-lg border border-border"
        />


        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setConfig(randomConfig(level))}>
              <Shuffle className="w-4 h-4 mr-2" /> Surprise me
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAnimate((a) => !a)}>
              {animate ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {animate ? "Pause" : "Animate"}
            </Button>
          </div>
          <div>
            <input
              ref={photoInput}
              id="avatar-inspo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void suggestFromPhoto(f);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={suggesting}
              onClick={() => photoInput.current?.click()}
            >
              {suggesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              {suggesting ? "Reading your photo…" : "Build from a photo"}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
              For the lazy ones: upload a selfie and we'll match skin tone, hair, beard and kit. The
              photo is only used for the suggestion — nothing is stored.
            </p>
          </div>
          {nextUnlock && (
            <p className="text-xs text-muted-foreground max-w-xs">
              Next unlock at level {nextUnlock.level}:{" "}
              <span className="text-foreground">
                {nextUnlock.label} ({nextUnlock.part})
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {avatarParts.map((part) => (
          <div key={part.key}>
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{part.label}</h4>
            <div className="flex flex-wrap gap-2">
              {part.options.map((option) => {
                const open = isUnlocked(option, level);
                const active = config[part.key] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!open}
                    title={open ? option.label : `Unlocks at level ${option.level}`}
                    onClick={() => setConfig((c) => ({ ...c, [part.key]: option.id }))}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground",
                      !open && "opacity-50 cursor-not-allowed hover:text-muted-foreground",
                    )}
                  >
                    {part.swatch && option.color && (
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-border"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span>{option.label}</span>
                    {!open && (
                      <span className="flex items-center gap-1 text-[10px]">
                        <Lock className="w-3 h-3" /> {option.level}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="button" onClick={save} disabled={busy}>
          Use this avatar
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </section>
  );
};

export default AvatarStudio;
