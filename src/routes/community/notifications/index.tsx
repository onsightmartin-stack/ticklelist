import { createFileRoute } from "@tanstack/react-router";
import NotificationsPage from "@/pages/community/NotificationsPage";

export const Route = createFileRoute("/community/notifications/")({
  component: NotificationsPage,
});
