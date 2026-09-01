import { Globe } from "lucide-react";

interface UnMemberBadgeProps {
  unMember?: boolean | undefined;
}

export default function UnMemberBadge({ unMember }: UnMemberBadgeProps) {
  if (unMember !== false) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border whitespace-nowrap"
      title="Not a member state of the United Nations"
    >
      <Globe className="w-3 h-3" />
      Not a UN country
    </span>
  );
}
