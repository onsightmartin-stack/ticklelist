import Seo from "@/components/Seo";
import { Heart, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SUPPORT_LINKS } from "@/config/support";
import { openExternal, isNativeApp } from "@/lib/native";
import ticklelistLogo from "@/assets/ticklelist-logo.png";

const Support = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Seo
      title="Support the Expedition — Onsight Martin"
      description="Help fund the climb of every country's highest mountain: one-off tips, PayPal, or free ways to support the expedition."
      path="/support"
    />
    {!isNativeApp() && <Navbar />}

    <main className={`max-w-2xl mx-auto px-4 pb-24 ${isNativeApp() ? "pt-10" : "pt-28"}`}>
      <div className="flex items-center gap-4">
        <img
          src={ticklelistLogo}
          alt="Ticklelist logo"
          width={816}
          height={816}
          loading="lazy"
          className="w-14 h-14 shrink-0"
        />
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-display mb-1">Ticklelist</p>
          <h1 className="font-display text-2xl md:text-3xl tracking-wider">Support the expedition</h1>
        </div>
      </div>

      <p className="mt-4 text-muted-foreground">
        195 countries, one highpoint each — self-funded, mostly from a van. This
        page is about funding the climb itself: permits, ferries, fuel and the
        occasional mountain hut. Every contribution goes straight into getting
        to the next summit. Thank you 🏔️
      </p>

      <p className="mt-3 text-sm text-muted-foreground">
        Want to support the <strong>Ticklelist</strong> community and keep the
        app free instead?{" "}
        <a
          href="https://ticklelist.org/community/support"
          className="text-primary hover:underline"
        >
          Support the community →
        </a>
      </p>

      <div className="mt-8 space-y-3">
        {SUPPORT_LINKS.map((link) => (
          <Card key={link.id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-display tracking-wide">{link.label}</p>
              <p className="text-sm text-muted-foreground">{link.description}</p>
            </div>
            <Button onClick={() => openExternal(link.url)} className="shrink-0">
              <Heart className="w-4 h-4 mr-1" /> Support
              <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
            </Button>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Contributions are voluntary donations to an independent climber. They are not a purchase and unlock no
        paid features in the app.
      </p>
    </main>
  </div>
);

export default Support;
