import { Link } from "@/lib/router-compat";
import { ArrowLeft, ArrowRight, Mountain } from "lucide-react";
import Seo from "@/components/Seo";
import Navbar from "@/components/Navbar";
import { guides } from "@/data/guides";

export default function GuidesIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Highpointing Guides & Lists — Onsight Martin"
        description="Ranked lists and guides to the world's country highpoints: the full list, the Seven Summits, every continent, the easiest and hardest peaks and the great volcanoes."
        path="/guides"
        structuredDataOnly
      />

      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back home
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-6">
            Highpointing Guides
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Ranked lists of the highest mountain in every country — sorted by elevation, difficulty
            and how good a first summit they make. Every peak links to its own route page.
          </p>

          <div className="grid gap-4 md:grid-cols-2 mt-10">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                to={`/guides/${guide.slug}`}
                className="group bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Mountain className="w-5 h-5 text-primary shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {guide.heading}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">{guide.description}</p>
                    <span className="inline-flex items-center gap-1 text-sm text-primary mt-3">
                      Read the list <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
