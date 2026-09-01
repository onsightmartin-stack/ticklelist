import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trophy, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PeakSelector from "@/components/community/PeakSelector";
import { toast } from "@/hooks/use-toast";
import { usePosts } from "@/hooks/usePosts";
import { usePhotoContest } from "@/hooks/usePhotoContest";
import { uploadWallMedia } from "@/lib/wall-media";
import { celebrate } from "@/components/Celebration";
import { peakCountry } from "@/lib/peak-link";
import { slugify } from "@/lib/slug";

interface Props {
  userId: string;
  /** Called after a photo has been posted, so parent feeds can refresh. */
  onPosted?: () => void;
}

/**
 * Quick "submit a summit photo" form for the community page: pick a picture,
 * tag the peak and country, add a caption — it lands on the Wall feed.
 */
const SummitPhotoForm = ({ userId, onPosted }: Props) => {
  const { createPost } = usePosts();
  const { submitEntry } = usePhotoContest();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [peak, setPeak] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState("");
  const [caption, setCaption] = useState("");
  const [enterContest, setEnterContest] = useState(false);
  const [busy, setBusy] = useState(false);

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

  const reset = () => {
    clearFile();
    setPeak("");
    setCountry("");
    setDate("");
    setCaption("");
    setEnterContest(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "Choose a summit photo first", variant: "destructive" });
      return;
    }
    if (!peak.trim()) {
      toast({ title: "Add the peak name", variant: "destructive" });
      return;
    }

    setBusy(true);
    const uploaded = await uploadWallMedia(file, userId);
    if ("error" in uploaded) {
      setBusy(false);
      toast({ title: "Upload failed", description: uploaded.error, variant: "destructive" });
      return;
    }

    // PeakSelector already stores "Peak · Country" when a catalog peak is picked.
    const tag = peak.includes("·") || !country.trim() ? peak.trim() : `${peak.trim()} · ${country.trim()}`;
    const lines = [
      caption.trim(),
      date ? `Summit date: ${date}` : "",
    ].filter(Boolean);
    const body = lines.join("\n\n") || `Summit photo — ${tag}`;

    const ok = await createPost(body, tag, uploaded);
    if (!ok) {
      setBusy(false);
      return;
    }

    // Optionally enter the photo in the peak photo contest / featured rotation.
    if (enterContest) {
      const resolvedCountry = peakCountry(peak) ?? (country.trim() || null);
      const peakName = peak.includes("·") ? (peak.split("·")[0] ?? "").trim() : peak.trim();
      if (resolvedCountry) {
        const countrySlug = slugify(resolvedCountry);
        const entered = await submitEntry({
          countrySlug,
          country: resolvedCountry,
          peakName,
          photoUrl: uploaded.url,
          caption,
        });
        if (entered) {
          toast({ title: "Entered the photo contest 🏆", description: "Members can now vote for your shot." });
        }
      } else {
        toast({
          title: "Could not enter the contest",
          description: "Pick a recognized country high point to enter the contest.",
          variant: "destructive",
        });
      }
    }

    setBusy(false);
    reset();
    celebrate();
    toast({ title: "Summit photo posted 📷" });
    onPosted?.();
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" />
        <h2 className="font-display tracking-wider text-sm">Submit a summit photo</h2>
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
          <img src={preview} alt="Selected summit photo preview" className="w-full rounded-md border border-border" />
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
          <Label htmlFor="summit-photo-peak">Peak</Label>
          <PeakSelector value={peak} onChange={setPeak} placeholder="Search a peak or country" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="summit-photo-country">Country</Label>
          <Input
            id="summit-photo-country"
            value={country}
            maxLength={80}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Ireland"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="summit-photo-date">Summit date (optional)</Label>
        <Input
          id="summit-photo-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="sm:w-52"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="summit-photo-caption">Caption (optional)</Label>
        <Textarea
          id="summit-photo-caption"
          value={caption}
          maxLength={1000}
          rows={3}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Route, conditions, who you climbed with…"
        />
      </div>

      <label
        htmlFor="summit-photo-contest"
        className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 cursor-pointer hover:border-primary/50 transition-colors"
      >
        <input
          id="summit-photo-contest"
          type="checkbox"
          checked={enterContest}
          onChange={(e) => setEnterContest(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-primary"
        />
        <span className="space-y-0.5">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            Enter the photo contest
          </span>
          <span className="block text-xs text-muted-foreground">
            Submit this shot for the peak's featured-photo vote. The winning photo becomes the peak page's hero image.
          </span>
        </span>
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={reset} disabled={busy}>
          Clear
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          {busy ? "Posting…" : "Post photo"}
        </Button>
      </div>
    </form>
  );
};

export default SummitPhotoForm;
