import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import PeakImage from "@/components/PeakImage";
import UnMemberBadge from "@/components/UnMemberBadge";
import PeakRefLinks from "@/components/PeakRefLinks";
import { peakDetails } from "@/data/peak-details";
import { countries } from "@/data/countries";
import { countryDifficulty, difficultyConfig } from "@/data/difficulty";
import { advisoryDetails, cautionNotes, getNewsUrl } from "@/data/advisory-details";
import { personalNotes } from "@/data/personal-notes";
import { ukConstituentHighpoints } from "@/data/uk-constituents";

import { Mountain, Calendar, ArrowUpRight, Navigation, Youtube, AlertTriangle, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PeakDetailModalProps {
  country: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PeakDetailModal({ country, open, onOpenChange }: PeakDetailModalProps) {
  // Fetch confirmed YouTube climb for this country
  const { data: youtubeClimb } = useQuery({
    queryKey: ["youtube-climb-link", country],
    queryFn: async () => {
      if (!country) return null;
      const { data } = await supabase
        .from("youtube_climbs")
        .select("video_url, video_id")
        .eq("country", country)
        .eq("status", "confirmed")
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!country,
  });

  if (!country) return null;

  const detail = peakDetails[country];
  const entry = countries.find((c) => c.country === country);

  if (!detail) return null;

  // Prefer hardcoded youtubeUrl, fallback to confirmed youtube_climbs entry
  const youtubeUrl = detail.youtubeUrl || youtubeClimb?.video_url || null;

  const statusLabel =
    entry?.status === "climbed"
      ? "✓ Summited"
      : entry?.status === "mainland_climbed"
      ? "◈ Mainland HP"
      : entry?.status === "visited"
      ? "◉ Country Visited"
      : "○ Not Yet";

  const statusColor =
    entry?.status === "climbed"
      ? "text-primary"
      : entry?.status === "mainland_climbed"
      ? "text-mainland"
      : entry?.status === "visited"
      ? "text-accent"
      : "text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-card border-border gap-0">
        <div className="relative h-48 w-full overflow-hidden bg-secondary">
          <PeakImage
            src={detail.photoUrl}
            alt={detail.peak}
            className="w-full h-full object-cover object-top"
            loading="lazy"
            width={1600}
            height={900}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <DialogTitle className="font-display text-xl font-bold text-foreground drop-shadow-lg">
              {detail.peak}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">{detail.country}</p>
              <UnMemberBadge unMember={entry?.unMember} />
            </div>
            {entry?.altNames?.length ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Also known as {entry.altNames.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className={`font-display font-bold text-sm ${statusColor}`}>
              {statusLabel}
              {entry?.year ? ` (${entry.year})` : ""}
            </span>
            <div className="flex items-center gap-2">
              {(() => {
                const diff = countryDifficulty[country];
                if (!diff) return null;
                const config = difficultyConfig[diff.difficulty];
                return (
                  <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-sm ${config.color} ${config.bgColor}`}>
                    {config.label}
                  </span>
                );
              })()}
              <span className="text-xs text-muted-foreground text-right">{detail.range}</span>
            </div>
          </div>
          {(() => {
            const diff = countryDifficulty[country];
            if (!diff?.difficultyNote) return null;
            return (
              <p className="text-xs text-muted-foreground italic">
                {diff.difficultyNote}
              </p>
            );
          })()}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary rounded-lg p-3 text-center">
              <Mountain className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="font-display text-sm font-bold text-foreground">{detail.elevation.toLocaleString()} m</p>
              <p className="text-xs text-muted-foreground">Elevation</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <ArrowUpRight className="w-4 h-4 mx-auto mb-1 text-ice" />
              <p className="font-display text-sm font-bold text-foreground">{detail.prominence.toLocaleString()} m</p>
              <p className="text-xs text-muted-foreground">Prominence</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <Navigation className="w-4 h-4 mx-auto mb-1 text-accent" />
              <p className="font-display text-xs font-bold text-foreground">
                {detail.coordinates.lat.toFixed(2)}°, {detail.coordinates.lng.toFixed(2)}°
              </p>
              <p className="text-xs text-muted-foreground">Location</p>
            </div>
          </div>

          <div className="bg-secondary rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">First Ascent</p>
                <p className="text-sm text-foreground">{detail.firstAscent}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{detail.description}</p>

          {personalNotes[country] && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-display font-bold text-primary uppercase tracking-wider">📝 Personal Note</p>
              <p className="text-sm text-foreground leading-relaxed italic">{personalNotes[country]}</p>
            </div>
          )}

          {country === "United Kingdom" && (
            <div className="bg-secondary rounded-lg p-3 space-y-2">
              <p className="text-xs font-display font-bold text-primary uppercase tracking-wider">
                🏴 Constituent Country Highpoints — all 4 complete
              </p>
              <ul className="space-y-2">
                {ukConstituentHighpoints.map((hp) => (
                  <li key={hp.nation} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-foreground">
                        <span className="font-display font-bold">{hp.nation}</span> — {hp.peak}
                      </span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {hp.elevation.toLocaleString()} m · {hp.date}
                      </span>
                    </div>
                    {hp.photos && hp.photos.length > 0 && (
                      <div className="space-y-2">
                        {hp.photos.map((photo, idx) => (
                          <figure key={idx} className="space-y-1">
                            <img
                              src={photo.url}
                              alt={photo.caption || `${hp.peak} summit in ${country}`}
                              loading="lazy"
                              decoding="async"
                              className="w-full rounded-md object-cover max-h-56"
                            />
                            {photo.caption && (
                              <figcaption className="text-[11px] text-muted-foreground italic">
                                {photo.caption}
                              </figcaption>
                            )}
                          </figure>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

            </div>
          )}


          {country === "Algeria" && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-accent shrink-0" />
                <p className="text-sm font-display font-bold text-accent">Closed for Climbing</p>
              </div>
              <p className="text-xs text-foreground">Mount Tahat is currently closed for climbing until further notice. Algerian authorities have restricted access to the Atakor plateau in the Hoggar Mountains.</p>
            </div>
          )}

          {advisoryDetails[country] && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm font-display font-bold text-destructive">Active Conflict</p>
              </div>
              <p className="text-xs text-foreground">{advisoryDetails[country].reason}</p>
              <p className="text-xs text-muted-foreground italic">{advisoryDetails[country].caution}</p>
              <a
                href={getNewsUrl(advisoryDetails[country].newsQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline mt-1"
              >
                Latest news <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {!advisoryDetails[country] && cautionNotes[country] && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-accent shrink-0" />
                <p className="text-sm font-display font-bold text-accent">Travel Caution</p>
              </div>
              <p className="text-xs text-foreground">{cautionNotes[country].note}</p>
              <a
                href={getNewsUrl(cautionNotes[country].newsQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline mt-1"
              >
                Latest news <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <PeakRefLinks peak={detail.peak} country={detail.country} youtubeUrl={youtubeUrl} />

          {youtubeUrl && (() => {
            const videoId = youtubeUrl.match(/(?:youtu\.be\/|v=)([^?&]+)/)?.[1];
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
            return (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-secondary hover:bg-secondary/80 rounded-lg overflow-hidden transition-colors group"
              >
                {thumbnailUrl && (
                  <div className="relative w-full aspect-video overflow-hidden">
                    <img
                      src={thumbnailUrl}
                      alt={`Summit video thumbnail for the high point of ${country}`}
                      className="w-full h-full object-cover"
                      width={480}
                      height={270}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                      <Youtube className="w-10 h-10 text-red-500 drop-shadow-lg" />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 p-3">
                  <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-sm font-display font-bold text-foreground group-hover:text-primary transition-colors">
                    Watch Summit Video
                  </span>
                </div>
              </a>
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
