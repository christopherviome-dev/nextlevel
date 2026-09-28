"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import Sheet from "../discover/Sheet";

const day = (t) => (t ? new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");

// The chair card: everything needed to serve this customer well today:
// their past visits here, the shop's notes, their saved style photos.
export default function ChairCard({ requestId, onClose }) {
  const [c, setC] = useState(null);
  const [error, setError] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { apiFetch(`/team/chair/${requestId}`).then(setC).catch((e) => setError(e.message)); }, [requestId]);
  useEffect(() => { load(); }, [load]);
  const add = async () => {
    setBusy(true);
    try { await apiFetch(`/team/chair/${requestId}/notes`, { method: "POST", body: JSON.stringify({ note }) }); setNote(""); load(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <Sheet title={c ? `${c.name}'s card` : "Customer card"} onClose={onClose}>
      {error && <p className="text-sm text-bad-fg">{error}</p>}
      {!c && !error && <p className="text-sm text-muted">Loading…</p>}
      {c && (
        <div className="space-y-5">
          <div className="bg-surface rounded-2xl p-3 text-sm">
            <div className="font-bold text-ink">Today: {c.today.service}{c.today.at ? ` · ${new Date(c.today.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : ""}{c.today.checkedIn ? " · ✓ arrived" : ""}</div>
            {c.today.note && <div className="text-muted-strong mt-1">"{c.today.note}"</div>}
            {c.phone && <div className="text-muted mt-1">Phone: {c.phoneHidden ? <>{c.phone} <span className="text-xs">(hidden by the shop owner)</span></> : <a href={`tel:${c.phone}`} className="font-semibold text-hibiscus-deep">{c.phone}</a>}</div>}
          </div>
          {c.styles.length > 0 && (
            <div>
              <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Their saved style</div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {c.styles.map((s, i) => (
                  <figure key={i} className="shrink-0 w-40">
                    {s.photo && <img src={s.photo} alt="Their saved style" className="w-40 h-40 object-cover rounded-xl" />}
                    {s.notes && <figcaption className="text-xs text-muted-strong mt-1">{s.notes}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Notes from the shop</div>
            {c.notes.length === 0 && <p className="text-sm text-muted">No notes yet.</p>}
            {c.notes.map((n, i) => <div key={i} className="bg-surface rounded-xl p-3 mb-2 text-sm"><div className="text-ink whitespace-pre-line">{n.note}</div><div className="text-xs text-muted mt-1">{[n.by, day(n.at)].filter(Boolean).join(" · ")}</div></div>)}
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} placeholder="e.g. used a 1.5 guard on the sides, he liked it"
              className="w-full px-3 py-2 rounded-xl border border-line bg-card text-sm" />
            <button onClick={add} disabled={busy || !note.trim()} className="mt-2 px-4 py-2 rounded-full bg-violet text-white text-sm font-bold disabled:opacity-40">Add note</button>
          </div>
          <div>
            <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Past visits here</div>
            {c.visits.length === 0 && <p className="text-sm text-muted">First visit.</p>}
            {c.visits.map((v, i) => <div key={i} className="flex justify-between text-sm py-1.5 border-b border-line last:border-0"><span className="text-ink">{v.service}{v.servedBy ? <span className="text-muted"> · by {v.servedBy}</span> : null}</span><span className="text-muted">{day(v.at)}</span></div>)}
          </div>
        </div>
      )}
    </Sheet>
  );
}
