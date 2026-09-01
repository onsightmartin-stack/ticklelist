import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useLocationHistory } from "@/hooks/useLocationHistory";
import { format } from "date-fns";
import { Maximize2, Minimize2 } from "lucide-react";
import vanIcon from "@/assets/van-icon.png";

const MAP_ZOOM = 6;
const BASE_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";
const LABELS_URL = "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/">CARTO</a>';

function createVanIcon(size: number) {
  const half = size / 2;
  return L.divIcon({
    className: "",
    html: `<div style="
      width: ${size}px; height: ${size}px;
      animation: vanDrop 900ms cubic-bezier(0.34, 1.3, 0.64, 1) both, vanBounce 2s ease-in-out 900ms infinite;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
    ">
      <img src="${vanIcon}" alt="" aria-hidden="true" style="width:100%;height:100%;object-fit:contain;" />
    </div>
    <style>
      @keyframes vanBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @keyframes vanDrop {
        0% { transform: scale(2.2); }
        100% { transform: scale(1); }
      }
    </style>`,
    iconSize: [size, size],
    iconAnchor: [half, half],
  });
}


const JourneyMap = () => {
  const { data: location } = useCurrentLocation();
  const { data: history } = useLocationHistory();
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const lat = location?.lat ?? 57.7089;
  const lng = location?.lng ?? 11.9746;
  const dateLabel = location ? format(new Date(location.recorded_at), "MMM d, yyyy 'at' HH:mm") : "Fetching latest location...";
  const popupContent = location
    ? `<strong>📍 Martin is here</strong><br />${lat.toFixed(4)}, ${lng.toFixed(4)}`
    : "<strong>📍 Locating Martin...</strong>";

  useEffect(() => {
    const container = mapElementRef.current;

    if (!container || mapRef.current) return;

    const map = L.map(container, {
      scrollWheelZoom: true,
      zoomControl: true,
    }).setView([lat, lng], MAP_ZOOM);

    L.tileLayer(BASE_TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      className: "journey-map-base",
    }).addTo(map);

    // Override: add white labels layer on top
    const labelsPane = map.createPane("labelsPane");
    labelsPane.style.zIndex = "450";
    labelsPane.style.pointerEvents = "none";
    L.tileLayer(LABELS_URL, {
      pane: "labelsPane",
      className: "map-labels-white",
    }).addTo(map);

    // Route pane sits above tiles/labels so the journey line is always visible
    const routePane = map.createPane("routePane");
    routePane.style.zIndex = "460";
    routePane.style.pointerEvents = "none";

    const marker = L.marker([lat, lng], { icon: createVanIcon(130) }).addTo(map);
    marker.bindPopup(popupContent);

    mapRef.current = map;
    markerRef.current = marker;

    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const nextPosition: L.LatLngExpression = [lat, lng];

    markerRef.current.setLatLng(nextPosition);
    markerRef.current.bindPopup(popupContent);
    mapRef.current.setView(nextPosition, MAP_ZOOM);
  }, [lat, lng, popupContent]);

  // Draw route polyline from location history
  useEffect(() => {
    if (!mapRef.current || !history || history.length < 2) return;

    const coords: L.LatLngExpression[] = history.map((p) => [p.lat, p.lng]);

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(coords);
      // Keep the shadow-sm line in sync if it exists
      const shadowLine = (polylineRef.current as any)._shadowLine as L.Polyline | undefined;
      shadowLine?.setLatLngs(coords);
    } else {
      // Wide dark shadow-sm/outline so the route pops against any terrain
      const shadowLine = L.polyline(coords, {
        pane: "routePane",
        color: "rgba(15, 23, 42, 0.85)",
        weight: 12,
        opacity: 1,
        smoothFactor: 1,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapRef.current);

      const mainLine = L.polyline(coords, {
        pane: "routePane",
        color: "hsl(175, 80%, 55%)",
        weight: 6,
        opacity: 1,
        smoothFactor: 1,
        dashArray: "12 6",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(mapRef.current);

      (mainLine as any)._shadowLine = shadowLine;
      polylineRef.current = mainLine;
    }
  }, [history]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Listen for fullscreen changes to update icon size
  useEffect(() => {
    const onChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);

      if (markerRef.current) {
        markerRef.current.setIcon(createVanIcon(fs ? 170 : 130));
      }

      // Let the map recalculate after resize
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 200);
    };

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div ref={wrapperRef} className="mx-auto w-full max-w-6xl px-4 py-8 relative">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-3.5 w-3.5 rounded-full bg-destructive ring-2 ring-destructive/30" />
        <span>Martin's current location</span>
        <span className="ml-auto text-xs">{dateLabel}</span>
      </div>

      <div className="overflow-hidden rounded-xl border shadow-lg relative">
        <div ref={mapElementRef} className="journey-map" style={{ height: isFullscreen ? "100vh" : "500px", width: "100%" }} />
        <button
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 z-[1000] rounded-md bg-background/80 p-2 text-foreground backdrop-blur-xs border border-border hover:bg-background transition-colors"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export default JourneyMap;
