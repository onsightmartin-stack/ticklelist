import type { ReactNode } from "react";
import { Link } from "@/lib/router-compat";
import { isNativeApp, openExternal } from "@/lib/native";

interface CrossSiteLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
  title?: string;
}

/**
 * Renders a normal in-app link for internal paths, and a real anchor
 * (new tab) when the target lives on the other site's domain.
 */
const CrossSiteLink = ({ href, className, children, onClick, ...rest }: CrossSiteLinkProps) => {
  const isExternal = /^https?:\/\//i.test(href);

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={(event) => {
          if (isNativeApp()) {
            event.preventDefault();
            void openExternal(href);
          }
          onClick?.();
        }}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
};

export default CrossSiteLink;
