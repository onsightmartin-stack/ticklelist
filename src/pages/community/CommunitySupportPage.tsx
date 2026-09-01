import { Heart, ExternalLink, Server, Gift, Users } from "lucide-react";

import Seo from "@/components/Seo";
import CommunityLayout from "@/components/community/CommunityLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { COMMUNITY_SUPPORT_LINKS } from "@/config/community-support";
import { openExternal } from "@/lib/native";

const title = "Support the Ticklelist Community — Ticklelist";
const description =
  "Ticklelist is free and ad-free, funded entirely by its founder. Help keep the community running — chip in toward server and hosting costs, or support us for free by subscribing on YouTube.";

/** Community support: help keep Ticklelist free and ad-free. */
const CommunitySupportPage = () => (
  <CommunityLayout>
    <Seo title={title} description={description} path="/community/support" />

    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Heart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-display mb-1">
            Ticklelist
          </p>
          <h1 className="font-display text-2xl md:text-3xl tracking-wider">
            Support the community
          </h1>
        </div>
      </div>

      <p className="mt-4 text-muted-foreground">
        Ticklelist is — and always will be — free to use. There are no ads, no
        paywalls, and no premium tiers locking you out of your own adventures.
        Right now the whole thing is funded out of pocket by Martin, the
        climber behind the project. If Ticklelist has helped you log a summit,
        plan a trip, or find climbing partners, you can help keep it running.
      </p>

      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <Server className="w-5 h-5 text-primary mb-2" />
          <p className="font-display tracking-wide text-sm">Server & hosting</p>
          <p className="text-xs text-muted-foreground mt-1">
            Database, storage and app hosting costs add up every month.
          </p>
        </Card>
        <Card className="p-4">
          <Users className="w-5 h-5 text-primary mb-2" />
          <p className="font-display tracking-wide text-sm">Free for everyone</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your support helps keep Ticklelist free and ad-free for all members.
          </p>
        </Card>
        <Card className="p-4">
          <Gift className="w-5 h-5 text-primary mb-2" />
          <p className="font-display tracking-wide text-sm">Voluntary</p>
          <p className="text-xs text-muted-foreground mt-1">
            No pressure, no perks locked behind a paywall. Just community.
          </p>
        </Card>
      </div>

      <h2 className="mt-8 font-display text-lg tracking-wide">Ways to chip in</h2>
      <div className="mt-3 space-y-3">
        {COMMUNITY_SUPPORT_LINKS.map((link) => (
          <Card key={link.id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-display tracking-wide">{link.label}</p>
              <p className="text-sm text-muted-foreground">{link.description}</p>
            </div>
            <Button
              onClick={() => openExternal(link.url)}
              className="shrink-0"
            >
              <Heart className="w-4 h-4 mr-1" /> Support
              <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
            </Button>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Contributions are voluntary donations toward keeping the Ticklelist
        community running. They are not a purchase and unlock no paid features
        in the app. Want to support the climbing expedition itself? Visit{" "}
        <a
          href="https://onsightmartin.com/support"
          className="text-primary hover:underline"
        >
          Onsight Martin — Support the expedition
        </a>
        .
      </p>
    </div>
  </CommunityLayout>
);

export default CommunitySupportPage;
