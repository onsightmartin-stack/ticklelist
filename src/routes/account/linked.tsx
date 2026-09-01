import { createFileRoute } from "@tanstack/react-router";
import LinkedAccounts from "@/pages/LinkedAccounts";

export const Route = createFileRoute("/account/linked")({
  component: LinkedAccounts,
});
