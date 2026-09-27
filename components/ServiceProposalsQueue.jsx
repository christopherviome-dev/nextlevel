"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";

// Admin: services professionals proposed that aren't listed yet. Approving
// adds it to Sheeba for everyone (and to every shop waiting on it).
export default function ServiceProposalsQueue({ onDecision }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const load = useCallback(() => { apiFetch("/admin/service-proposals").then(setList).catch((e) => setError(e.message)); }, []);
  useEffect(() => { load(); }, [load]);

  const decide = async (p, decision) => {
    if (decision === "approve" && !window.confirm(`Add "${p.name}" as a service everyone can choose?`)) return;
    setBusy(p._id); setError(null);
    try {
      await apiFetch(`/admin/service-proposals/${p._id}/${decision}`, { method: "POST", body: JSON.stringify({ reason }) });
      setRejecting(null); setReason(""); load(); if (onDecision) onDecision();
    } catch (e) { setError(e.message); } finally { setBusy(null); }
  };

  if (!list) return null;
  return (
    <div className="mb-8">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Proposed services ({list.length})</div>
      {error && <div className="text-bad-fg text-sm mb-2">{error}</div>}
      {list.length === 0 && <div className="text-muted">No new services waiting.</div>}
      {list.map((p) => (
        <div key={p._id} className="bg-card border border-line rounded-2xl p-4 mb-3">
          <div className="font-bold text-ink">{p.name}</div>
          <div className="text-sm text-muted">Proposed by {p.shops.join(", ")}</div>
          {rejecting === p._id ? (
            <div className="flex gap-2 mt-3">
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Short reason, e.g. 'fits under Skin & spa'" className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-line bg-card text-sm" />
              <button onClick={() => decide(p, "reject")} disabled={busy === p._id || reason.trim().length < 5} className="px-3 py-2 rounded-full bg-red-600 text-white text-sm font-bold disabled:opacity-40">Reject</button>
              <button onClick={() => { setRejecting(null); setReason(""); }} className="px-3 py-2 rounded-full border border-line text-sm">Cancel</button>
            </div>
          ) : (
            <div className="flex gap-2 mt-3">
              <button onClick={() => decide(p, "approve")} disabled={busy === p._id} className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-bold">Approve</button>
              <button onClick={() => setRejecting(p._id)} className="px-4 py-2 rounded-full border border-line text-sm font-bold text-plum">Reject…</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
