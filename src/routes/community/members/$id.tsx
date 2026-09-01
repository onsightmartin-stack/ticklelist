import { createFileRoute } from "@tanstack/react-router";
import MemberProfilePage from "@/pages/community/MemberProfilePage";

export const Route = createFileRoute("/community/members/$id")({
  component: MemberProfilePage,
});
