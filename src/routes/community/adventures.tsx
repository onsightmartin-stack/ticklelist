import { createFileRoute } from "@tanstack/react-router";
import AdventuresPage from "@/pages/community/AdventuresPage";

export const Route = createFileRoute("/community/adventures")({
  component: AdventuresPage,
});
