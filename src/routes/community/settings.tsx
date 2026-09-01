import { createFileRoute } from "@tanstack/react-router";
import SettingsPage from "@/pages/community/SettingsPage";

export const Route = createFileRoute("/community/settings")({
  component: SettingsPage,
});
