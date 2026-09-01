import { createFileRoute } from "@tanstack/react-router";
import LeaderboardPage from "@/pages/community/LeaderboardPage";

export const Route = createFileRoute("/community/leaderboard")({
  component: LeaderboardPage,
});
