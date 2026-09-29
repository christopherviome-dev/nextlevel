"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { formatMoney } from "../../lib/money";

const time = (t) => new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
function greeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }

function Card({ title, action, onAction, children, tone = "line" }) {
  const border = { line: "border-line", warn: "border-warn-line", ok: "border-ok-line" }[tone];
  return (
    <div className={"bg-card border rounded-2xl p-4 " + border}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase">{title}</div>
        {action && <button onClick={onAction} className="text-sm font-bold text-hibiscus-deep">{action} ›</button>}
      </div>
      {children}
    </div>
  );
}

// Home: only what matters right now. Everything else is in the menu.
export default function ProHome({ account, counts, go }) {
  const [requests, setRequests] = useState(null);
  const [week, setWeek] = useState(null);
  const [now] = useState(() => Date.now());
  useEffect(() => {
    apiFetch("/requests").then((all) => setRequests(all.filter((r) => r.stylistId))).catch(() => setRequests([]));
    apiFetch("/stylists/me/service-value?period=week").then(setWeek).catch(() => {});
  }, []);
  const day0 = (() => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  const pending = (requests || []).filter((r) => r.status === "pending");
  const today = (requests || []).filter((r) => r.status === "accepted" && r.preferredAt >= day0 && r.preferredAt < day0 + 86400000).sort((a, b) => a.preferredAt - b.preferredAt);
  const services = (account.styles || []).filter((s) => s.active !== false).length;
  const weekTotal = week ? Object.entries(week.recordedServiceValueByCurrency || {}) : [];
  const first = String(account.name || "").split(/\s+/)[0];

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-display font-extrabold text-ink">{greeting()}{first ? `, ${first}` : ""}</div>
        <div className="text-sm text-muted">{new Date(now).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</div>
      </div>

      {pending.length > 0 && (
        <Card title={`Needs your answer (${pending.length})`} action="Answer" onAction={() => go("requests")} tone="warn">
          {pending.slice(0, 3).map((r) => (
            <button key={r._id} onClick={() => go("requests")} className="w-full text-left py-2 border-b border-line last:border-0">
              <div className="text-sm font-bold text-ink">{r.clientName || "A customer"} · {r.serviceNameSnapshot || "a service"}</div>
              <div className="text-xs text-muted">{r.preferredAt ? new Date(r.preferredAt).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : r.date || "No date given"}</div>
            </button>
          ))}
        </Card>
      )}

      <Card title="Today" action={today.length ? "All requests" : null} onAction={() => go("requests")}>
        {requests === null && <p className="text-sm text-muted">Loading…</p>}
        {requests && today.length === 0 && <p className="text-sm text-muted">No one is booked for today.</p>}
        {today.map((r) => (
          <div key={r._id} className="flex items-center justify-between gap-2 py-2 border-b border-line last:border-0">
            <span className="text-sm text-ink"><b>{time(r.preferredAt)}</b> · {r.clientName} · {r.serviceNameSnapshot || "Service"}</span>
            {r.checkedInAt && <span className="text-xs font-bold text-ok-fg">✓ Arrived</span>}
          </div>
        ))}
      </Card>

      {(counts.unreadMessages > 0 || counts.workToReview > 0 || counts.apprenticeRequests > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {counts.unreadMessages > 0 && <button onClick={() => go("messages")} className="bg-card border border-line rounded-2xl p-4 text-left"><div className="text-2xl font-bold text-ink">{counts.unreadMessages}</div><div className="text-sm text-muted">unread conversation{counts.unreadMessages === 1 ? "" : "s"}</div></button>}
          {(counts.workToReview > 0 || counts.apprenticeRequests > 0) && <button onClick={() => go("team")} className="bg-card border border-line rounded-2xl p-4 text-left"><div className="text-2xl font-bold text-ink">{counts.workToReview + counts.apprenticeRequests}</div><div className="text-sm text-muted">from your trainees to review</div></button>}
        </div>
      )}

      {week && (
        <Card title="This week" action="Earnings" onAction={() => go("earnings")}>
          <div className="flex items-end justify-between gap-3">
            <div>{weekTotal.length ? weekTotal.map(([cur, v]) => <div key={cur} className="text-2xl font-bold text-ink">{formatMoney(v.total, cur)}</div>) : <div className="text-2xl font-bold text-ink">{formatMoney(0, account.currency || "GHS")}</div>}
              <div className="text-xs text-muted">recorded service value</div></div>
            <div className="text-right"><div className="text-2xl font-bold text-ink">{week.completedCount}</div><div className="text-xs text-muted">services done</div></div>
          </div>
        </Card>
      )}

      {services === 0 && account.role !== "APPRENTICE" && (
        <Card title="Get started" tone="ok"><p className="text-sm text-ink mb-3">Add your first service with a photo and price, so customers can book you.</p>
          <button onClick={() => go("services")} className="px-4 py-2 rounded-full bg-hibiscus text-white text-sm font-bold">Add a service</button></Card>
      )}
      {services > 0 && account.status === "APPROVED" && week && week.completedCount === 0 && pending.length === 0 && (
        <Card title="Grow your bookings"><p className="text-sm text-ink mb-3">Share your shop link or QR code with customers on WhatsApp and Instagram.</p>
          <button onClick={() => go("share")} className="px-4 py-2 rounded-full bg-violet text-white text-sm font-bold">Share my shop</button></Card>
      )}
    </div>
  );
}
