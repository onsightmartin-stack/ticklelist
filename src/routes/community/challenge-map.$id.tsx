import { createFileRoute } from "@tanstack/react-router";
import ChallengeMapPage from "@/pages/community/ChallengeMapPage";

export const Route = createFileRoute("/community/challenge-map/$id")({
  component: ChallengeMapPage,
});
