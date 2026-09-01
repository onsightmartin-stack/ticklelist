import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { DEFAULT_THEME, getStoredTheme, setTheme, THEMES, type ThemeId } from "@/lib/themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const ThemePicker = () => {
  const [active, setActive] = useState<ThemeId>(DEFAULT_THEME);
  const { user } = useAuth();

  useEffect(() => {
    setActive(getStoredTheme());
  }, []);

  const choose = async (id: ThemeId) => {
    setTheme(id);
    setActive(id);
    // Save on the account too, so the theme follows the member across devices
    // and between onsightmartin.com and ticklelist.org.
    // NOTE: the query builder is lazy — it must be awaited or no request is sent.
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ theme: id }).eq("id", user.id);
    if (error) {
      console.error("Could not save theme to your account", error);
      toast.error("Theme applied on this device, but saving it to your account failed.");
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {THEMES.map((theme) => {
        const selected = theme.id === active;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => choose(theme.id)}
            aria-pressed={selected}
            className={`text-left rounded-lg border p-4 transition-colors ${
              selected
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-display tracking-wider text-sm uppercase">{theme.name}</span>
              {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
            </div>
            <div className="flex gap-1.5 mt-3">
              {theme.swatches.map((color) => (
                <span
                  key={color}
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{theme.description}</p>
          </button>
        );
      })}
    </div>
  );
};

export default ThemePicker;
