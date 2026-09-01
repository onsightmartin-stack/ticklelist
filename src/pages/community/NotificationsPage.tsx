import Seo from "@/components/Seo";
import { Link } from "@/lib/router-compat";
import { SlidersHorizontal } from "lucide-react";
import CommunityLayout from "@/components/community/CommunityLayout";
import NotificationList from "@/components/community/NotificationList";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

const NotificationsPage = () => {
  const { user } = useAuth();
  const { items, unread, loading, markRead, markAllRead, remove } = useNotifications();

  return (
    <CommunityLayout>
      <Seo
        title="Notifications — Ticklelist"
        description="Follows, likes, comments and mentions from the Ticklelist climbing community."
        noindex
      />

      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Ticklelist</p>
          <h1 className="font-display tracking-wider text-2xl mt-1">Notifications</h1>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
          <Button variant="secondary" size="sm" asChild>
            <Link to="/community/notifications/settings">
              <SlidersHorizontal className="w-4 h-4 mr-1" /> Preferences
            </Link>
          </Button>
        </div>
      </div>

      {!user ? (
        <p className="text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to see your notifications.
        </p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <NotificationList items={items} onRead={markRead} onRemove={remove} />
        </div>
      )}
    </CommunityLayout>
  );
};

export default NotificationsPage;
