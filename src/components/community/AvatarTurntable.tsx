import Avatar3D from "@/components/community/Avatar3D";
import type { AvatarConfig } from "@/lib/avatar-builder";

interface AvatarTurntableProps {
  /** Encoded avatar path (`gen:...`) or a decoded config. */
  path?: string | null;
  config?: AvatarConfig | null;
  name: string;
  className?: string;
  /** Idle auto-rotation speed in degrees per second (0 disables). */
  spinSpeed?: number;
  /** Show the rotate hint / control buttons. */
  controls?: boolean;
  animated?: boolean;
  /** Render the member's backdrop as a 3D stage instead of a transparent one. */
  stage?: boolean;
}

/**
 * Character-select turntable. Now a real-time low-poly 3D model (see
 * `Avatar3D`); this thin wrapper keeps the original API so every call site
 * stays unchanged.
 */
const AvatarTurntable = (props: AvatarTurntableProps) => <Avatar3D {...props} />;

export default AvatarTurntable;
