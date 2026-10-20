"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/icons";
import { Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { AppNotification } from "@/lib/types";

function timeAgo(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function load() {
      try {
        const data = await api<AppNotification[]>("/notifications");
        if (active) setItems(data);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    function onClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => {
      active = false;
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const unread = items.filter((item) => !item.isRead).length;

  async function markAll() {
    try {
      await api("/notifications/read-all", { method: "PATCH" });
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch {
      // ignore
    }
  }

  async function markRead(item: AppNotification) {
    if (item.isRead) return;
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)),
    );
    try {
      await api(`/notifications/${item.id}/read`, { method: "PATCH" });
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          if (next) setLoading(true);
          setOpen(next);
        }}
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 ring-1 ring-transparent transition-all hover:bg-white hover:text-zinc-900 hover:ring-zinc-200"
      >
        <BellIcon className="h-[18px] w-[18px]" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-zinc-900/10">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-900">Notifications</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAll}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-4 w-4" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => markRead(item)}
                      className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${
                        item.isRead ? "" : "bg-indigo-50/40"
                      }`}
                    >
                      <span
                        className={`text-sm leading-snug ${
                          item.isRead ? "text-zinc-600" : "font-medium text-zinc-900"
                        }`}
                      >
                        {item.message}
                      </span>
                      <span className="text-xs text-zinc-400">{timeAgo(item.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
