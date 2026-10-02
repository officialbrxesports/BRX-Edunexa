"use client";

import { useEffect, useState } from "react";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotification,
  type NotificationItem,
} from "@/lib/notifications";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("Please login first.");
        return;
      }

      const data = await getNotifications(token, {
        page: 1,
        limit: 50,
        unreadOnly: filter === "unread",
      });

      setNotifications(data.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  async function handleRead(id: string) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      await markNotification(token, id, true);
      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update notification.",
      );
    }
  }

  async function handleReadAll() {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      await markAllNotificationsRead(token);
      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark all as read.",
      );
    }
  }

  async function handleDelete(id: string) {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      await deleteNotification(token, id);
      setNotifications((current) =>
        current.filter((notification) => notification.id !== id),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete notification.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-400">BRX EduNexa</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Stay updated with announcements and important activities.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReadAll}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
          >
            Mark all as read
          </button>
        </div>

        <div className="mb-5 flex gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === "unread"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Unread
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="text-4xl">🔔</div>
            <h2 className="mt-3 text-lg font-semibold">
              No notifications
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              You are all caught up.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-2xl border p-4 transition ${
                  notification.isRead
                    ? "border-white/10 bg-white/[0.03]"
                    : "border-blue-500/20 bg-blue-500/[0.06]"
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                      notification.isRead ? "bg-slate-600" : "bg-blue-500"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="font-semibold">
                          {notification.title}
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          {notification.message}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-slate-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={() => handleRead(notification.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium hover:bg-blue-500"
                        >
                          Mark read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(notification.id)}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
