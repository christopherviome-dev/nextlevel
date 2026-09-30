"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import { useCatalog } from "../../lib/catalog";
import ReviewWorks from "./ReviewWorks";

const inputDate = (t) => (t ? new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "");

// A supervisor managing one apprentice's training.
export default function TrainingEditor({ apprenticeId, onClose, onGraduated }) {
  const catalog = useCatalog();
  const [data, setData] = useState(null);
  const [templates, setTemplates] = useState({});
  const [service, setService] = useState("hair");
  const [custom, setCustom] = useState("");
  const [focus, setFocus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const base = `/training/apprentices/${apprenticeId}`;
  const load = useCallback(() => {
    apiFetch(base).then((d) => { setData(d); setFocus(d.plan.weekFocus || ""); }).catch((e) => setError(e.message));
  }, [base]);
  useEffect(() => { load(); apiFetch("/training/templates").then(setTemplates).catch(() => {}); }, [load]);
  const run = async (fn) => { setBusy(true); setError(null); try { await fn(); load(); } catch (e) { setError(e.message); } finally { setBusy(false); } };

  if (!data) return <p className="text-sm text-muted">{error || "Loading…"}</p>;
  const { plan, progress, name, isMinor, graduated } = data;
  const have = new Set(plan.skills.map((s) => s.name.toLowerCase()));
  const suggestions = (templates[service] || []).filter((n) => !have.has(n.toLowerCase()));

  return (
    <div className="space-y-4">
      <button onClick={onClose} className="text-sm font-bold text-hibiscus-deep">‹ All trainees</button>
      <div className="bg-card border border-line rounded-2xl p-4">
        <div className="font-display font-extrabold text-lg text-ink">{name}{graduated ? " · 🎓 Graduated" : ""}</div>
        <div className="mt-2 h-3 rounded-full bg-surface-2 overflow-hidden"><div className="h-full bg-emerald-600" style={{ width: `${progress.percent}%` }} /></div>
        <div className="text-sm text-muted-strong mt-1">{progress.signedOff} of {progress.total} skills signed off</div>
      </div>

      {!graduated && (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block font-bold mb-1">Expected completion</span>
              <input type="date" defaultValue={inputDate(plan.expectedCompletion)} onChange={(e) => e.target.value && run(() => apiFetch(base, { method: "PUT", body: JSON.stringify({ expectedCompletion: new Date(e.target.value + "T12:00").getTime() }) }))}
                className="w-full px-3 py-2 rounded-xl border border-line bg-card" />
            </label>
            <label className="text-sm">
              <span className="block font-bold mb-1">This week's focus</span>
              <div className="flex gap-2">
                <input value={focus} onChange={(e) => setFocus(e.target.value)} maxLength={200} placeholder="e.g. neat parting on knotless" className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-line bg-card" />
                <button onClick={() => run(() => apiFetch(base, { method: "PUT", body: JSON.stringify({ weekFocus: focus }) }))} disabled={busy} className="px-3 rounded-full border border-line text-sm font-bold">Save</button>
              </div>
            </label>
          </div>

          <div>
            <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Add skills</div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
              {catalog.filter((c) => templates[c.key]).map((c) => (
                <button key={c.key} onClick={() => setService(c.key)} aria-pressed={service === c.key}
                  className={"px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap " + (service === c.key ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>{c.name}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((n) => (
                <button key={n} onClick={() => run(() => apiFetch(`${base}/skills`, { method: "POST", body: JSON.stringify({ names: [n] }) }))} disabled={busy}
                  className="px-3 py-1.5 rounded-full border border-line bg-surface text-sm">+ {n}</button>
              ))}
              {suggestions.length === 0 && <span className="text-xs text-muted">All of these are added.</span>}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={60} placeholder="Or type your own skill" className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-line bg-card text-sm" />
              <button onClick={() => run(async () => { await apiFetch(`${base}/skills`, { method: "POST", body: JSON.stringify({ names: [custom] }) }); setCustom(""); })} disabled={busy || custom.trim().length < 2}
                className="px-4 rounded-full bg-violet text-white text-sm font-bold disabled:opacity-40">Add</button>
            </div>
          </div>
        </>
      )}

      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Skills</div>
        {plan.skills.length === 0 && <p className="text-sm text-muted">No skills yet: add some above.</p>}
        {plan.skills.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 bg-card border border-line rounded-xl p-3 mb-2">
            <span className="text-sm text-ink">{s.name}</span>
            {graduated ? <span className="text-xs text-muted">{s.status === "SIGNED_OFF" ? "✓ Signed off" : "Not signed off"}</span> : (
              <span className="flex items-center gap-2 shrink-0">
                <select value={s.status} onChange={(e) => run(() => apiFetch(`${base}/skills/${s.id}`, { method: "PUT", body: JSON.stringify({ status: e.target.value }) }))} disabled={busy}
                  className="px-2 py-1 rounded-lg border border-line bg-card text-xs">
                  <option value="NOT_STARTED">Not started</option><option value="PRACTISING">Practising</option><option value="SIGNED_OFF">✓ Signed off</option>
                </select>
                <button onClick={() => window.confirm(`Remove "${s.name}"?`) && run(() => apiFetch(`${base}/skills/${s.id}`, { method: "DELETE" }))} className="text-xs text-bad-fg underline">Remove</button>
              </span>
            )}
          </div>
        ))}
      </div>

      <ReviewWorks apprenticeId={apprenticeId} isMinor={isMinor} name={name} onChanged={load} />

      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Feedback</div>
        {!graduated && (
          <div className="flex gap-2 mb-2">
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} maxLength={1000} placeholder="What went well, what to work on" className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-line bg-card text-sm" />
            <button onClick={() => run(async () => { await apiFetch(`${base}/feedback`, { method: "POST", body: JSON.stringify({ text: feedback }) }); setFeedback(""); })} disabled={busy || feedback.trim().length < 2}
              className="px-4 rounded-full bg-violet text-white text-sm font-bold disabled:opacity-40">Send</button>
          </div>
        )}
        {[...plan.feedback].reverse().map((f) => <div key={f.id} className="bg-surface rounded-xl p-3 mb-2 text-sm whitespace-pre-line">{f.text}</div>)}
      </div>

      {error && <p className="text-sm text-bad-fg">{error}</p>}
      {!graduated && (
        <div className="bg-card border border-line rounded-2xl p-4">
          <div className="font-bold text-ink">Ready to work independently?</div>
          <p className="text-sm text-muted mt-1">Graduating makes {name} an independent professional. They keep their code and history, and their own shop goes to Mepluge for approval.</p>
          {isMinor ? <p className="text-sm text-warn-fg mt-2">{name} is under 18, so they can graduate once they turn 18.</p> : (
            <button onClick={() => window.confirm(`Graduate ${name}? This makes them an independent professional.`) && run(async () => { await apiFetch(`${base}/graduate`, { method: "POST" }); if (onGraduated) onGraduated(); })}
              disabled={busy} className="mt-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white font-bold">🎓 Graduate {name}</button>
          )}
        </div>
      )}
    </div>
  );
}
