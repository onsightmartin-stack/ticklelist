import { createFileRoute } from "@tanstack/react-router";
import AppearancePage from "@/pages/community/AppearancePage";

export const Route = createFileRoute("/community/appearance")({
  component: AppearancePage,
});
