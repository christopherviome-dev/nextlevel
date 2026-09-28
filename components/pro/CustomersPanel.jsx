"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import { formatMoney } from "../../lib/money";

const DUE = { APPROACHING: "Coming up", DUE: "Due now", OVERDUE: "Overdue" };
const when = (t) => (t ? new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");

// A professional's customers: only people who have booked with them. Each has
// their history and this professional's PRIVATE notes (never shown to the
// customer or to anyone else).
export default function CustomersPanel() {
  const [list, setList] = useState(null);
  const [due, setDue] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    apiFetch("/stylists/me/customers").then(setList).catch((e) => setError(e.message));
    apiFetch("/stylists/me/customers-due-soon").then(setDue).catch(() => {});
  }, []);
  if (openId) return <CustomerDetail id={openId} onBack={() => setOpenId(null)} />;
  return (
    <div className="space-y-4">
      {due.length > 0 && (
        <div>
          <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Due for their next visit</div>
          {due.map((d, i) => (
            <button key={i} onClick={() => setOpenId(d.customerId)} className="w-full text-left bg-warn-bg border border-warn-line rounded-xl p-3 mb-2 text-sm">
              <b className="text-ink">{d.customerName}</b> <span className="text-muted-strong">· {d.serviceName || "their usual"} · {DUE[d.status]}</span>
            </button>
          ))}
        </div>
      )}
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Your customers</div>
        {error && <p className="text-sm text-bad-fg">{error}</p>}
        {list && list.length === 0 && <p className="text-sm text-muted">Customers appear here after they book with you.</p>}
        {list && list.map((c) => (
          <button key={c.customerId} onClick={() => setOpenId(c.customerId)} className="w-full text-left bg-card border border-line rounded-xl p-3 mb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-ink">{c.name}</span>
              {c.isRepeat && <span className="text-xs px-2 py-0.5 rounded-full bg-ok-bg text-ok-fg border border-ok-line">Repeat customer</span>}
            </div>
            <div className="text-xs text-muted">{c.totalCompleted} completed{c.lastActivityAt ? ` · last ${when(c.lastActivityAt)}` : ""}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomerDetail({ id, onBack }) {
  const [data, setData] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const load = useCallback(() => { apiFetch(`/stylists/me/customers/${id}`).then(setData).catch((e) => setError(e.message)); }, [id]);
  useEffect(() => { load(); }, [load]);
  const add = async () => {
    setBusy(true); setError(null);
    try { await apiFetch(`/stylists/me/customers/${id}/notes`, { method: "POST", body: JSON.stringify({ note }) }); setNote(""); load(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const remove = async (nid) => { if (!window.confirm("Delete this note?")) return; await apiFetch(`/stylists/me/customers/${id}/notes/${nid}`, { method: "DELETE" }); load(); };
  if (!data) return <p className="text-sm text-muted">{error || "Loading…"}</p>;
  const phone = (data.requests.find((r) => r.clientPhone) || {}).clientPhone;
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm font-bold text-hibiscus-deep">‹ All customers</button>
      <div className="bg-card border border-line rounded-2xl p-4">
        <div className="font-display font-extrabold text-lg text-ink">{data.name}</div>
        {phone && <a href={`tel:${phone}`} className="text-sm text-hibiscus-deep font-semibold">{phone}</a>}
      </div>
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">History with you</div>
        {data.requests.map((r) => (
          <div key={r._id} className="flex justify-between gap-2 text-sm py-2 border-b border-line">
            <span className="text-ink">{r.serviceNameSnapshot || "Service"} <span className="text-muted">· {r.status}{r.preferredAt ? ` · ${when(r.preferredAt)}` : ""}</span></span>
            {r.priceSnapshot != null && <span className="text-muted-strong whitespace-nowrap">{formatMoney(r.priceSnapshot, r.currencySnapshot || "GHS")}</span>}
          </div>
        ))}
      </div>
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-1">Private notes</div>
        <p className="text-xs text-muted mb-2">Only you can see these, never the customer.</p>
        {data.notes.map((n) => (
          <div key={n._id} className="bg-surface rounded-xl p-3 mb-2 text-sm flex justify-between gap-2">
            <span className="whitespace-pre-line text-ink">{n.note}{n.authorName && <span className="block text-xs text-muted mt-1">by {n.authorName}</span>}</span>
            <button onClick={() => remove(n._id)} className="text-xs text-bad-fg underline shrink-0">Delete</button>
          </div>
        ))}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} placeholder="e.g. prefers medium size, sensitive scalp"
          className="w-full px-3 py-2 rounded-xl border border-line bg-card text-sm" />
        {error && <p className="text-sm text-bad-fg">{error}</p>}
        <button onClick={add} disabled={busy || !note.trim()} className="mt-2 px-4 py-2 rounded-full bg-violet text-white text-sm font-bold disabled:opacity-40">Add note</button>
      </div>
    </div>
  );
}
