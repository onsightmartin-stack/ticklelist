import { Link } from "@/lib/router-compat";
import { ArrowLeft } from "lucide-react";
import Seo from "@/components/Seo";
import Navbar from "@/components/Navbar";
import FeaturedPeaks from "@/components/FeaturedPeaks";

export default function FeaturedPeaksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Featured Peaks — Onsight Martin"
        description="A curated selection of country high points with route notes, elevation stats and trip reports from the mission to climb every country's highest mountain."
        path="/featured"
      />
      <Navbar />
      <main className="pt-24">
        <div className="container mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back home
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-6">
            Featured Peaks
          </h1>
          <Link
            to="/peak/scafell-pike"
            className="inline-block mt-4 px-4 py-3 bg-card border border-border rounded-sm hover:border-primary transition-colors"
          >
            <span className="font-display text-xs tracking-widest text-primary block">
              NEW — LATEST VIDEO
            </span>
            <span className="text-foreground text-sm">
              Scafell Pike (978 m) — highest mountain in England
            </span>
          </Link>

        </div>
        <FeaturedPeaks />
      </main>
    </div>
  );
}
