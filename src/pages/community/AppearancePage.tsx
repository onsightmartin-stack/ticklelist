import Seo from "@/components/Seo";
import { Link } from "@/lib/router-compat";
import { ArrowLeft, Gauge, Palette, Zap } from "lucide-react";
import CommunityLayout from "@/components/community/CommunityLayout";
import ThemePicker from "@/components/community/ThemePicker";
import MotionPicker from "@/components/community/MotionPicker";
import QualityPicker from "@/components/community/QualityPicker";
import { Button } from "@/components/ui/button";

const AppearancePage = () => (
  <CommunityLayout>
    <Seo
      title="Appearance & Themes — Ticklelist"
      description="Pick the look of Onsight Martin: dark alpine, midnight black, snowline white, granite grey, steampunk or flower power."
      noindex
    />

    <div className="flex items-center gap-2 mb-2">
      <Palette className="w-5 h-5 text-primary" />
      <h1 className="font-display text-2xl tracking-wider">Appearance</h1>
    </div>
    <p className="text-sm text-muted-foreground mb-6">
      Choose a theme for the whole site. Your pick is saved on this device and applies everywhere —
      not just the community.
    </p>

    <ThemePicker />

    <div className="flex items-center gap-2 mt-10 mb-2">
      <Gauge className="w-5 h-5 text-primary" aria-hidden="true" />
      <h2 className="font-display text-xl tracking-wider">Motion sensitivity</h2>
    </div>
    <p className="text-sm text-muted-foreground mb-4">
      Control animations explicitly — override your device's reduced-motion setting in either
      direction. Saved on this device.
    </p>

    <MotionPicker />

    <div className="flex items-center gap-2 mt-10 mb-2">
      <Zap className="w-5 h-5 text-primary" aria-hidden="true" />
      <h2 className="font-display text-xl tracking-wider">Performance quality</h2>
    </div>
    <p className="text-sm text-muted-foreground mb-4">
      Controls how sharply the 3D climber avatars render and whether their stage backdrop is drawn.
      Lower settings mean smoother motion on slower devices. Saved on this device.
    </p>

    <QualityPicker />

    <Button asChild variant="ghost" size="sm" className="mt-6">
      <Link to="/community/settings">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to settings
      </Link>
    </Button>
  </CommunityLayout>
);

export default AppearancePage;
