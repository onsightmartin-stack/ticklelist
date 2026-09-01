import { UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  isFollowing: boolean;
  onToggle: () => void;
  followerCount?: number | undefined;
  className?: string | undefined;
  size?: "sm" | "icon" | undefined;
}

const FollowButton = ({ isFollowing, onToggle, followerCount, className, size = "sm" }: Props) => (
  <Button
    type="button"
    variant={isFollowing ? "secondary" : "outline"}
    size={size}
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    aria-label={isFollowing ? "Unfollow climber" : "Follow climber"}
    className={cn("h-7 gap-1.5 text-[11px] tracking-wide", className)}
  >
    {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
    {size !== "icon" && (isFollowing ? "Following" : "Follow")}
    {typeof followerCount === "number" && followerCount > 0 && size !== "icon" && (
      <span className="text-muted-foreground">· {followerCount}</span>
    )}
  </Button>
);

export default FollowButton;
