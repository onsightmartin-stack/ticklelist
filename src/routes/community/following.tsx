import { createFileRoute } from "@tanstack/react-router";
import FollowingPage from "@/pages/community/FollowingPage";

export const Route = createFileRoute("/community/following")({
  component: FollowingPage,
});
