import { createFileRoute } from "@tanstack/react-router";
import MyAdventuresPage from "@/pages/community/MyAdventuresPage";

export const Route = createFileRoute("/community/my-adventures")({
  component: MyAdventuresPage,
});
