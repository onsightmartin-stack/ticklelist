import Seo from "@/components/Seo";
import { MapPin, Navigation } from "lucide-react";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import JourneyMap from "@/components/LazyJourneyMap";

const WhereIsMartin = () => {
  const { data: location } = useCurrentLocation();

  const dateLabel = location
    ? format(new Date(location.recorded_at), "MMM d, yyyy")
    : "";

  return (
    <>
      <Seo
        title="Where is Martin? — Live Expedition Tracker"
        description="See Martin's latest tracked position and the route so far on the way to the highest mountain of every country on Earth."
        path="/where"
      />
      <Navbar />
      <div className="min-h-screen bg-background pt-16">
        {/* Hero Banner */}
        <div className="relative w-full overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 1200 500" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
              <ellipse cx="280" cy="220" rx="120" ry="90" fill="currentColor" />
              <ellipse cx="320" cy="340" rx="60" ry="80" fill="currentColor" />
              <ellipse cx="580" cy="200" rx="80" ry="110" fill="currentColor" />
              <ellipse cx="620" cy="340" rx="50" ry="60" fill="currentColor" />
              <ellipse cx="780" cy="220" rx="140" ry="100" fill="currentColor" />
              <ellipse cx="1020" cy="350" rx="80" ry="50" fill="currentColor" />
            </svg>
          </div>

          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-8 text-center md:py-10">
            <div className="flex items-center gap-2 rounded-full border border-current/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium tracking-wide uppercase">
              <Navigation className="h-4 w-4" />
              Live Tracking
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl font-display">
              Where is Martin?
            </h1>
            <p className="max-w-xl text-lg opacity-80">
              Follow Martin's journey across the globe
            </p>

            {dateLabel && (
              <div className="mt-2 flex items-center gap-2 text-sm opacity-70">
                <MapPin className="h-4 w-4" />
                <span>📍 Last updated: <strong>{dateLabel}</strong></span>
              </div>
            )}
          </div>
        </div>

        <JourneyMap />
      </div>
    </>
  );
};

export default WhereIsMartin;
