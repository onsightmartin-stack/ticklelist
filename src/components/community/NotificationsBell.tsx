import { Link } from "@/lib/router-compat";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationList from "@/components/community/NotificationList";
import { useNotifications } from "@/hooks/useNotifications";

const NotificationsBell = () => {
  const { items, unread, markRead, markAllRead } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-full border border-border p-2 hover:bg-secondary transition-colors"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-popover">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Notifications</p>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          <NotificationList items={items.slice(0, 8)} compact onRead={markRead} />
        </div>
        <div className="border-t border-border px-3 py-2 flex items-center justify-between">
          <Link to="/community/notifications" className="text-xs text-muted-foreground hover:text-foreground">
            See all notifications
          </Link>
          <Link to="/community/notifications/settings" className="text-xs text-muted-foreground hover:text-foreground">
            Settings
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsBell;
