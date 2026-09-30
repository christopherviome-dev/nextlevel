"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import MyWorks from "./MyWorks";

const STATUS = {
  NOT_STARTED: ["Not started", "bg-surface-2 text-muted-strong border-line"],
  PRACTISING: ["Practising", "bg-warn-bg text-warn-fg border-warn-line"],
  SIGNED_OFF: ["✓ Signed off", "bg-ok-bg text-ok-fg border-ok-line"],
};
const day = (t) => new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

// An apprentice's own training: progress, this week's focus, skills (they can
// mark "practising"; only their supervisor signs off) and feedback.
export default function MyTraining({ onGoToShare }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const load = useCallback(() => { apiFetch("/training/me").then(setData).catch((e) => setError(e.message)); }, []);
  useEffect(() => { load(); }, [load]);
  const practise = async (s) => {
    setBusy(s.id);
    try { await apiFetch(`/training/me/skills/${s.id}`, { method: "PUT", body: JSON.stringify({ status: s.status === "PRACTISING" ? "NOT_STARTED" : "PRACTISING" }) }); load(); }
    catch (e) { setError(e.message); } finally { setBusy(null); }
  };
  if (error && !data) return <p className="text-sm text-muted bg-card border border-line rounded-2xl p-4">{error}</p>;
  if (!data) return <p className="text-sm text-muted">Loading your training…</p>;
  const { plan, progress, supervisor, graduated } = data;
  return (
    <div className="space-y-4">
      {graduated && (
        <div className="bg-ok-bg border border-ok-line rounded-2xl p-4 text-ok-fg">
          <div className="font-bold">🎓 You've graduated!</div>
          <p className="text-sm mt-1">You're now an independent professional. Set up your own shop under "Shop page" and "Services"; Mepluge will review it before it goes public. Your training record stays here.</p>
        </div>
      )}
      {!graduated && (() => {
        // One clear thing to do now, before everything else (stupidly simple).
        const sup = supervisor ? supervisor.name : "your supervisor";
        const practising = plan.skills.find((x) => x.status === "PRACTISING");
        const next = plan.skills.length === 0 ? { text: `${sup} hasn't added your skills yet. Ask them to set up your training (My Shop → Team → your name).` }
          : plan.weekFocus ? { text: `This week: ${plan.weekFocus}. Practise it, then post a photo of your work for ${sup} to review.`, post: true }
          : practising ? { text: `Keep practising ${practising.name}, then post a photo of your work for ${sup} to review.`, post: true }
          : { text: "Pick a skill below and tap \"I'm practising\" to start." };
        return (
          <div className="bg-violet text-white rounded-2xl p-4">
            <div className="text-xs font-extrabold tracking-wide uppercase text-white/80">Do this next</div>
            <div className="mt-1 font-bold">{next.text}</div>
            {next.post && <a href="#post-work" className="inline-block mt-3 px-4 py-2 rounded-full bg-white text-violet text-sm font-bold">📸 Post a photo</a>}
          </div>
        );
      })()}
      <div className="bg-card border border-line rounded-2xl p-4">
        <div className="text-xs text-muted">Training with</div>
        <div className="font-bold text-ink">{supervisor ? supervisor.name : "your supervisor"}</div>
        <div className="mt-3 h-3 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-emerald-600" style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="text-sm text-muted-strong mt-1">{progress.signedOff} of {progress.total} skills signed off{progress.total ? ` (${progress.percent}%)` : ""}</div>
        {plan.expectedCompletion && <div className="text-sm text-muted mt-1">Expected to complete: {day(plan.expectedCompletion)}</div>}
        <div className="text-xs text-muted mt-1">Started {day(plan.startedAt)}</div>
      </div>
      {plan.weekFocus && (
        <div className="bg-warn-bg border border-warn-line rounded-2xl p-4">
          <div className="text-xs font-extrabold tracking-wide uppercase text-warn-fg">This week's focus</div>
          <div className="text-ink mt-1">{plan.weekFocus}</div>
        </div>
      )}
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Skills</div>
        {plan.skills.length === 0 && <p className="text-sm text-muted">Your supervisor hasn't added skills yet.</p>}
        {plan.skills.map((s) => {
          const [label, cls] = STATUS[s.status];
          return (
            <div key={s.id} className="flex items-center justify-between gap-2 bg-card border border-line rounded-xl p-3 mb-2">
              <span className="text-sm text-ink">{s.name}</span>
              <span className="flex items-center gap-2 shrink-0">
                <span className={"text-xs px-2 py-0.5 rounded-full border " + cls}>{label}</span>
                {!graduated && s.status !== "SIGNED_OFF" && (
                  <button onClick={() => practise(s)} disabled={busy === s.id} className="text-xs font-bold text-plum underline">
                    {s.status === "PRACTISING" ? "Not yet" : "I'm practising"}
                  </button>
                )}
              </span>
            </div>
          );
        })}
        {!graduated && plan.skills.length > 0 && <p className="text-xs text-muted">Only your supervisor can sign off a skill, once you've shown them.</p>}
      </div>
      {plan.feedback.length > 0 && (
        <div>
          <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Feedback from your supervisor</div>
          {[...plan.feedback].reverse().map((f) => (
            <div key={f.id} className="bg-card border border-line rounded-xl p-3 mb-2 text-sm">
              <div className="text-ink whitespace-pre-line">{f.text}</div>
              <div className="text-xs text-muted mt-1">{day(f.at)}</div>
            </div>
          ))}
        </div>
      )}
      <MyWorks skills={plan.skills} canPost={!graduated} />
      <button onClick={onGoToShare} className="w-full text-left bg-card border border-line rounded-2xl p-4 text-sm">
        <b className="text-ink">Invite people you know</b> <span className="text-muted">· your code and QR are under Share &amp; earn →</span>
      </button>
    </div>
  );
}
