import { createFileRoute } from "@tanstack/react-router";
import WallPage from "@/pages/community/WallPage";

export const Route = createFileRoute("/community/wall")({
  component: WallPage,
});
