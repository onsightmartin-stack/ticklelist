import { useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Mountain, Trophy, Users, Flag, PartyPopper } from "lucide-react";
import MemberAvatar from "@/components/community/MemberAvatar";
import AvatarFigure from "@/components/community/AvatarFigure";

import FollowButton from "@/components/community/FollowButton";
import { Button } from "@/components/ui/button";
import { useFollows } from "@/hooks/useFollows";
import { useAscentCheers } from "@/hooks/useAscentCheers";
import { Badge } from "@/components/ui/badge";
import { peakLists } from "@/data/peak-lists";
import type { Ascent } from "@/lib/peak-catalog";
import type { Adventure, PublicProfile, Signup } from "@/lib/community";

interface Props {
  ascents: Ascent[];
  adventures: Adventure[];
  signups: Signup[];
  profiles: Record<string, PublicProfile>;
  currentUserId?: string | null;
  limit?: number;
}

type EventKind = "ascent" | "list" | "adventure" | "signup";

interface FeedEvent {
  id: string;
  kind: EventKind;
  userId: string;
  at: string;
  text: string;
  detail?: string | undefined;
  highlight?: boolean | undefined;
  ascent?: Ascent | undefined;
  href?: string | undefined;
}

const keyFor = (a: Ascent) =>
  a.peak_type === "country_highpoint" ? `hp:${a.country ?? a.peak_name}` : `fp:${a.peak_name}`;

const relative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const ICONS: Record<EventKind, typeof Mountain> = {
  ascent: Mountain,
  list: Trophy,
  adventure: Flag,
  signup: Users,
};

/**
 * Builds a chronological feed out of the data the community page already
 * loads — no extra tables, no polling.
 */
const buildEvents = (
  ascents: Ascent[],
  adventures: Adventure[],
  signups: Signup[],
  adventureById: Map<string, Adventure>,
): FeedEvent[] => {
  const events: FeedEvent[] = [];

  for (const a of ascents) {
    events.push({
      id: `ascent-${a.id}`,
      kind: "ascent",
      userId: a.user_id,
      at: a.created_at,
      text: `logged ${a.peak_name}`,
      detail: [a.country, a.elevation].filter(Boolean).join(" · ") || undefined,
      ascent: a,
      href: `/community/ascents#ascent-${a.id}`,
    });
  }


  // Replay each climber's ascents in the order they were logged and flag the
  // ascent that tipped them over the finish line of a challenge list.
  const byUser = new Map<string, Ascent[]>();
  for (const a of ascents) {
    if (!byUser.has(a.user_id)) byUser.set(a.user_id, []);
    byUser.get(a.user_id)!.push(a);
  }

  for (const [userId, userAscents] of byUser) {
    const ordered = [...userAscents].sort(
      (x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime(),
    );
    const keys = new Set<string>();
    const completed = new Set<string>();

    for (const a of ordered) {
      keys.add(keyFor(a));
      for (const list of peakLists) {
        if (completed.has(list.id)) continue;
        const done = list.entries.every(
          (e) => keys.has(e.key) || (e.alt ?? []).some((k) => keys.has(k)),
        );
        if (done) {
          completed.add(list.id);
          events.push({
            id: `list-${userId}-${list.id}`,
            kind: "list",
            userId,
            at: a.created_at,
            text: `completed ${list.name}`,
            detail: `${list.entries.length} peaks · finished on ${a.peak_name}`,
            highlight: true,
          });
        }
      }
    }
  }

  for (const adv of adventures) {
    events.push({
      id: `adventure-${adv.id}`,
      kind: "adventure",
      userId: adv.creator_id,
      at: adv.created_at,
      text: `posted an adventure to ${adv.peak_name}`,
      detail: adv.country ?? undefined,
      href: `/community/adventures#adventure-${adv.id}`,
    });
  }

  for (const s of signups) {
    const adv = adventureById.get(s.adventure_id);
    if (!adv) continue;
    events.push({
      id: `signup-${s.id}`,
      kind: "signup",
      userId: s.user_id,
      at: adv.created_at,
      text: `${s.status === "joining" ? "joined" : "is interested in"} ${adv.peak_name}`,
      href: `/community/adventures#adventure-${adv.id}`,
    });
  }


  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
};

const ActivityFeed = ({
  ascents,
  adventures,
  signups,
  profiles,
  currentUserId = null,
  limit = 25,
}: Props) => {
  const { following, followerCounts, toggleFollow } = useFollows();
  const { counts: cheerCounts, mine: myCheers, toggleCheer } = useAscentCheers();
  const [scope, setScope] = useState<"all" | "following">("all");

  const adventureById = useMemo(
    () => new Map(adventures.map((a) => [a.id, a])),
    [adventures],
  );

  const allEvents = useMemo(
    () => buildEvents(ascents, adventures, signups, adventureById),
    [ascents, adventures, signups, adventureById],
  );

  const events = useMemo(() => {
    const scoped =
      scope === "following"
        ? allEvents.filter((e) => following.has(e.userId) || e.userId === currentUserId)
        : allEvents;
    return scoped.slice(0, limit);
  }, [allEvents, scope, following, currentUserId, limit]);

  const toggle = (
    <div className="flex gap-1 rounded-md border border-border p-0.5 w-fit">
      {(["all", "following"] as const).map((s) => (
        <Button
          key={s}
          type="button"
          size="sm"
          variant={scope === s ? "secondary" : "ghost"}
          className="h-7 text-[11px] tracking-wide"
          onClick={() => setScope(s)}
        >
          {s === "all" ? "Everyone" : `Following${following.size ? ` · ${following.size}` : ""}`}
        </Button>
      ))}
    </div>
  );

  if (allEvents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing here yet — <Link to="/auth" className="text-primary underline">join Ticklelist</Link> and log
        the first ascent.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Everything happening in Ticklelist — new ascents, challenge lists ticked off, and adventures posted.
        Follow a climber to keep their updates in one place.
      </p>

      {toggle}

      {events.length === 0 && (
        <p className="text-sm text-muted-foreground py-6">
          {currentUserId
            ? "You're not following anyone yet — hit Follow on a climber to see their ascents here."
            : "Sign in to follow climbers and build your own feed."}
        </p>
      )}

      <ol className="relative space-y-3">
        {events.map((e) => {
          const person = profiles[e.userId];
          const name = person?.display_name ?? "A climber";
          const Icon = ICONS[e.kind];

          return (
            <li
              key={e.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                e.highlight ? "border-primary/50 bg-primary/5" : "border-border bg-card"
              }`}
            >
              <Link to={`/community/members/${e.userId}`} className="shrink-0" aria-label={`View ${name}'s profile`}>
                {/* New ascents get the full-body 3D climber standing beside the entry. */}
                {e.kind === "ascent" && person?.avatar_url?.startsWith("gen:") ? (
                  <AvatarFigure
                    path={person.avatar_url}
                    name={name}
                    className="h-20 w-14 -mt-1 -mb-2 drop-shadow-md transition-transform hover:-translate-y-0.5"
                  />
                ) : (
                  <MemberAvatar path={person?.avatar_url ?? null} name={name} className="h-9 w-9" />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <Link
                    to={`/community/members/${e.userId}`}
                    className="font-display tracking-wide hover:text-primary hover:underline"
                  >
                    {name}
                  </Link>{" "}
                  {e.href ? (
                    <Link to={e.href} className="text-muted-foreground hover:text-foreground hover:underline">
                      {e.text}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{e.text}</span>
                  )}
                </p>
                {e.detail && <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.detail}</p>}
                {e.ascent && (
                  <Button
                    type="button"
                    variant={myCheers.has(e.ascent.id) ? "secondary" : "ghost"}
                    size="sm"
                    disabled={e.ascent.user_id === currentUserId}
                    onClick={() => toggleCheer(e.ascent!)}
                    aria-label={myCheers.has(e.ascent.id) ? "Remove your cheer" : `Cheer ${name}'s ascent`}
                    className={`mt-2 h-7 gap-1.5 px-2 text-xs ${myCheers.has(e.ascent.id) ? "text-primary" : ""}`}
                  >
                    <PartyPopper className={`w-3.5 h-3.5 ${myCheers.has(e.ascent.id) ? "fill-current" : ""}`} />
                    {e.ascent.user_id === currentUserId
                      ? "Cheers"
                      : myCheers.has(e.ascent.id)
                        ? "Cheered"
                        : "Cheer"}
                    {(cheerCounts[e.ascent.id] ?? 0) > 0 && (
                      <span className="tabular-nums">{cheerCounts[e.ascent.id]}</span>
                    )}
                  </Button>
                )}
              </div>
              {currentUserId && e.userId !== currentUserId && (
                <FollowButton
                  isFollowing={following.has(e.userId)}
                  followerCount={followerCounts[e.userId]}
                  onToggle={() => toggleFollow(e.userId)}
                  className="hidden sm:inline-flex self-center"
                />
              )}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Icon className={`w-4 h-4 ${e.highlight ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{relative(e.at)}</span>
              </div>
              {e.highlight && (
                <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] self-center">
                  List complete
                </Badge>
              )}
            </li>
          );

        })}
      </ol>
    </div>
  );
};

export default ActivityFeed;
