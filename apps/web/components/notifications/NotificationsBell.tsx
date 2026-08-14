"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { formatDate } from "@/lib/format";

interface NotificationRow {
  id: string;
  ticketId: string | null;
  kind: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  data: NotificationRow[];
  meta: { unreadCount: number };
}

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<NotificationsResponse>("/notifications");
      setItems(res.data);
      setUnread(res.meta.unreadCount);
    } catch {
      /* swallow — the badge just won't update */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = window.setInterval(reload, 30000);
    return () => window.clearInterval(id);
  }, [reload]);

  const openOne = async (n: NotificationRow) => {
    setOpen(false);
    if (!n.readAt) {
      try {
        await api.post("/notifications/mark-read", { ids: [n.id] });
        setUnread((c) => Math.max(0, c - 1));
        setItems((rows) =>
          rows.map((r) => (r.id === n.id ? { ...r, readAt: new Date().toISOString() } : r)),
        );
      } catch {
        /* ignore */
      }
    }
    if (n.ticketId) router.push(`/customer/billing?request=${n.ticketId}`);
  };

  const markAll = async () => {
    try {
      await api.post("/notifications/mark-read", { all: true });
      setUnread(0);
      setItems((rows) => rows.map((r) => ({ ...r, readAt: r.readAt ?? new Date().toISOString() })));
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
        aria-label={`Notifications (${unread} unread)`}
      >
        <Icon name="alert" size={20} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-pill bg-accent-red text-white text-[10px] font-bold flex items-center justify-center"
            aria-hidden
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Notifications">
        <div className="flex items-center justify-between mb-3">
          <p className="text-footnote text-text-secondary">
            {loading ? "Loading…" : unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="text-footnote font-semibold text-accent-orange"
            >
              Mark all read
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-callout text-text-tertiary py-6 text-center">No notifications yet</p>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openOne(n)}
                  className={`w-full text-left rounded-lg p-3 border transition-colors ${
                    n.readAt
                      ? "bg-white/60 border-white/60"
                      : "bg-accent-orange/10 border-accent-orange/30"
                  }`}
                >
                  <p className="text-body font-semibold text-text-primary">{n.title}</p>
                  <p className="text-callout text-text-secondary mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-caption text-text-tertiary mt-1">
                    {formatDate(n.createdAt)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  );
}
