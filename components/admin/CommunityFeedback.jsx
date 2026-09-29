"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../lib/api";

// What people post in the Sheeba Telegram community, so nothing said there is lost.
export default function CommunityFeedback() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [showDone, setShowDone] = useState(false);
  const load = useCallback(() => apiFetch("/telegram/feedback").then(setList).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const done = async (id) => { await apiFetch(`/telegram/feedback/${id}/handled`, { method: "PUT" }); load(); };
  if (error) return <p className="text-bad-fg">{error}</p>;
  if (!list) return <p className="text-muted">Loading…</p>;
  const open = list.filter((f) => !f.handled), handled = list.filter((f) => f.handled);
  const item = (f) => (
    <div key={f._id} className="p-4 flex gap-3 items-start">
      <div className="min-w-0 flex-1">
        <div className="text-sm"><b className="text-plum">{f.senderName}</b> <span className="text-xs text-muted">· {new Date(f.createdAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div>
        <p className="text-ink mt-1 whitespace-pre-line">{f.text}</p>
      </div>
      {!f.handled && <button onClick={() => done(f._id)} className="shrink-0 px-3 py-1.5 rounded-full border border-line text-xs font-bold text-plum">✓ Handled</button>}
    </div>
  );
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Messages posted in the Sheeba Telegram community. Mark them handled once you've dealt with them.</p>
      {open.length === 0 ? <p className="text-muted">Nothing waiting. 🎉</p> : <div className="bg-card border border-line rounded-2xl divide-y divide-line">{open.map(item)}</div>}
      {handled.length > 0 && <button onClick={() => setShowDone((x) => !x)} className="text-sm font-bold text-hibiscus-deep">{showDone ? "Hide" : "Show"} handled ({handled.length})</button>}
      {showDone && <div className="bg-card border border-line rounded-2xl divide-y divide-line opacity-70">{handled.map(item)}</div>}
    </div>
  );
}
