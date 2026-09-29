"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../lib/api";

// A supervisor reviewing an apprentice's posted work.
export default function ReviewWorks({ apprenticeId, isMinor, name, onChanged }) {
  const [list, setList] = useState(null);
  const load = useCallback(() => { apiFetch(`/training/apprentices/${apprenticeId}/works`).then(setList).catch(() => setList([])); }, [apprenticeId]);
  useEffect(() => { load(); }, [load]);
  if (!list) return null;
  const waiting = list.filter((w) => w.status === "PENDING"), rest = list.filter((w) => w.status !== "PENDING");
  return (
    <div>
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Work to review ({waiting.length})</div>
      {list.length === 0 && <p className="text-sm text-muted">{name} hasn't posted any work yet.</p>}
      {waiting.map((w) => <ReviewCard key={w._id} w={w} apprenticeId={apprenticeId} isMinor={isMinor} onDone={() => { load(); if (onChanged) onChanged(); }} />)}
      {rest.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
          {rest.map((w) => (
            <div key={w._id} className="relative rounded-xl overflow-hidden border border-line">
              <img src={w.thumb || w.photo} alt={w.caption || ""} className="w-full aspect-square object-cover" />
              <span className={"absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full " + (w.status === "APPROVED" ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}>
                {w.status === "APPROVED" ? (w.showOnShop ? "✓ On shop page" : "✓ Approved") : "Sent back"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ w, apprenticeId, isMinor, onDone }) {
  const [comment, setComment] = useState("");
  const [signOff, setSignOff] = useState(!!w.skillId);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const decide = async (decision) => {
    setBusy(true); setError(null);
    try {
      await apiFetch(`/training/apprentices/${apprenticeId}/works/${w._id}/decision`, { method: "POST", body: JSON.stringify({ decision, comment, signOffSkill: signOff, showOnShop: show }) });
      onDone();
    } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <div className="bg-card border border-warn-line rounded-2xl p-3 mb-3">
      <img src={w.photo} alt={w.caption || "Work to review"} className="w-full max-h-80 object-contain rounded-xl bg-surface-2" />
      {w.caption && <div className="text-sm text-ink mt-2">{w.caption}</div>}
      {w.skillName && <div className="text-xs text-muted">Skill: {w.skillName}</div>}
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={500} placeholder="Comment (needed if sending back)"
        className="w-full mt-2 px-3 py-2 rounded-xl border border-line bg-card text-sm" />
      <div className="space-y-1 mt-1 text-sm text-muted-strong">
        {w.skillId && <label className="flex items-center gap-2"><input type="checkbox" checked={signOff} onChange={(e) => setSignOff(e.target.checked)} className="w-4 h-4" /> Also sign off "{w.skillName}"</label>}
        {isMinor
          ? <p className="text-xs text-muted">Work by trainees under 18 stays private: it's never shown on the shop page.</p>
          : <label className="flex items-center gap-2"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="w-4 h-4" /> Show on our shop page (as trainee work)</label>}
      </div>
      {error && <p className="text-sm text-bad-fg">{error}</p>}
      <div className="flex gap-2 mt-2">
        <button onClick={() => decide("approve")} disabled={busy} className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-bold">Approve</button>
        <button onClick={() => decide("send_back")} disabled={busy || comment.trim().length < 2} className="px-4 py-2 rounded-full border border-line text-sm font-bold disabled:opacity-40">Send back</button>
      </div>
    </div>
  );
}
