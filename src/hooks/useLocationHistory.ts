import { useQuery } from "@tanstack/react-query";
import { getLocation } from "@/lib/get-location.functions";

export interface LocationPoint {
  lat: number;
  lng: number;
  recorded_at: string;
}

export function useLocationHistory() {
  return useQuery({
    queryKey: ["location-history"],
    queryFn: async (): Promise<LocationPoint[]> => {
      try {
        const data = await getLocation();
        return (data.points as LocationPoint[]) ?? [];
      } catch {
        return [];
      }
    },
    refetchInterval: 1000 * 60 * 60,
  });
}
