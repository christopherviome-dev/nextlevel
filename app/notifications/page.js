"use client";
import PhoneAlerts from "../../components/PhoneAlerts";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { notificationLink } from "../../lib/notifications";

const when = (t) => { const m = Math.round((Date.now() - new Date(t).getTime()) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" }); };

// Today / Yesterday / Earlier, newest first (easier to scan).
function groups(list) {
  const day = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const today = day(Date.now()), yesterday = today - 86400000;
  const out = { Today: [], Yesterday: [], Earlier: [] };
  for (const n of list) { const d = day(n.createdAt); (d === today ? out.Today : d === yesterday ? out.Yesterday : out.Earlier).push(n); }
  return Object.entries(out).filter(([, items]) => items.length);
}

export default function Notifications() {
  const { activeRole, hydrated } = useAuth();
  const router = useRouter();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const as = activeRole === "customer" ? "customer" : null;
  const load = useCallback(() => { if (activeRole) apiFetch("/notifications", {}, as).then(setList).catch((e) => setError(e.message)); }, [activeRole, as]);
  useEffect(() => { load(); }, [load]);
  const open = async (n) => {
    if (!n.read) { try { await apiFetch(`/notifications/${n._id}/read`, { method: "PUT" }, as); } catch (e) { /* still open it */ } window.dispatchEvent(new Event("sheeba:notifications-read")); }
    const to = notificationLink(n, activeRole);
    if (to) router.push(to); else setList((l) => l.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
  };
  const readAll = async () => { await apiFetch("/notifications/read-all", { method: "PUT" }, as); window.dispatchEvent(new Event("sheeba:notifications-read")); load(); };
  const unread = (list || []).filter((n) => !n.read).length;
  return (
    <div>
      <Nav />
      <div className="max-w-xl mx-auto px-4 pt-4 pb-16">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-extrabold text-ink">Notifications</h1>
          {unread > 0 && <button onClick={readAll} className="text-sm font-bold text-hibiscus-deep">Mark all read</button>}
        </div>
        {hydrated && !activeRole && <p className="text-muted">Sign in to see your notifications.</p>}
        {activeRole && <div className="mb-4"><PhoneAlerts as={activeRole === "customer" ? "customer" : "pro"} hideWhenOn /></div>}
        {error && <p className="text-bad-fg">{error}</p>}
        {activeRole && !list && !error && <p className="text-muted">Loading…</p>}
        {list && list.length === 0 && <p className="text-muted">Nothing yet. Bookings, messages and updates will show here.</p>}
        {list && list.length > 0 && groups(list).map(([label, items]) => (
          <section key={label} className="mb-4">
            <h2 className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2 px-1">{label}</h2>
            <div className="bg-card border border-line rounded-2xl divide-y divide-line overflow-hidden">
              {items.map((n) => (
                <button key={n._id} onClick={() => open(n)} className={"w-full text-left px-4 py-3 flex gap-3 items-center border-l-4 " + (n.read ? "border-transparent" : "border-hibiscus bg-violet/5")}>
                  <span className="min-w-0 flex-1">
                    <span className={"block text-ink " + (n.read ? "" : "font-bold")}>{n.title}</span>
                    {n.message && <span className="block text-sm text-muted-strong mt-0.5 line-clamp-2">{n.message}</span>}
                    <span className="block text-xs text-muted mt-1">{when(n.createdAt)}</span>
                  </span>
                  {notificationLink(n, activeRole) && <span className="text-muted" aria-hidden>›</span>}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
