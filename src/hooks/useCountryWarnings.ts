import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CountryWarning {
  country_name: string;
  advisory_level: number;
  advisory_text: string | null;
  last_checked_at: string;
}

export function useCountryWarnings() {
  return useQuery({
    queryKey: ["country-warnings"],
    queryFn: async (): Promise<CountryWarning[]> => {
      const { data, error } = await supabase
        .from("country_warnings")
        .select("country_name, advisory_level, advisory_text, last_checked_at")
        .order("advisory_level", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });
}
