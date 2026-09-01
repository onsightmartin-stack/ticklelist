import { CalendarDays, MapPin, Mountain, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MemberAvatar from "./MemberAvatar";
import { cn } from "@/lib/utils";
import { formatElevation, formatElevationShort } from "@/lib/units";
import { useUnits } from "@/hooks/useUnits";
import type { ListDensity } from "@/hooks/useListDensity";
import { formatTiming, type Adventure, type PublicProfile, type Signup } from "@/lib/community";

interface AdventureCardProps {
  adventure: Adventure;
  signups: Signup[];
  profiles: Record<string, PublicProfile>;
  currentUserId: string | null;
  onSignUp: (adventureId: string, status: "interested" | "joining") => void;
  onWithdraw: (adventureId: string) => void;
  onDelete: (adventureId: string) => void;
  compact?: boolean;
  /** Explicit row size; overrides `compact`. */
  density?: ListDensity;
}

const AdventureCard = ({
  adventure, signups, profiles, currentUserId, onSignUp, onWithdraw, onDelete, compact = false, density,
}: AdventureCardProps) => {
  const units = useUnits();
  const joining = signups.filter((s) => s.status === "joining");
  const interested = signups.filter((s) => s.status === "interested");
  const mine = currentUserId ? signups.find((s) => s.user_id === currentUserId) : undefined;
  const creator = profiles[adventure.creator_id];
  const size: ListDensity = density ?? (compact ? "medium" : "large");

  if (size !== "large") {
    const small = size === "small";
    return (
      <article
        className={cn(
          "rounded-lg border border-border bg-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-hidden",
          small ? "px-2 py-1" : "p-2.5",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {!small && (
            <MemberAvatar path={creator?.avatar_url ?? null} name={creator?.display_name ?? "Climber"} className="h-8 w-8 shrink-0" />
          )}
          <div className="min-w-0">
            <p className={cn("font-display tracking-wide truncate flex items-center gap-1.5", small ? "text-[13px] leading-tight" : "text-sm")}>
              <Mountain className={cn("text-primary shrink-0", small ? "w-3 h-3" : "w-3.5 h-3.5")} />
              <span className="truncate">{adventure.peak_name}</span>
              {small && (adventure.country || adventure.elevation) && (
                <span className="text-muted-foreground font-normal text-[11px] shrink-0">
                  {adventure.country}
                  {adventure.country && adventure.elevation && " · "}
                  {adventure.elevation && formatElevationShort(adventure.elevation, units)}
                </span>
              )}
            </p>
            <p className={cn("text-muted-foreground truncate", small ? "text-[10px] leading-tight" : "text-xs")}>
              {small
                ? `${formatTiming(adventure)} · ${joining.length} joining${adventure.max_group_size ? `/${adventure.max_group_size}` : ""} · ${interested.length} int.`
                : `${[adventure.country, formatElevation(adventure.elevation, units)].filter(Boolean).join(" · ") || "Location not specified"} · ${joining.length} joining${adventure.max_group_size ? ` / ${adventure.max_group_size}` : ""} · ${interested.length} interested`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {adventure.difficulty && !small && <Badge variant="secondary" className="hidden md:inline-flex">{adventure.difficulty}</Badge>}
          {currentUserId && (
            <Button size="sm" variant={mine?.status === "joining" ? "default" : "outline"} onClick={() => onSignUp(adventure.id, "joining")} className="h-8 px-2 text-xs">
              Join
            </Button>
          )}
          {currentUserId === adventure.creator_id && (
            <Button variant="ghost" size="icon" aria-label="Delete adventure" onClick={() => onDelete(adventure.id)} className="h-8 w-8">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </article>
    );
  }


  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl tracking-wide flex items-center gap-2">
            <Mountain className="w-4 h-4 text-primary shrink-0" />
            {adventure.peak_name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {[adventure.country, formatElevation(adventure.elevation, units)].filter(Boolean).join(" · ") || "Location not specified"}
          </p>
        </div>
        {adventure.difficulty && <Badge variant="secondary">{adventure.difficulty}</Badge>}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{formatTiming(adventure)}</span>
        {adventure.meeting_point && (
          <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{adventure.meeting_point}</span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          {joining.length} joining{adventure.max_group_size ? ` / ${adventure.max_group_size}` : ""} · {interested.length} interested
        </span>
      </div>

      {adventure.notes && <p className="mt-4 text-sm text-foreground/80 whitespace-pre-line">{adventure.notes}</p>}

      <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
        <MemberAvatar path={creator?.avatar_url ?? null} name={creator?.display_name ?? "Climber"} className="h-7 w-7" />
        Posted by {creator?.display_name ?? "a climber"}
        {creator?.country ? ` · ${creator.country}` : ""}
      </div>

      {signups.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {signups.map((s) => {
            const p = profiles[s.user_id];
            return (
              <span
                key={s.id}
                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${
                  s.status === "joining" ? "border-primary/60 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                <MemberAvatar path={p?.avatar_url ?? null} name={p?.display_name ?? "Climber"} className="h-5 w-5" />
                {p?.display_name ?? "Climber"} ·{" "}
                {s.status === "joining" ? "Joining" : s.status === "invited" ? "Invited" : "Interested"}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {currentUserId && (
          <>
            <Button
              size="sm"
              variant={mine?.status === "joining" ? "default" : "outline"}
              onClick={() => onSignUp(adventure.id, "joining")}
            >
              I'm joining
            </Button>
            <Button
              size="sm"
              variant={mine?.status === "interested" ? "default" : "outline"}
              onClick={() => onSignUp(adventure.id, "interested")}
            >
              Interested
            </Button>
            {mine && (
              <Button size="sm" variant="ghost" onClick={() => onWithdraw(adventure.id)}>
                Withdraw
              </Button>
            )}
          </>
        )}
        {currentUserId === adventure.creator_id && (
          <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => onDelete(adventure.id)}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        )}
      </div>
    </article>
  );
};

export default AdventureCard;
