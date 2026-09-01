import { NavLink } from "@/lib/router-compat";
import { Home, Mountain, Users, Plus } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Tab = { to: string; label: string; icon: typeof Home; end?: boolean };

const tabs: Tab[] = [
  { to: "/community", label: "Feed", icon: Home, end: true },
  { to: "/community/ascents", label: "All ascents", icon: Mountain },
  { to: "/community/members", label: "Members", icon: Users },
];

/**
 * Native-app style bottom tab bar. Mobile only — desktop keeps the header nav.
 */
const BottomTabBar = () => {
  const { user } = useAuth();

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative grid grid-cols-5 items-end">
        {tabs.slice(0, 2).map((t) => (
          <TabLink key={t.to} tab={t} />
        ))}

        <div className="flex justify-center">
          <NavLink
            to={user ? "/community/ascents?new=1" : "/auth"}
            aria-label="Log an ascent"
            className="-mt-5 h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </NavLink>
        </div>

        {tabs.slice(2).map((t) => (
          <TabLink key={t.to} tab={t} />
        ))}
      </div>
    </nav>
  );
};

const TabLink = ({ tab }: { tab: Tab }) => {
  const Icon = tab.icon;
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }: { isActive: boolean }) =>
        cn(
          "flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] tracking-wide whitespace-nowrap transition-colors",
          isActive ? "text-primary" : "text-muted-foreground",
        )
      }
    >
      <Icon className="w-5 h-5" />
      <span>{tab.label}</span>
    </NavLink>
  );
};

export default BottomTabBar;
