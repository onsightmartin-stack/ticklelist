import { Mountain, Trash2, ExternalLink, Lock, PartyPopper, Pencil, Users } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MemberAvatar from "@/components/community/MemberAvatar";
import PeakRefLinks from "@/components/PeakRefLinks";
import { formatAscentDate, type Ascent } from "@/lib/peak-catalog";
import type { PublicProfile } from "@/lib/community";
import type { Cheerer } from "@/hooks/useAscentCheers";
import { difficultyConfig } from "@/data/difficulty";
import { formatXp, xpForAscent } from "@/lib/xp";
import { cn } from "@/lib/utils";
import { formatElevation, formatElevationShort } from "@/lib/units";
import { useUnits } from "@/hooks/useUnits";
import { timeAgo } from "@/lib/time-ago";
import type { ListDensity } from "@/hooks/useListDensity";



interface AscentCardProps {
  ascent: Ascent;
  profile?: PublicProfile | undefined;
  currentUserId: string | null;
  onDelete: (id: string) => void;
  onEdit?: ((ascent: Ascent) => void) | undefined;
  cheerCount?: number;
  cheered?: boolean;
  onCheer?: (ascent: Ascent) => void;
  /** Who cheered this ascent, newest first. */
  cheerers?: Cheerer[] | undefined;
  /** Profile lookup used to name the cheering members. */
  profiles?: Record<string, PublicProfile> | undefined;
  /** Dense single-row layout for long lists (>7 items). */
  compact?: boolean;
  /** Explicit row size; overrides `compact`. */
  density?: ListDensity;
}


const AscentCard = ({ ascent, profile, currentUserId, onDelete, onEdit, cheerCount = 0, cheered = false, onCheer, cheerers, profiles, compact = false, density }: AscentCardProps) => {
  const units = useUnits();
  const mine = currentUserId === ascent.user_id;
  const { xp, difficulty } = xpForAscent(ascent);
  const size: ListDensity = density ?? (compact ? "medium" : "large");
  const partnerCount = (ascent.partner_ids?.length ?? 0) + (ascent.partner_names?.length ?? 0);

  if (size !== "large") {
    const small = size === "small";
    return (
      <article
        id={`ascent-${ascent.id}`}
        className={cn(
          "grid grid-cols-[minmax(0,1fr)_auto] items-center scroll-mt-24 overflow-hidden",
          small
            ? "rounded-md border border-border/60 bg-card px-1.5 py-[3px] gap-1.5"
            : "rounded-lg border border-border bg-card p-3 gap-2.5",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {!small && (
            <MemberAvatar path={profile?.avatar_url ?? null} name={profile?.display_name ?? "Member"} className="h-9 w-9 shrink-0" />
          )}
          <div className="min-w-0">
            <p className={cn("font-display tracking-wide truncate flex items-center gap-1", small ? "text-[12px] leading-[1.15]" : "text-[15px] leading-snug")}>
              <Mountain className={cn("text-primary shrink-0", small ? "w-2.5 h-2.5" : "w-4 h-4")} />
              <span className="truncate">{ascent.peak_name}</span>
              {small && (ascent.country || ascent.elevation) && (
                <span className="text-muted-foreground font-normal text-[10px] shrink-0">
                  {ascent.country}
                  {ascent.country && ascent.elevation && " · "}
                  {ascent.elevation && formatElevationShort(ascent.elevation, units)}
                </span>
              )}
            </p>
            <p className={cn("text-muted-foreground truncate", small ? "text-[9px] leading-[1.1]" : "text-[13px] leading-snug")}>
              {small
                ? `${formatAscentDate(ascent.ascent_date, ascent.date_precision ?? "day")}${profile?.display_name ? ` · ${profile.display_name}` : ""}`
                : `${profile?.display_name ?? "Member"} · ${formatAscentDate(ascent.ascent_date, ascent.date_precision ?? "day")}${ascent.country ? ` · ${ascent.country}` : ""}${ascent.elevation ? ` · ${formatElevation(ascent.elevation, units)}` : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Badge variant="outline" className={cn("border-primary/40 text-primary", small ? "text-[9px] px-1 py-0 h-[16px]" : "hidden sm:inline-flex")}>
            +{formatXp(xp)}
          </Badge>
          {!small && (
            <Badge variant="outline" className={cn("hidden md:inline-flex", difficultyConfig[difficulty].color)}>
              {difficultyConfig[difficulty].label}
            </Badge>
          )}
          {onCheer && (
            <Button variant={cheered ? "secondary" : "ghost"} size="sm" disabled={mine} onClick={() => onCheer(ascent)} aria-label={cheered ? "Remove your cheer" : `Cheer ${ascent.peak_name}`} className={cn("gap-1 text-xs", small ? "px-1 h-5 min-w-5" : "px-2 h-8")}>
              <PartyPopper className={cn(small ? "w-3 h-3" : "w-3.5 h-3.5", cheered && "fill-current")} />
              {cheerCount > 0 && <span className="tabular-nums">{cheerCount}</span>}
            </Button>
          )}
          {mine && (
            <>
              {onEdit && (
                <Button variant="ghost" size="icon" aria-label="Edit ascent" onClick={() => onEdit(ascent)} className={cn(small ? "h-5 w-5" : "h-8 w-8")}>
                  <Pencil className={cn(small ? "w-3 h-3" : "w-3.5 h-3.5")} />
                </Button>
              )}
              <Button variant="ghost" size="icon" aria-label="Delete ascent" onClick={() => onDelete(ascent.id)} className={cn(small ? "h-5 w-5" : "h-8 w-8")}>
                <Trash2 className={cn(small ? "w-3 h-3" : "w-3.5 h-3.5")} />
              </Button>
            </>
          )}
        </div>
      </article>
    );
  }


  return (
    <article id={`ascent-${ascent.id}`} className="rounded-lg border border-border bg-card p-5 scroll-mt-24">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <MemberAvatar path={profile?.avatar_url ?? null} name={profile?.display_name ?? "Member"} />
          <div>
            <h3 className="font-display tracking-wider text-lg leading-tight flex items-center gap-2">
              <Mountain className="w-4 h-4 text-primary shrink-0" />
              {ascent.peak_name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {profile?.display_name ?? "Member"} · {formatAscentDate(ascent.ascent_date, ascent.date_precision ?? "day")}
              {ascent.country && ` · ${ascent.country}`}
              {ascent.elevation && ` · ${formatElevation(ascent.elevation, units)}`}
            </p>
          </div>
        </div>
        {mine && (
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <Button variant="ghost" size="icon" aria-label="Edit ascent" onClick={() => onEdit(ascent)}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" aria-label="Delete ascent" onClick={() => onDelete(ascent.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>


      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant={ascent.peak_type === "country_highpoint" ? "default" : "secondary"}>
          {ascent.peak_type === "country_highpoint" ? "Country high point" : "Famous peak"}
        </Badge>
        <Badge variant="outline" className="border-primary/40 text-primary">+{formatXp(xp)} XP</Badge>
        <Badge variant="outline" className={difficultyConfig[difficulty].color}>
          {difficultyConfig[difficulty].label}
        </Badge>
        {ascent.route && <Badge variant="outline">{ascent.route}</Badge>}
        {ascent.guiding && (
          <Badge variant="outline">{ascent.guiding === "guided" ? "With a guide" : "Self-guided"}</Badge>
        )}
        {ascent.oxygen && (
          <Badge variant="outline">
            {ascent.oxygen === "oxygen" ? "With oxygen" : "No supplemental oxygen"}
          </Badge>
        )}
        {ascent.with_group && <Badge variant="outline" className="gap-1"><Users className="w-3 h-3" /> Group</Badge>}
        {!ascent.is_public && (
          <Badge variant="outline" className="gap-1"><Lock className="w-3 h-3" /> Private</Badge>
        )}
      </div>

      {(partnerCount > 0) && (
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
          <Users className="w-3 h-3 shrink-0" />
          With{" "}
          {(ascent.partner_ids ?? []).map((id, i) => (
            <span key={id}>
              {i > 0 && ", "}
              <Link to={`/community/members/${id}`} className="underline hover:text-foreground">
                {profiles?.[id]?.display_name ?? "a member"}
              </Link>
            </span>
          ))}
          {(ascent.partner_ids ?? []).length > 0 && (ascent.partner_names ?? []).length > 0 && ", "}
          {(ascent.partner_names ?? []).join(", ")}
        </p>
      )}


      <PeakRefLinks peak={ascent.peak_name} country={ascent.country ?? undefined} className="mt-3" />

      {ascent.trip_report && (
        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">{ascent.trip_report}</p>
      )}

      {ascent.photo_url && (
        <a
          href={ascent.photo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block group"
        >
          <img
            src={ascent.photo_url}
            alt={`Summit photo from ${ascent.peak_name}`}
            loading="lazy"
            className="rounded-md border border-border max-h-72 w-full object-cover"
          />
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary group-hover:underline">
            <ExternalLink className="w-3 h-3" /> View full photo
          </span>
        </a>
      )}
      {onCheer && (
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
          <Button
            variant={cheered ? "secondary" : "ghost"}
            size="sm"
            disabled={mine}
            onClick={() => onCheer(ascent)}
            aria-label={cheered ? "Remove your cheer" : `Cheer this ascent of ${ascent.peak_name}`}
            className={cn("gap-1.5 text-xs", cheered && "text-primary")}
          >
            <PartyPopper className={cn("w-4 h-4", cheered && "fill-current")} />
            {mine ? "Cheers" : cheered ? "Cheered" : "Cheer"}
            {cheerCount > 0 && <span className="tabular-nums">{cheerCount}</span>}
          </Button>
          {mine && cheerCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {cheerCount} {cheerCount === 1 ? "member" : "members"} cheered this climb
            </span>
          )}
        </div>
      )}
      {cheerers && cheerers.length > 0 && (
        <section className="mt-3 border-t border-border pt-3">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Reactions · {cheerers.length}
          </h4>
          <ul className="space-y-2">
            {cheerers.map((c) => {
              const p = profiles?.[c.user_id];
              const name = p?.display_name ?? "Member";
              return (
                <li key={`${c.user_id}-${c.created_at}`} className="flex items-center gap-2 text-sm">
                  <Link
                    to={`/community/members/${c.user_id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <MemberAvatar path={p?.avatar_url ?? null} name={name} className="h-6 w-6" />
                    <span>{name}</span>
                  </Link>
                  <PartyPopper className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">cheered {timeAgo(c.created_at)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

    </article>
  );
};

export default AscentCard;
