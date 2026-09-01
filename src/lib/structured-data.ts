export const SITE_URL = "https://onsightmartin.com";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Onsight Martin",
  alternateName: "Onsight Martin — Country Highpointing",
  url: SITE_URL,
  logo: `${SITE_URL}/app-icon-512.png`,
  description:
    "Martin Gårdling's project to climb the highest mountain of every country on Earth.",
  founder: {
    "@type": "Person",
    name: "Martin Gårdling",
    url: "https://www.youtube.com/@onsightmartin",
  },
  sameAs: [
    "https://www.youtube.com/@onsightmartin",
    "https://www.instagram.com/onsightmartin",
    "https://www.peakbagger.com/climber/climber.aspx?cid=42297",
  ],
};

const LABEL_OVERRIDES: Record<string, string> = {
  latest: "Latest Climbs",
  "other-peaks": "Other Peaks",
  where: "Where Is Martin",
  peak: "Country Highpoints",
  community: "Ticklelist",
  nope: "Nope List",
};

function labelFor(segment: string): string {
  if (LABEL_OVERRIDES[segment]) return LABEL_OVERRIDES[segment];
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export interface Crumb {
  name: string;
  path: string;
}

/** Build crumbs from a route path, e.g. "/community/members" -> Home / Ticklelist / Members. */
export function crumbsFromPath(path: string, leafName?: string): Crumb[] {
  const segments = path.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ name: "Home", path: "/" }];
  let current = "";
  segments.forEach((segment, index) => {
    current += `/${segment}`;
    const isLeaf = index === segments.length - 1;
    crumbs.push({
      name: isLeaf && leafName ? leafName : labelFor(segment),
      path: current,
    });
  });
  return crumbs;
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path === "/" ? "" : crumb.path}`,
    })),
  };
}
