import Seo from "@/components/Seo";
import { ArrowLeft, Scale } from "lucide-react";

import { Link } from "@/lib/router-compat";
import CommunityLayout from "@/components/community/CommunityLayout";
import DefinitionsPicker from "@/components/community/DefinitionsPicker";
import { Button } from "@/components/ui/button";

const DefinitionsPage = () => (
  <CommunityLayout>
    <Seo
      title="Challenge definitions — Ticklelist"
      description="Choose which definition of the country high points and the Seven Summits your progress is counted by."
      noindex
    />

    <div className="flex items-center gap-2 mb-2">
      <Scale className="w-5 h-5 text-primary" aria-hidden="true" />
      <h1 className="font-display text-2xl tracking-wider">Definitions</h1>
    </div>
    <p className="text-sm text-muted-foreground mb-6">
      Nobody agrees on how many countries there are, or which peak is Oceania's. Pick the definitions
      you count by — your goals, badges and profile boxes follow them. Saved on this device.
    </p>

    <DefinitionsPicker />

    <Button asChild variant="ghost" size="sm" className="mt-6">
      <Link to="/community/settings">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to settings
      </Link>
    </Button>
  </CommunityLayout>
);

export default DefinitionsPage;
