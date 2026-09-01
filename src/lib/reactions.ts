/** Facebook-style reaction set for Wall posts. */
export const REACTIONS = [
  { key: "like", emoji: "👍", label: "Like" },
  { key: "love", emoji: "❤️", label: "Love" },
  { key: "strong", emoji: "💪", label: "Strong" },
  { key: "fire", emoji: "🔥", label: "Fire" },
  { key: "wow", emoji: "😮", label: "Wow" },
  { key: "haha", emoji: "😂", label: "Haha" },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]["key"];

export const reactionEmoji = (key: string) =>
  REACTIONS.find((r) => r.key === key)?.emoji ?? "👍";

export const reactionLabel = (key: string) =>
  REACTIONS.find((r) => r.key === key)?.label ?? "Like";
