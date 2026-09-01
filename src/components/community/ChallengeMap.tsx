import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { coordsForKey } from "@/data/peak-coordinates";
import { findPeak } from "@/lib/peak-catalog";
import { findPlace } from "@/data/places";
import type { AdventureChallenge } from "@/data/adventure-challenges";

const BASE_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";
const LABELS_URL = "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>';

interface Props {
  challenge: AdventureChallenge;
  /** Catalog keys the current member has ticked (peak + place keys). */
  tickedKeys: Set<string>;
}

interface MapPoint {
  key: string;
  label: string;
  lat: number;
  lng: number;
  done: boolean;
}

const markerIcon = (done: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:${done ? 16 : 12}px;height:${done ? 16 : 12}px;border-radius:9999px;
      background:${done ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"};
      border:2px solid hsl(var(--background));
      opacity:${done ? 1 : 0.75};
      box-shadow:0 0 ${done ? "10px hsl(var(--primary))" : "4px rgba(0,0,0,0.5)"};
    "></div>`,
    iconSize: [done ? 16 : 12, done ? 16 : 12],
    iconAnchor: [done ? 8 : 6, done ? 8 : 6],
  });

const ChallengeMap = ({ challenge, tickedKeys }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const points = useMemo<MapPoint[]>(() => {
    const out: MapPoint[] = [];
    for (const p of challenge.peaks ?? []) {
      const coords = coordsForKey(p.key);
      if (!coords) continue;
      const peak = findPeak(p.key);
      out.push({
        key: p.key,
        label: peak?.name ?? p.key.replace(/^\w+:/, ""),
        lat: coords.lat,
        lng: coords.lng,
        done: tickedKeys.has(p.key) || (p.alt ?? []).some((k) => tickedKeys.has(k)),
      });
    }
    for (const k of challenge.places ?? []) {
      const coords = coordsForKey(k);
      if (!coords) continue;
      const place = findPlace(k);
      out.push({
        key: k,
        label: place?.name ?? k.replace(/^\w+:/, ""),
        lat: coords.lat,
        lng: coords.lng,
        done: tickedKeys.has(k),
      });
    }
    return out;
  }, [challenge, tickedKeys]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, { scrollWheelZoom: false, worldCopyJump: true }).setView([20, 10], 2);
    L.tileLayer(BASE_TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);
    const labelsPane = map.createPane("challengeLabels");
    labelsPane.style.zIndex = "450";
    labelsPane.style.pointerEvents = "none";
    L.tileLayer(LABELS_URL, { pane: "challengeLabels", className: "map-labels-white" }).addTo(map);

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
      padding: [40, 40],
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
        icon: markerIcon(p.done),
        zIndexOffset: p.done ? 500 : 0,
      });
      marker.bindPopup(
        `<strong>${p.label}</strong><br />${p.done ? "✅ Visited" : "📍 Not yet"}`,
      );
      marker.addTo(layer);
    }

    fitAll();
    setTimeout(() => map.invalidateSize(), 50);
  }, [points, fitAll]);

  const done = points.filter((p) => p.done).length;

  return (
    <div className="space-y-2">
      <div className="relative">
        <div ref={containerRef} className="h-[420px] w-full rounded-lg overflow-hidden border border-border z-0" />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={fitAll}
          disabled={points.length === 0}
          className="absolute top-2 right-2 z-[400] gap-1.5 shadow-md"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Fit all
        </Button>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary inline-block" /> Visited ({done})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground inline-block" /> Remaining (
          {points.length - done})
        </span>
      </div>
    </div>
  );
};

export default ChallengeMap;
