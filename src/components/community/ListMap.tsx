import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { coordsForKey } from "@/data/peak-coordinates";
import { findPeak } from "@/lib/peak-catalog";
import type { PeakList } from "@/data/peak-lists";

const BASE_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";
const LABELS_URL = "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>';

interface Props {
  list: PeakList;
  /** Catalog keys the current member has ticked. */
  climbedKeys: Set<string>;
}

interface MapPoint {
  key: string;
  label: string;
  elevation?: string | undefined;
  lat: number;
  lng: number;
  climbed: boolean;
}

const summitIcon = (climbed: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:${climbed ? 16 : 12}px;height:${climbed ? 16 : 12}px;border-radius:9999px;
      background:${climbed ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"};
      border:2px solid hsl(var(--background));
      opacity:${climbed ? 1 : 0.75};
      box-shadow:0 0 ${climbed ? "10px hsl(var(--primary))" : "4px rgba(0,0,0,0.5)"};
    "></div>`,
    iconSize: [climbed ? 16 : 12, climbed ? 16 : 12],
    iconAnchor: [climbed ? 8 : 6, climbed ? 8 : 6],
  });

const ListMap = ({ list, climbedKeys }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const points = useMemo<MapPoint[]>(() => {
    const out: MapPoint[] = [];
    for (const entry of list.entries) {
      const coords = coordsForKey(entry.key);
      if (!coords) continue;
      const peak = findPeak(entry.key);
      const climbed =
        climbedKeys.has(entry.key) || (entry.alt ?? []).some((k) => climbedKeys.has(k));
      out.push({
        key: entry.key,
        label: peak
          ? peak.type === "country_highpoint"
            ? `${peak.country} — ${peak.name}`
            : peak.name
          : entry.key.slice(3),
        elevation: peak?.elevation,
        lat: coords.lat,
        lng: coords.lng,
        climbed,
      });
    }
    return out;
  }, [list, climbedKeys]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, { scrollWheelZoom: false, worldCopyJump: true }).setView([20, 10], 2);
    L.tileLayer(BASE_TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
    const labelsPane = map.createPane("listLabels");
    labelsPane.style.zIndex = "450";
    labelsPane.style.pointerEvents = "none";
    L.tileLayer(LABELS_URL, { pane: "listLabels", className: "map-labels-white" }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  const fitAll = useCallback(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), {
      padding: [30, 30],
      maxZoom: 8,
      animate: true,
    });
  }, [points]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    for (const p of points) {
      const marker = L.marker([p.lat, p.lng], {
        icon: summitIcon(p.climbed),
        zIndexOffset: p.climbed ? 500 : 0,
      });
      marker.bindPopup(
        `<strong>${p.label}</strong><br />${p.elevation ?? ""}${p.elevation ? "<br />" : ""}${
          p.climbed ? "✅ Climbed" : "⛰️ Not yet"
        }`,
      );
      marker.addTo(layer);
    }

    fitAll();
    // Leaflet needs a nudge when the container was hidden while collapsed
    setTimeout(() => map.invalidateSize(), 50);
  }, [points, fitAll]);

  const mapped = points.length;
  const climbed = points.filter((p) => p.climbed).length;

  return (
    <div className="space-y-2">
      <div className="relative">
        <div ref={containerRef} className="h-[320px] w-full rounded-lg overflow-hidden border border-border z-0" />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={fitAll}
          disabled={mapped === 0}
          className="absolute top-2 right-2 z-[400] gap-1.5 shadow-md"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Fit to all high points
        </Button>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary inline-block" /> Climbed ({climbed})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground inline-block" /> Remaining (
          {mapped - climbed})
        </span>
        {mapped < list.entries.length && (
          <span>{list.entries.length - mapped} summits without coordinates yet</span>
        )}
      </div>
    </div>
  );

};

export default ListMap;
