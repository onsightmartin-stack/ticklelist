import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { breadcrumbSchema, crumbsFromPath, type Crumb } from "@/lib/structured-data";

const SITE_URL = "https://onsightmartin.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

/** Ticklelist community domain — used for community-page social cards. */
const COMMUNITY_URL = "https://ticklelist.org";
const COMMUNITY_IMAGE = `${COMMUNITY_URL}/og-image-ticklelist.jpg`;

/** True when this page belongs to the Ticklelist community section. */
const isCommunityPath = (path?: string) => !!path && path.startsWith("/community");

interface SeoProps {
  /** Unique <title>. Keep under ~60 characters. */
  title: string;
  /** Unique meta description. Keep under ~155 characters and lead with the benefit. */
  description: string;
  /** Route path this page owns, e.g. "/team". Required for indexable pages. */
  path?: string;
  image?: string;
  type?: "website" | "article";
  /** Private / member-only pages: no canonical, no indexing. */
  noindex?: boolean;
  /** Override the auto-generated breadcrumb trail. Pass null to omit it. */
  breadcrumbs?: Crumb[] | null;
  /** Friendly name for the final breadcrumb when auto-generating. */
  breadcrumbLeaf?: string;
  /** Extra JSON-LD blocks (Article, FAQPage, ...). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Emit only structured data — the route's head() owns the meta tags. */
  structuredDataOnly?: boolean;
  children?: ReactNode;
}


/**
 * Single source of truth for per-page head tags so titles, descriptions,
 * canonicals, social cards and structured data never duplicate across routes.
 */
const Seo = ({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  breadcrumbs,
  breadcrumbLeaf,
  jsonLd,
  structuredDataOnly = false,
  children,
}: SeoProps) => {
  const community = isCommunityPath(path);
  const resolvedImage = image ?? (community ? COMMUNITY_IMAGE : DEFAULT_IMAGE);
  const siteName = community ? "Ticklelist" : "Onsight Martin";
  const origin = community ? COMMUNITY_URL : SITE_URL;
  const url = path ? `${origin}${path}` : undefined;

  const crumbs =
    breadcrumbs === null
      ? null
      : breadcrumbs ??
        (!noindex && path && path !== "/" ? crumbsFromPath(path, breadcrumbLeaf) : null);

  const extraSchemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  if (structuredDataOnly) {
    return (
      <Helmet>
        {crumbs && crumbs.length > 1 && (
          <script type="application/ld+json">{JSON.stringify(breadcrumbSchema(crumbs))}</script>
        )}
        {extraSchemas.map((schema, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
        {children}
      </Helmet>
    );
  }

  return (
    <Helmet>
      <title>{title}</title>

      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && url && <link rel="canonical" href={url} />}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={resolvedImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />
      {crumbs && crumbs.length > 1 && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema(crumbs))}</script>
      )}
      {extraSchemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
      {children}
    </Helmet>
  );
};

export default Seo;
