import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import MemberAvatar from "@/components/community/MemberAvatar";
import { buildAvatarSvg, decodeAvatarConfig } from "@/lib/avatar-builder";
import { motionAllowed } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ProfileAvatarDisplayProps {
  path: string | null;
  name: string;
  className?: string;
}

/**
 * Public profile avatar. Designed (generated) avatars render inline as SVG so
 * the viewer gets a play/pause control; uploaded photos fall back to the
 * regular avatar image.
 */
const ProfileAvatarDisplay = ({ path, name, className }: ProfileAvatarDisplayProps) => {
  const config = useMemo(() => decodeAvatarConfig(path), [path]);
  const [playing, setPlaying] = useState(() => config?.animated !== false);
  const svg = useMemo(
    () => (config ? buildAvatarSvg(config, playing) : null),
    [config, playing],
  );

  // Respect the viewer's motion sensitivity setting (and their device default).
  useEffect(() => {
    if (!motionAllowed()) setPlaying(false);
  }, []);


  if (!config || !svg) {
    return <MemberAvatar path={path} name={name} {...(className ? { className } : {})} />;
  }

  return (
    <div className="relative shrink-0">
      <div
        role="img"
        aria-label={`${name} profile picture`}
        className={cn(
          "h-20 w-20 overflow-hidden rounded-full border border-border bg-secondary [&>svg]:h-full [&>svg]:w-full",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? `Pause ${name}'s avatar animation` : `Play ${name}'s avatar animation`}
        title={playing ? "Pause animation" : "Play animation"}
        className="absolute -bottom-1 -right-1 rounded-full border border-border bg-card p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>
    </div>
  );
};

export default ProfileAvatarDisplay;
