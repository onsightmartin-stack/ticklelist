import { createFileRoute } from "@tanstack/react-router";
import AscentsPage from "@/pages/community/AscentsPage";

export const Route = createFileRoute("/community/ascents")({
  component: AscentsPage,
});
