import { Link } from "@/lib/router-compat";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title?: string;
  description?: string;
}

/** Sign-in wall shown to signed-out visitors on member-only screens. */
const MembersOnly = ({
  title = "Members only",
  description = "Sign in to Ticklelist to see this — it's free and takes a few seconds.",
}: Props) => (
  <div className="rounded-lg border border-border bg-card p-8 text-center max-w-lg mx-auto">
    <div className="mx-auto w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
      <Lock className="w-5 h-5 text-primary" />
    </div>
    <h2 className="font-display text-xl tracking-wider mt-4">{title}</h2>
    <p className="text-sm text-muted-foreground mt-2">{description}</p>
    <div className="mt-5 flex flex-wrap gap-2 justify-center">
      <Button asChild>
        <Link to="/auth">Sign in</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/auth">Create an account</Link>
      </Button>
    </div>
  </div>
);

export default MembersOnly;
