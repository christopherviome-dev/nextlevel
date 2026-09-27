"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";

const VIEWS = [["open", "Open", ["OPEN", "NEEDS_INFORMATION"]], ["review", "Under review", ["UNDER_REVIEW", "ESCALATED"]], ["closed", "Closed", ["RESOLVED", "DISMISSED"]]];
const CATEGORY = { NO_SHOW: "Didn't show up", UNSAFE: "Felt unsafe", HARASSMENT: "Harassment", FRAUD: "Fraud or scam", POOR_SERVICE: "Poor service", FAKE_PROFILE: "Fake profile", OTHER: "Other" };
const STATE_LABEL = { OPEN: "Open", NEEDS_INFORMATION: "Needs information", UNDER_REVIEW: "Under review", ESCALATED: "Escalated", RESOLVED: "Resolved", DISMISSED: "Dismissed" };

// Admin: reports from customers and professionals, with what's needed to act.
export default function ReportsQueue({ onDecision }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("open");
  const load = useCallback(() => { apiFetch("/reports").then(setList).catch((e) => setError(e.message)); }, []);
  useEffect(() => { load(); }, [load]);
  const done = () => { load(); if (onDecision) onDecision(); };
  const shown = list ? list.filter((r) => VIEWS.find((v) => v[0] === view)[2].includes(r.state || "OPEN")) : [];
  const count = (k) => (list ? list.filter((r) => VIEWS.find((v) => v[0] === k)[2].includes(r.state || "OPEN")).length : 0);

  return (
    <div className="mb-8">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Reports</div>
      <div className="flex gap-2 mb-3">
        {VIEWS.map(([k, label]) => (
          <button key={k} onClick={() => setView(k)} aria-pressed={view === k}
            className={"px-3 py-1.5 rounded-full text-xs font-bold border " + (view === k ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>{label} ({count(k)})</button>
        ))}
      </div>
      {error && <div className="text-bad-fg">{error}</div>}
      {!list && !error && <div className="text-muted">Loading…</div>}
      {list && shown.length === 0 && <div className="text-muted">Nothing here.</div>}
      {shown.map((r) => <ReportCard key={r._id} r={r} onDone={done} />)}
    </div>
  );
}

function ReportCard({ r, onDone }) {
  const [note, setNote] = useState(r.adminNotes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [restricting, setRestricting] = useState(false);
  const [level, setLevel] = useState("RESTRICTED");
  const [reason, setReason] = useState("");
  const t = r.target;

  const act = async (fn) => { setBusy(true); setError(null); try { await fn(); onDone(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const setState = (state) => act(() => apiFetch(`/reports/${r._id}/state`, { method: "PUT", body: JSON.stringify({ state, adminNotes: note }) }));
  const base = t && (t.type === "customer" ? `/admin/customers/${t.id}` : `/stylists/${t.id}`);
  const restrict = () => act(async () => { await apiFetch(`${base}/restrict`, { method: "POST", body: JSON.stringify({ accountStatus: level, reason }) }); setRestricting(false); });
  const restore = () => { if (window.confirm(`Restore ${t.name}'s account?`)) act(() => apiFetch(`${base}/restore`, { method: "POST" })); };

  return (
    <div className={"bg-card border rounded-2xl p-4 mb-3 " + (r.urgent ? "border-bad-line" : "border-line")}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {r.urgent && <span className="px-2 py-0.5 rounded-full bg-bad-bg text-bad-fg border border-bad-line font-bold">URGENT</span>}
        {r.category && <span className="px-2 py-0.5 rounded-full bg-surface-2 text-plum font-bold">{CATEGORY[r.category]}</span>}
        <span className="text-muted">{STATE_LABEL[r.state || "OPEN"]} · {new Date(r.createdAt).toLocaleString()}</span>
      </div>
      <div className="mt-2 text-sm">
        {t ? (
          <div><span className="text-muted">About:</span> <b className="text-ink">{t.name}</b> <span className="text-muted">({t.type === "customer" ? "customer" : "professional"}{t.accountStatus !== "ACTIVE" ? ` · ${t.accountStatus.toLowerCase()}` : ""})</span>
            {t.phone && <> · <a href={`tel:${t.phone}`} className="text-hibiscus-deep font-semibold">{t.phone}</a></>}</div>
        ) : <div className="text-muted">A general report about Sheeba</div>}
        <div><span className="text-muted">From:</span> {r.reporter ? <>{r.reporter.name} {r.reporter.phone && <a href={`tel:${r.reporter.phone}`} className="text-hibiscus-deep font-semibold">{r.reporter.phone}</a>}</> : r.contact ? <>a visitor · {r.contact}</> : "a visitor (no contact left)"}</div>
        {r.booking && <div><span className="text-muted">Booking:</span> {r.booking.service} · {r.booking.status}</div>}
      </div>
      <p className="mt-2 text-sm text-ink whitespace-pre-line bg-surface rounded-xl p-3">{r.detail}</p>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} placeholder="Private note (only admins see this)"
        className="w-full mt-2 px-3 py-2 rounded-lg border border-line bg-card text-sm" />
      {error && <p className="text-sm text-bad-fg">{error}</p>}
      <div className="flex flex-wrap gap-2 mt-2">
        {[["UNDER_REVIEW", "Under review"], ["NEEDS_INFORMATION", "Needs info"], ["ESCALATED", "Escalate"], ["RESOLVED", "Resolve"], ["DISMISSED", "Dismiss"]].map(([s, l]) => (
          <button key={s} onClick={() => setState(s)} disabled={busy} className="px-3 py-1.5 rounded-full border border-line text-xs font-bold text-plum">{l}</button>
        ))}
        {t && t.accountStatus === "ACTIVE" && <button onClick={() => setRestricting(!restricting)} className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold">Restrict account…</button>}
        {t && t.accountStatus !== "ACTIVE" && <button onClick={restore} disabled={busy} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold">Restore account</button>}
      </div>
      {restricting && (
        <div className="mt-2 bg-surface rounded-xl p-3 space-y-2 text-sm">
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line bg-card">
            <option value="RESTRICTED">{t.type === "customer" ? "Restricted: can log in, can't book" : "Restricted: hidden, can't take bookings"}</option>
            <option value="SUSPENDED">Suspended: can't log in</option>
            <option value="BANNED">Banned: can't log in</option>
          </select>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Reason (they will see this)" className="w-full px-3 py-2 rounded-lg border border-line bg-card" />
          <button onClick={restrict} disabled={busy || reason.trim().length < 5} className="px-4 py-2 rounded-full bg-red-600 text-white font-bold disabled:opacity-40">Confirm restriction</button>
        </div>
      )}
    </div>
  );
}
