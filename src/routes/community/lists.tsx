import { createFileRoute, redirect } from "@tanstack/react-router";

/** Retired page — challenge lists now live inside My adventures. */
export const Route = createFileRoute("/community/lists")({
  beforeLoad: () => {
    throw redirect({ to: "/community/my-adventures" });
  },
});
