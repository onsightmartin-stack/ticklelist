import { supabase } from "@/integrations/supabase/client";
import { avatarDataUrl, decodeAvatarConfig } from "@/lib/avatar-builder";


export type TimingType = "exact" | "month" | "year" | "anytime" | "asap";

export interface Adventure {
  id: string;
  creator_id: string;
  peak_name: string;
  country: string | null;
  elevation: string | null;
  timing_type: TimingType;
  target_date: string | null;
  target_month: number | null;
  target_year: number | null;
  difficulty: string | null;
  max_group_size: number | null;
  meeting_point: string | null;
  notes: string | null;
  created_at: string;
}

export interface Signup {
  id: string;
  adventure_id: string;
  user_id: string;
  status: "interested" | "joining" | "invited";
  message?: string | null;
}

export interface PublicProfile {
  id: string;
  display_name: string;
  country: string | null;
  avatar_url: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const formatTiming = (a: Adventure): string => {
  switch (a.timing_type) {
    case "exact":
      return a.target_date
        ? new Date(a.target_date + "T00:00:00").toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Date TBD";
    case "month":
      return a.target_month && a.target_year
        ? `${MONTHS[a.target_month - 1]} ${a.target_year}`
        : "Month TBD";
    case "year":
      return a.target_year ? `Sometime in ${a.target_year}` : "Year TBD";
    case "asap":
      return "ASAP";
    default:
      return "Any time";
  }
};

const signedUrlCache = new Map<string, string>();

/** Avatars live in a private bucket, so resolve a signed URL for display. */
export const resolveAvatarUrl = async (path: string | null): Promise<string | null> => {
  if (!path) return null;
  // Designed avatars are stored as an encoded config, not a file.
  const designed = decodeAvatarConfig(path);
  if (designed) return avatarDataUrl(designed, designed.animated !== false);
  if (path.startsWith("http")) return path;

  if (signedUrlCache.has(path)) return signedUrlCache.get(path)!;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 7);
  if (!data?.signedUrl) return null;
  signedUrlCache.set(path, data.signedUrl);
  return data.signedUrl;
};

export const clearAvatarCache = (path: string | null) => {
  if (path) signedUrlCache.delete(path);
};
