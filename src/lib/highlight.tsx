import { Fragment, type ReactNode } from "react";

/**
 * Split `text` on each occurrence of `query` (case-insensitive) and wrap the
 * matching substrings in `<mark>` so the user can see *why* a suggestion
 * matched their input.
 *
 * Returns the original text untouched when the query is empty.
 */
export function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;

  // Escape regex special characters in the user query.
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(re);
  const needle = q.toLowerCase();

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === needle ? (
          <mark key={i} className="bg-transparent text-foreground font-semibold underline decoration-cyan-400 decoration-2 underline-offset-2">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
