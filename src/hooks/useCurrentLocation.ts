import { useQuery } from "@tanstack/react-query";
import { getLocation } from "@/lib/get-location.functions";

export interface LocationData {
  lat: number;
  lng: number;
  recorded_at: string;
}

const fallback: LocationData = {
  lat: 57.6978,
  lng: 12.033,
  recorded_at: "2026-04-15",
};

export function useCurrentLocation() {
  return useQuery({
    queryKey: ["current-location"],
    queryFn: async (): Promise<LocationData> => {
      try {
        const data = await getLocation();
        return (data.current as LocationData | null) ?? fallback;
      } catch {
        return fallback;
      }
    },
    refetchInterval: 1000 * 60 * 60,
  });
}
