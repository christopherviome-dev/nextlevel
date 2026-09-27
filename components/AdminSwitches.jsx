"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

// Admin on/off switches. For now: the age check at signup.
export default function AdminSwitches() {
  const [ageCheck, setAgeCheck] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { apiFetch("/settings").then((s) => setAgeCheck(!!s.ageCheck)).catch(() => setAgeCheck(false)); }, []);

  const flip = async () => {
    const next = !ageCheck;
    if (!window.confirm(next ? "Switch ON the age check at signup? (18+ for customers and professionals; apprentices from 15 with a guardian's consent)" : "Switch OFF the age check at signup?")) return;
    setBusy(true); setError(null);
    try { await apiFetch("/admin/settings/ageCheck", { method: "PUT", body: JSON.stringify({ value: next }) }); setAgeCheck(next); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  if (ageCheck === null) return null;
  return (
    <div className="mb-8">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Switches</div>
      <div className="bg-card border border-line rounded-2xl p-4 flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-ink">Age check at signup</div>
          <div className="text-sm text-muted">18+ for customers and professionals; apprentices from 15 with a parent or guardian's consent.</div>
          {error && <div className="text-sm text-bad-fg mt-1">{error}</div>}
        </div>
        <button onClick={flip} disabled={busy} role="switch" aria-checked={ageCheck}
          className={"shrink-0 w-14 h-8 rounded-full relative transition-colors " + (ageCheck ? "bg-emerald-600" : "bg-surface-2 border border-line")}>
          <span className={"absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all " + (ageCheck ? "left-7" : "left-1")} />
          <span className="sr-only">{ageCheck ? "On" : "Off"}</span>
        </button>
      </div>
    </div>
  );
}
