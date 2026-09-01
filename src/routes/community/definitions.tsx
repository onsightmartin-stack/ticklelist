import { createFileRoute } from "@tanstack/react-router";
import DefinitionsPage from "@/pages/community/DefinitionsPage";

export const Route = createFileRoute("/community/definitions")({
  component: DefinitionsPage,
});
