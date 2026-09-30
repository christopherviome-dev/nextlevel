"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

// The bell: unread notifications for whoever is using Mepluge right now.
export default function NotificationBell() {
  const { activeRole } = useAuth();
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const load = useCallback(() => {
    if (!activeRole) return;
    apiFetch("/notifications/unread-count", {}, activeRole === "customer" ? "customer" : null).then((r) => setCount(r.count || 0)).catch(() => {});
  }, [activeRole]);
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus); window.addEventListener("sheeba:notifications-read", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); window.removeEventListener("sheeba:notifications-read", onFocus); };
  }, [load, pathname]);
  if (!activeRole) return null;
  const on = pathname.startsWith("/notifications");
  return (
    <Link href="/notifications" aria-label={count ? `Notifications, ${count} unread` : "Notifications"} title="Notifications"
      className={"relative w-10 h-10 rounded-full border flex items-center justify-center " + (on ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
      </svg>
      {count > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-hibiscus text-white text-[11px] font-bold flex items-center justify-center">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}
