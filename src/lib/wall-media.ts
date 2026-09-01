import { supabase } from "@/integrations/supabase/client";

export type MediaType = "image" | "video" | "youtube";

export const MEDIA_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

/** Extract a YouTube video id from any common URL shape. */
export const youtubeId = (url: string): string | null => {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1]! : null;
};

/** Upload a picture or video to the private wall bucket and return a long-lived signed URL. */
export const uploadWallMedia = async (
  file: File,
  userId: string,
): Promise<{ url: string; type: MediaType } | { error: string }> => {
  if (file.size > MEDIA_MAX_BYTES) return { error: "File is too large (max 50 MB)" };
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) return { error: "Only pictures and videos can be attached" };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? (isVideo ? "mp4" : "jpg");
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("wall-media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: error.message };

  const { data, error: signError } = await supabase.storage
    .from("wall-media")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signError || !data?.signedUrl) return { error: signError?.message ?? "Could not link the file" };

  return { url: data.signedUrl, type: isVideo ? "video" : "image" };
};
