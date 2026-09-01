import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Heart, MessageCircle, AtSign, UserPlus, Trash2, PartyPopper, Bug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MemberAvatar from "@/components/community/MemberAvatar";
import type { AppNotification, NotificationKind } from "@/lib/notify";
import { cn } from "@/lib/utils";

const icons: Record<NotificationKind, typeof Heart> = {
  follow: UserPlus,
  like: Heart,
  comment: MessageCircle,
  mention: AtSign,
  cheer: PartyPopper,
  bug: Bug,
};

const when = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

interface Actor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const useActors = (ids: string[]) => {
  const key = Array.from(new Set(ids)).sort().join(",");
  const [actors, setActors] = useState<Record<string, Actor>>({});

  useEffect(() => {
    const list = key ? key.split(",") : [];
    if (list.length === 0) return;
    let active = true;
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", list)
      .then(({ data }) => {
        if (!active) return;
        const map: Record<string, Actor> = {};
        (data ?? []).forEach((p) => {
          map[p.id] = p as Actor;
        });
        setActors(map);
      });
    return () => {
      active = false;
    };
  }, [key]);

  return actors;
};

interface Props {
  items: AppNotification[];
  compact?: boolean;
  onRead: (id: string) => void;
  onRemove?: (id: string) => void;
}

const NotificationList = ({ items, compact = false, onRead, onRemove }: Props) => {
  const actors = useActors(items.map((n) => n.actor_id));

  if (items.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", compact ? "px-3 py-6 text-center" : "py-10 text-center")}>
        Nothing yet — follows, likes, comments, cheers and mentions will show up here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((n) => {
        const Icon = icons[n.kind] ?? Heart;
        const actor = actors[n.actor_id];
        const name = actor?.display_name ?? "A climber";
        const row = (
          <div className="flex items-start gap-3 min-w-0">
            <MemberAvatar path={actor?.avatar_url ?? null} name={name} className="h-8 w-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                <span className="font-display tracking-wider">{name}</span>{" "}
                <span className="text-muted-foreground">{n.body}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Icon className="w-3 h-3 text-primary" /> {when(n.created_at)}
              </p>
            </div>
            {!n.read_at && <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" aria-label="Unread" />}
          </div>
        );

        return (
          <li key={n.id} className={cn("flex items-start gap-2 px-3 py-3", !n.read_at && "bg-secondary/40")}>
            <div className="flex-1 min-w-0">
              {n.link ? (
                <Link to={n.link} onClick={() => onRead(n.id)} className="block hover:opacity-90">
                  {row}
                </Link>
              ) : (
                <button onClick={() => onRead(n.id)} className="block w-full text-left">
                  {row}
                </button>
              )}
            </div>
            {onRemove && (
              <button
                onClick={() => onRemove(n.id)}
                aria-label="Dismiss notification"
                className="text-muted-foreground hover:text-destructive mt-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default NotificationList;
