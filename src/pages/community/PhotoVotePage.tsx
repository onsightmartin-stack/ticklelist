import { useMemo, useRef, useState } from "react";
import { Camera, Crown, ImagePlus, Loader2, Pencil, Trash2, Trophy, Vote, X } from "lucide-react";

import Seo from "@/components/Seo";
import CommunityLayout from "@/components/community/CommunityLayout";
import MembersOnly from "@/components/community/MembersOnly";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityData } from "@/hooks/useCommunityData";
import { usePhotoContest } from "@/hooks/usePhotoContest";
import { countries } from "@/data/countries";
import { slugify } from "@/lib/slug";
import { uploadWallMedia } from "@/lib/wall-media";
import { daysLeft, leader, roundClosed, ROUND_DAYS, type PhotoEntry } from "@/lib/photo-contest";

/**
 * Summit photo contest — members submit a photo per country high point and
 * vote for their favourite. Each peak's round runs {ROUND_DAYS} days from its
 * first vote; the winner becomes that peak page's main image.
 */
const PhotoVotePage = () => {
  const { user } = useAuth();
  const { profiles } = useCommunityData();
  const { entries, rounds, myVotes, loading, submitEntry, vote, updateEntry, removeEntry } = usePhotoContest();

  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [country, setCountry] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  /** Inline edit state for one of my own entries. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startEdit = (entry: PhotoEntry) => {
    setEditingId(entry.id);
    setEditCaption(entry.caption ?? "");
    setConfirmDeleteId(null);
  };

  const saveEdit = async (entry: PhotoEntry, replacement?: File | null) => {
    if (!user) return;
    setEditBusy(true);
    let photoUrl: string | undefined;
    if (replacement) {
      const up = await uploadWallMedia(replacement, user.id);
      if ("error" in up) {
        toast({ title: "Upload failed", description: up.error, variant: "destructive" });
        setEditBusy(false);
        return;
      }
      photoUrl = up.url;
    }
    const ok = await updateEntry(entry, { caption: editCaption, ...(photoUrl ? { photoUrl } : {}) });
    setEditBusy(false);
    if (ok) setEditingId(null);
  };


  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.country.localeCompare(b.country)),
    [],
  );

  /** Entries grouped per peak, most-voted first. */
  const groups = useMemo(() => {
    const map = new Map<string, PhotoEntry[]>();
    entries.forEach((e) => {
      const list = map.get(e.country_slug) ?? [];
      list.push(e);
      map.set(e.country_slug, list);
    });
    return [...map.entries()]
      .map(([slug, list]) => ({
        slug,
        list: [...list].sort((a, b) => b.votes - a.votes || a.created_at.localeCompare(b.created_at)),
        round: rounds[slug],
      }))
      .sort((a, b) => b.list.length - a.list.length || a.slug.localeCompare(b.slug));
  }, [entries, rounds]);

  const pickFile = (picked: File | null) => {
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      toast({ title: "Pick an image file", variant: "destructive" });
      return;
    }
    setFile(picked);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(picked);
    });
  };

  const clearFile = () => {
    setFile(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return "";
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) {
      toast({ title: "Choose a summit photo first", variant: "destructive" });
      return;
    }
    const entryCountry = countries.find((c) => c.country === country);
    if (!entryCountry) {
      toast({ title: "Pick the country high point", variant: "destructive" });
      return;
    }

    setBusy(true);
    const uploaded = await uploadWallMedia(file, user.id);
    if ("error" in uploaded) {
      setBusy(false);
      toast({ title: "Upload failed", description: uploaded.error, variant: "destructive" });
      return;
    }

    const ok = await submitEntry({
      countrySlug: slugify(entryCountry.country),
      country: entryCountry.country,
      peakName: entryCountry.highPoint,
      photoUrl: uploaded.url,
      caption,
    });
    setBusy(false);
    if (ok) {
      clearFile();
      setCaption("");
      toast({ title: "Photo entered into the vote 📷" });
    }
  };

  return (
    <CommunityLayout>
      <Seo
        title="Summit Photo Vote — Ticklelist"
        description="Vote on member summit photos. Every peak's round runs 30 days from the first vote, and the winning shot becomes the main image on that high point's page."
        path="/community/photo-vote"
        noindex={!!user}
      />

      <header className="mb-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-display">Ticklelist</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-wider mt-2">Photo Vote</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Enter your best shot of a country high point and vote on everyone else's. Each peak's round runs{" "}
          {ROUND_DAYS} days from the moment its first vote is cast — when the clock runs out, the winning photo
          becomes the main image on that peak's page. 🏔️
        </p>
      </header>

      {!user && <MembersOnly description="Sign in to enter and vote on summit photos." />}
      {user && (
        <form onSubmit={submit} className="rounded-lg border border-border bg-card p-4 space-y-4 mb-8">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <h2 className="font-display tracking-wider text-sm">Enter a photo</h2>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />

            {preview ? (
              <div className="relative">
                <img src={preview} alt="Selected contest photo preview" className="w-full rounded-md border border-border" />
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Remove photo"
                  className="absolute top-2 right-2 rounded-full bg-background/80 border border-border p-1.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-md border border-dashed border-border py-8 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/60 transition-colors"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-sm">Choose a photo (max 50 MB)</span>
              </button>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contest-country">Country high point</Label>
                <select
                  id="contest-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select a country…</option>
                  {sortedCountries.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.country} — {c.highPoint}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contest-caption">Caption (optional)</Label>
                <Input
                  id="contest-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Summit ridge at sunrise…"
                />
              </div>
            </div>

            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              Enter photo
            </Button>
        </form>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading entries…</p>
      ) : groups.length === 0 ? (
        <p className="text-muted-foreground text-sm">No photos entered yet — be the first.</p>
      ) : (
        <div className="space-y-10">
          {groups.map(({ slug, list, round }) => {
            const closed = roundClosed(round);
            const top = leader(list);
            const left = daysLeft(round);
            return (
              <section key={slug}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                  <h2 className="font-display tracking-wider text-lg">
                    {list[0]!.peak_name} <span className="text-muted-foreground">· {list[0]!.country}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {!round
                      ? "Voting opens with the first vote"
                      : closed
                        ? "Round closed — winner locked in"
                        : `${left} day${left === 1 ? "" : "s"} left`}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((entry) => {
                    const mine = myVotes[entry.country_slug] === entry.id;
                    const won = closed && top?.id === entry.id;
                    return (
                      <article
                        key={entry.id}
                        className={`rounded-lg border bg-card overflow-hidden ${won ? "border-primary" : "border-border"}`}
                      >
                        <div className="relative">
                          <img
                            src={entry.photo_url}
                            alt={`${entry.peak_name} summit photo by ${profiles[entry.user_id]?.display_name ?? "a member"}`}
                            loading="lazy"
                            className="w-full aspect-[4/3] object-cover"
                          />
                          {won && (
                            <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-1 font-display tracking-wider">
                              <Crown className="w-3 h-3" /> Winner
                            </span>
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          {editingId === entry.id ? (
                            <div className="space-y-2">
                              <Label htmlFor={`caption-${entry.id}`} className="text-xs">Caption</Label>
                              <Input
                                id={`caption-${entry.id}`}
                                value={editCaption}
                                onChange={(e) => setEditCaption(e.target.value)}
                                placeholder="Say something about the shot"
                              />
                              <Label htmlFor={`replace-${entry.id}`} className="text-xs">Replace photo (optional)</Label>
                              <Input
                                id={`replace-${entry.id}`}
                                type="file"
                                accept="image/*"
                                onChange={(e) => void saveEdit(entry, e.target.files?.[0] ?? null)}
                                disabled={editBusy}
                              />
                              <div className="flex items-center gap-2">
                                <Button type="button" size="sm" disabled={editBusy} onClick={() => void saveEdit(entry)}>
                                  {editBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={editBusy}
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm">{entry.caption || "—"}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            by {profiles[entry.user_id]?.display_name ?? "Member"}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Trophy className="w-3.5 h-3.5" /> {entry.votes} vote{entry.votes === 1 ? "" : "s"}
                            </span>
                            <div className="flex items-center gap-1">
                              {user && entry.user_id === user.id && editingId !== entry.id && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  aria-label="Edit my photo"
                                  onClick={() => startEdit(entry)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {user && entry.user_id === user.id && (
                                confirmDeleteId === entry.id ? (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        setConfirmDeleteId(null);
                                        void removeEntry(entry);
                                      }}
                                    >
                                      Delete
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Remove my photo"
                                    onClick={() => setConfirmDeleteId(entry.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )
                              )}

                              <Button
                                type="button"
                                size="sm"
                                variant={mine ? "default" : "outline"}
                                disabled={!user || closed || mine}
                                onClick={() => vote(entry)}
                              >
                                <Vote className="w-3.5 h-3.5" />
                                {mine ? "Your vote" : closed ? "Closed" : "Vote"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </CommunityLayout>
  );
};

export default PhotoVotePage;
