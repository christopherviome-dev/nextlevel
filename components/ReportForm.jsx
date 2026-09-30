"use client";
import { useState } from "react";
import { apiFetch } from "../lib/api";

const CATEGORIES = {
  stylist: [["NO_SHOW", "Didn't show up"], ["UNSAFE", "I felt unsafe"], ["HARASSMENT", "Harassment"], ["FRAUD", "Fraud or scam"], ["POOR_SERVICE", "Poor service"], ["FAKE_PROFILE", "Fake profile"], ["OTHER", "Something else"]],
  customer: [["NO_SHOW", "Didn't show up"], ["UNSAFE", "I felt unsafe"], ["HARASSMENT", "Harassment"], ["FRAUD", "Fraud or scam"], ["OTHER", "Something else"]],
};
// The emergency number comes first: an app can't replace it.
const EMERGENCY = { GH: "112", GB: "999" };

// "Report a problem": about a professional (from their shop or a booking), or,
// for professionals, about a customer they had a booking with.
export default function ReportForm({ targetType = "stylist", stylistId, requestId, name, country = "GH", actor = null, label }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(null);
  const [detail, setDetail] = useState("");
  const [contact, setContact] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const emergency = EMERGENCY[country] || "112";

  if (done) return <p className="text-sm text-ok-fg mt-2">✓ Thank you. Mepluge will look into it{contact || actor ? " and may contact you" : ""}.</p>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-xs text-muted underline mt-2">{label || "Report a problem"}</button>;

  const send = async () => {
    setBusy(true); setError(null);
    try {
      await apiFetch("/reports", { method: "POST", body: JSON.stringify({
        targetType, stylistId: targetType === "stylist" ? stylistId : undefined, requestId, category, detail, contact: contact || undefined, urgent,
      }) }, actor);
      setDone(true);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="mt-3 bg-surface border border-line rounded-xl p-3 space-y-2 text-sm">
      <div className="font-bold text-ink">Report a problem{name ? ` with ${name}` : ""}</div>
      <div className="bg-bad-bg border border-bad-line text-bad-fg rounded-lg px-3 py-2">
        <b>In danger right now?</b> Call <a href={`tel:${emergency}`} className="underline font-bold">{emergency}</a> first.
      </div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES[targetType].map(([k, l]) => (
          <button type="button" key={k} onClick={() => setCategory(k)} aria-pressed={category === k}
            className={"px-3 py-1.5 rounded-full border text-xs font-bold " + (category === k ? "bg-violet text-white border-violet" : "bg-card border-line text-plum")}>{l}</button>
        ))}
      </div>
      <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} maxLength={2000}
        placeholder="What happened? Include dates and details that will help." className="w-full px-3 py-2 rounded-lg border border-line bg-card" />
      {!actor && <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={100} placeholder="Your phone (optional, so Mepluge can follow up)" className="w-full px-3 py-2 rounded-lg border border-line bg-card" />}
      <label className="flex items-center gap-2 text-muted-strong">
        <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="w-4 h-4" /> This is urgent (someone's safety)
      </label>
      {error && <p className="text-bad-fg">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={send} disabled={busy || detail.trim().length < 10} className="px-4 py-2 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">{busy ? "Sending…" : "Send report"}</button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-full border border-line font-bold">Cancel</button>
      </div>
      <p className="text-xs text-muted">Only Mepluge's team sees reports.{targetType === "customer" ? "" : ` ${name || "They"} won't see who reported.`}</p>
    </div>
  );
}
