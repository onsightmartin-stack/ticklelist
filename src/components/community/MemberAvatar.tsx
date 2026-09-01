import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveAvatarUrl } from "@/lib/community";
import { cn } from "@/lib/utils";

interface MemberAvatarProps {
  path: string | null;
  name: string;
  className?: string;
}

const MemberAvatar = ({ path, name, className }: MemberAvatarProps) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    resolveAvatarUrl(path).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [path]);

  return (
    <Avatar className={cn("h-9 w-9 border border-border", className)}>
      {url && <AvatarImage src={url} alt={`${name} profile picture`} />}
      <AvatarFallback className="bg-secondary text-xs font-display tracking-wider">
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export default MemberAvatar;
