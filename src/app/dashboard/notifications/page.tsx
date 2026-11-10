"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2, Check } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) {
          setNotifications(data.notifications || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-sand-950">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-sand-950 font-sans">
            Notifications &amp; Alerts
          </h1>
          <p className="text-xs text-sand-700 mt-1 font-medium">
            Real-time activity stream for document uploads, teammate messages, handover sign-offs, and AI alerts.
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          disabled={markingAll || notifications.every((n) => n.read)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-200 hover:bg-sand-300 border border-sand-300 text-sand-900 text-xs font-mono font-semibold transition disabled:opacity-60 shrink-0"
        >
          {markingAll ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          <span>[MARK ALL AS READ]</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-sand-200 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markOneRead(n.id)}
              className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                !n.read
                  ? "bg-sand-50 border-moss-600 shadow-sm"
                  : "bg-sand-50/60 border-sand-300 opacity-80"
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-moss-700" />}
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sand-200 text-sand-900">
                    {n.type}
                  </span>
                  <span className="text-xs font-mono text-sand-500">{n.time}</span>
                </div>

                <h3 className="text-sm font-bold text-sand-950 font-sans">{n.title}</h3>
                <p className="text-xs text-sand-700 leading-relaxed font-sans">{n.message}</p>
              </div>

              <Link
                href={n.link}
                onClick={() => !n.read && markOneRead(n.id)}
                className="text-moss-900 font-mono font-bold text-xs hover:underline shrink-0 self-start sm:self-center flex items-center gap-0.5"
              >
                <span>INSPECT</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
