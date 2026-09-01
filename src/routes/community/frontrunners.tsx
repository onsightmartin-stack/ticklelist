import { createFileRoute } from "@tanstack/react-router";
import FrontRunnersPage from "@/pages/community/FrontRunnersPage";

export const Route = createFileRoute("/community/frontrunners")({
  component: FrontRunnersPage,
});
