import { createFileRoute } from "@tanstack/react-router";
import NotificationPrefsPage from "@/pages/community/NotificationPrefsPage";

export const Route = createFileRoute("/community/notifications/settings")({
  component: NotificationPrefsPage,
});
