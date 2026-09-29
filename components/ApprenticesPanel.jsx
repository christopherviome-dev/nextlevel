"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import TrainingEditor from "./training/TrainingEditor";

// Apprentices who named this professional as their supervisor. Confirming
// adds them to the shop's staff access, so they can help with its requests.
export default function ApprenticesPanel() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [openId, setOpenId] = useState(null);
  const load = useCallback(() => { apiFetch("/stylists/me/apprentices").then(setList).catch((e) => setError(e.message)); }, []);
  useEffect(() => { load(); }, [load]);

  const answer = async (a, decision) => {
    if (decision === "decline" && !window.confirm(`Decline ${a.name} as your trainee?`)) return;
    setBusy(a._id); setError(null);
    try { await apiFetch(`/stylists/me/apprentices/${a._id}/${decision}`, { method: "POST" }); load(); }
    catch (e) { setError(e.message); } finally { setBusy(null); }
  };

  if (!list) return null;
  if (openId) return <TrainingEditor apprenticeId={openId} onClose={() => { setOpenId(null); load(); }} onGraduated={load} />;
  const pending = list.filter((a) => a.status === "PENDING");
  const confirmed = list.filter((a) => a.status === "APPROVED");
  const graduates = list.filter((a) => a.status === "GRADUATED");
  return (
    <div>
      <div className="font-bold mb-2">In training</div>
      {error && <p className="text-sm text-bad-fg mb-2">{error}</p>}
      {list.length === 0 && <p className="text-sm text-muted">No trainees yet. A professional in training joins by entering your Sheeba code when they sign up.</p>}
      {pending.map((a) => (
        <div key={a._id} className="flex items-center justify-between gap-2 bg-warn-bg border border-warn-line rounded-xl p-3 mb-2">
          <span className="text-sm text-warn-fg"><b>{a.name}</b> wants to train with you</span>
          <span className="flex gap-2">
            <button onClick={() => answer(a, "approve")} disabled={busy === a._id} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold">Confirm</button>
            <button onClick={() => answer(a, "decline")} disabled={busy === a._id} className="px-3 py-1.5 rounded-full border border-line bg-card text-xs font-bold">Decline</button>
          </span>
        </div>
      ))}
      {confirmed.map((a) => (
        <button key={a._id} onClick={() => setOpenId(a._id)} className="w-full flex items-center justify-between text-sm bg-surface rounded-xl p-3 mb-2 text-left">
          <span className="text-ink">✓ {a.name}{a.isMinor ? " (under 18)" : ""}</span><span className="font-bold text-hibiscus-deep">Open training ›</span>
        </button>
      ))}
      {graduates.map((a) => (
        <button key={a._id} onClick={() => setOpenId(a._id)} className="w-full flex items-center justify-between text-sm py-2 text-left">
          <span className="text-muted-strong">🎓 {a.name}: graduated</span><span className="text-xs text-hibiscus-deep underline">Training record</span>
        </button>
      ))}
    </div>
  );
}
