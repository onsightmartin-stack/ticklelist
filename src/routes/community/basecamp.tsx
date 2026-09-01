import { createFileRoute } from "@tanstack/react-router";
import BaseCampPage from "@/pages/community/BaseCampPage";

export const Route = createFileRoute("/community/basecamp")({
  component: BaseCampPage,
});
