import { createFileRoute } from "@tanstack/react-router";
import ModerationPage from "@/pages/community/ModerationPage";

export const Route = createFileRoute("/community/moderation")({
  component: ModerationPage,
});
