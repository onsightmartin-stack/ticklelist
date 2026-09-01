import { createFileRoute } from "@tanstack/react-router";
import MembersPage from "@/pages/community/MembersPage";

export const Route = createFileRoute("/community/members/")({
  component: MembersPage,
});
