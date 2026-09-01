import { createFileRoute, redirect } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";
import Index from "@/pages/Index";

const COMMUNITY_HOSTS = ["ticklelist.org", "www.ticklelist.org"];

/**
 * Current request host — read from the browser on the client and from the
 * request on the server. createIsomorphicFn keeps the server-only import out
 * of the client bundle.
 */
const currentHost = createIsomorphicFn()
  .client(() => window.location.host.toLowerCase())
  .server(async () => {
    const { getRequestHost } = await import("@tanstack/react-start/server");
    return (getRequestHost() ?? "").toLowerCase();
  });


/**
 * When the community lives on its own domain (ticklelist.org), visiting that
 * domain's root should land on /community rather than the marketing homepage.
 * Checked on the server (via request host) so there is no flash of the homepage.
 */
export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const host = await currentHost();

    if (host && COMMUNITY_HOSTS.includes(host)) {
      throw redirect({ to: "/community" });
    }
  },

  component: Index,
});
