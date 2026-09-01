import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BASE_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";
const LABELS_URL = "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>';

interface Props {
  lat: number;
  lng: number;
  label: string;
  zoom?: number;
  className?: string;
}

/** Single-marker Leaflet preview used on peak detail pages. */
const PeakMapPreview = ({ lat, lng, label, zoom = 10, className }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, { scrollWheelZoom: false }).setView([lat, lng], zoom);
    L.tileLayer(BASE_TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
    const pane = map.createPane("peakLabels");
    pane.style.zIndex = "450";
    pane.style.pointerEvents = "none";
    L.tileLayer(LABELS_URL, { pane: "peakLabels", className: "map-labels-white" }).addTo(map);

    L.marker([lat, lng], {
      icon: L.divIcon({
        className: "",
        html: `<div style="
          width:18px;height:18px;border-radius:9999px;
          background:hsl(var(--primary));
          border:2px solid hsl(var(--background));
          box-shadow:0 0 12px hsl(var(--primary));
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    })
      .addTo(map)
      .bindTooltip(label, { direction: "top", offset: [0, -12] });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, zoom, label]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-[360px] w-full overflow-hidden rounded-lg border border-border"}
      aria-label={`Map showing the location of ${label}`}
    />
  );
};

export default PeakMapPreview;
