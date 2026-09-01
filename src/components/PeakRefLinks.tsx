import { ExternalLink, MapPin, Youtube } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import { usePeakCoords } from "@/hooks/usePeakCoords";
import { googleMapsUrl } from "@/lib/peak-coords";


interface Props {
  /** Peak name, e.g. "Mont Blanc" */
  peak: string;
  /** Country the peak belongs to — sharpens the search queries */
  country?: string | undefined;
  /** Direct summit video, when one exists */
  youtubeUrl?: string | null | undefined;
  className?: string | undefined;
}

const summitpostUrl = (peak: string) =>
  `https://www.summitpost.org/object_list.php?object_type=1&search_query=${encodeURIComponent(peak)}`;

const peakbaggerUrl = (peak: string) =>
  `https://www.peakbagger.com/search.aspx?tid=P&ss=${encodeURIComponent(peak)}`;

const youtubeSearchUrl = (peak: string, country?: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `Onsight Martin ${peak}${country ? ` ${country}` : ""}`,
  )}`;

/** Quick reference links (Summitpost, Peakbagger, YouTube) for a summit. */
const PeakRefLinks = ({ peak, country, youtubeUrl, className = "" }: Props) => {
  const coords = usePeakCoords(peak);
  const link =
    "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary hover:underline";

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`}>
      <a
        href={googleMapsUrl(coords, peak, country)}
        target="_blank"
        rel="noopener noreferrer"
        className={link}
        title={coords ? `${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}` : "Search Google Maps"}
      >
        <MapPin className="h-3 w-3 text-primary" /> {coords ? "Map" : "Find on map"}
      </a>
      <a href={summitpostUrl(peak)} target="_blank" rel="noopener noreferrer" className={link}>
        <ExternalLink className="h-3 w-3" /> Summitpost
      </a>
      <a href={peakbaggerUrl(peak)} target="_blank" rel="noopener noreferrer" className={link}>
        <ExternalLink className="h-3 w-3" /> Peakbagger
      </a>
      <TrackedLink
        href={youtubeUrl || youtubeSearchUrl(peak, country)}
        kind={youtubeUrl ? "youtube_video" : "youtube_search"}
        trackLabel={`${peak}${country ? ` (${country})` : ""}`}
        className={link}
      >
        <Youtube className="h-3 w-3 text-red-500" /> {youtubeUrl ? "Summit video" : "YouTube"}
      </TrackedLink>

    </div>
  );
};

export default PeakRefLinks;
