import { Fragment } from "react";
import { Link } from "@/lib/router-compat";

/** Matches @mentions, #hashtags and bare URLs in post/comment bodies. */
const TOKEN = /(https?:\/\/[^\s]+)|(@[a-zA-Z0-9_.-]{2,40})|(#[\p{L}0-9_-]{2,40})/gu;

interface Props {
  text: string;
  /** Called when a hashtag is clicked — wires the tag into the Wall search. */
  onTag?: ((tag: string) => void) | undefined;
  className?: string | undefined;
}

/**
 * Renders post text with clickable links, @mentions (to member search) and
 * #hashtags, so posts read like a normal social feed instead of flat text.
 */
const RichText = ({ text, onTag, className }: Props) => {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  TOKEN.lastIndex = 0;

  while ((match = TOKEN.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const [token] = match;

    if (token.startsWith("http")) {
      parts.push(
        <a
          key={`${match.index}-l`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline break-all"
        >
          {token}
        </a>,
      );
    } else if (token.startsWith("@")) {
      parts.push(
        <Link
          key={`${match.index}-m`}
          to={`/community/members?q=${encodeURIComponent(token.slice(1))}`}
          className="text-primary hover:underline"
        >
          {token}
        </Link>,
      );
    } else {
      parts.push(
        <button
          key={`${match.index}-t`}
          type="button"
          onClick={() => onTag?.(token.slice(1))}
          className="text-primary hover:underline"
        >
          {token}
        </button>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <p className={className}>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </p>
  );
};

export default RichText;
