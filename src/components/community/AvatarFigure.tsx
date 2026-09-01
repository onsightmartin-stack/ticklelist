import { useMemo } from "react";
import Avatar3D from "@/components/community/Avatar3D";
import { decodeAvatarConfig } from "@/lib/avatar-builder";
import { cn } from "@/lib/utils";

interface AvatarFigureProps {
  path: string | null;
  name: string;
  className?: string;
  /** Force animation on/off; defaults to the member's saved preference. */
  animated?: boolean;
  /** Allow drag-to-spin. Off by default for small in-feed figures. */
  interactive?: boolean;
}

/**
 * Full-body low-poly 3D climber used in feeds and cards. Returns null when the
 * member uses an uploaded photo instead of a designed avatar, so call sites can
 * fall back to the usual round portrait.
 */
const AvatarFigure = ({ path, name, className, animated, interactive = false }: AvatarFigureProps) => {
  const config = useMemo(() => decodeAvatarConfig(path), [path]);
  if (!config) return null;

  return (
    <Avatar3D
      config={config}
      name={name}
      className={cn(className, !interactive && "pointer-events-none")}
      controls={false}
      spinSpeed={interactive ? 18 : 0}
      {...(animated === undefined ? {} : { animated })}
    />
  );
};

export default AvatarFigure;
