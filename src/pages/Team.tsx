import { Mountain, Instagram, ArrowLeft } from "lucide-react";
import { Link } from "@/lib/router-compat";
import Seo from "@/components/Seo";
import Navbar from "@/components/Navbar";
import teamMiniRevolution from "@/assets/team-mrg-logo.jpg";
import martinPhoto from "@/assets/martin-summit.jpg";
import ajGladPhoto from "@/assets/team-aj-glad.jpg";

interface TeamMember {
  name: string;
  handle?: string;
  role: string;
  origin: string;
  bio: string;
  photo?: string;
  placeholder?: string;
}

const team: TeamMember[] = [
  {
    name: "Martin",
    role: "Founder & Climber",
    origin: "Sweden 🇸🇪",
    bio: "The man behind the mission — summiting every country highpoint on Earth. 55 countries visited, countless summits conquered, and the journey is far from over. But it's not the mountain you conquer, you only conquer yourself.",
    photo: martinPhoto,
  },
  {
    name: "@minirevolutiongames",
    role: "Editor",
    origin: "Poland 🇵🇱",
    bio: "The creative force turning raw summit footage into cinematic storytelling. Masked, mysterious, and masterful with the edit.",
    photo: teamMiniRevolution,
  },
  {
    name: "@aj_glad",
    role: "TikTok Manager",
    origin: "New Zealand / Kenya 🇳🇿🇰🇪",
    bio: "Bringing the highpoint journey to the short-form world — crafting viral moments from epic adventures across two hemispheres.",
    photo: ajGladPhoto,
  },
];

const Team = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title="The Team Behind Onsight Martin"
        description="Meet the climbers, planners and volunteers making the country highpointing project possible — and how to get involved."
        path="/team"
      />
      <Navbar />
      {/* Header */}
      <header className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 to-background" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mountain className="w-8 h-8 text-accent" />
            <h1 className="font-oswald text-4xl md:text-5xl font-bold tracking-tight uppercase">
              The Team
            </h1>
          </div>
          <p className="font-source text-muted-foreground max-w-xl mx-auto text-lg">
            The people &amp; volunteers making the Country Highpoints Project possible.
          </p>
        </div>
      </header>

      {/* Team Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-20 -mt-4">
        <div className="grid gap-8 md:grid-cols-3">
          {team.map((member) => (
            <div
              key={member.name}
              className="group bg-card border border-border rounded-lg overflow-hidden hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5"
            >
              {/* Photo */}
              <div className="aspect-square overflow-hidden bg-secondary">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={`${member.name}, ${member.role} of the Onsight Martin project`}
                    decoding="async"
                    loading="lazy"
                    width={512}
                    height={512}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-oswald text-6xl font-bold text-muted-foreground/30">
                      {member.placeholder}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5">
                <h2 className="font-oswald text-xl font-semibold text-foreground mb-1">
                  {member.name}
                </h2>
                <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-1">
                  {member.role}
                </p>
                <p className="text-muted-foreground text-xs mb-3">{member.origin}</p>
                <p className="font-source text-sm text-secondary-foreground leading-relaxed">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center border border-border rounded-lg p-8 bg-card/50">
          <h3 className="font-oswald text-2xl font-bold mb-2">Want to Join?</h3>
          <p className="text-muted-foreground font-source max-w-md mx-auto">
            We're always looking for passionate volunteers — videographers, editors, translators, and adventure lovers.
          </p>
          <a
            href="https://www.instagram.com/countryhighpoints"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-accent text-accent-foreground rounded-sm font-oswald uppercase tracking-wider text-sm hover:bg-accent/80 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
};

export default Team;
