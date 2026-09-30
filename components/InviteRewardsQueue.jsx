"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import { formatMinor } from "../lib/money";

// Admin: invite rewards earned and waiting to be paid by hand, grouped by the
// person to pay, with each qualifying job shown so it can be checked first.
const VIEWS = [["UNDER_REVIEW", "Under review"], ["CHECKING", "Checking"], ["VALIDATED", "Confirmed"], ["VOID", "Not eligible"]];
// Warning signs, in plain words (see the backend's lib/invites.js).
export const FLAG_TEXT = {
  REFERRER_INVOLVED: "The person who invited them was also on this job.",
  QUICK_FIRST_JOB: "The first job was completed within 24 hours of the account being created.",
  SAME_PROFESSIONAL: "Several of this person's invites completed their first job with the same professional.",
};

export default function InviteRewardsQueue({ onDecision }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("UNDER_REVIEW");
  const load = useCallback(() => {
    apiFetch(`/admin/invite-rewards?status=${view}`).then(setData).catch((e) => setError(e.message));
  }, [view]);
  useEffect(() => { load(); }, [load]);
  const done = () => { load(); if (onDecision) onDecision(); };

  return (
    <div className="mb-8">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">
        Invite Rewards: future coupons
      </div>
      {error && <div className="text-bad-fg">{error}</div>}
      {!data && !error && <div className="text-muted">Loading…</div>}
      <p className="text-xs text-muted mb-2">No cash is paid while Mepluge takes no payments; confirmed rewards become coupons once Mepluge is monetised. Rewards are checked for 7 days and confirmed automatically unless there's a warning sign; those wait here for you.</p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
        {VIEWS.map(([k, label]) => (
          <button key={k} onClick={() => { setData(null); setView(k); }} aria-pressed={view === k}
            className={"px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap " + (view === k ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>
            {label}{data && data.summary ? ` (${{ UNDER_REVIEW: data.summary.underReview, CHECKING: data.summary.checking, VALIDATED: data.summary.validated, VOID: data.summary.voided }[k]})` : ""}
          </button>
        ))}
      </div>
      {data && (
        <div className="text-xs text-muted mb-3">
          {data.summary.joined} joined and waiting for their first job
        </div>
      )}
      {data && data.groups.length === 0 && <div className="text-muted">Nothing here right now.</div>}
      {data && data.groups.map((g) => <PayGroup key={g.referrerType + g.referrerId} group={g} onDone={done} />)}
    </div>
  );
}

function PayGroup({ group, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [voiding, setVoiding] = useState(null);
  const [reason, setReason] = useState("");
  const total = formatMinor(group.totalMinor, group.currency);

  const confirmOne = async (id) => {
    setBusy(true); setError(null);
    try { await apiFetch(`/admin/invite-rewards/${id}/validate`, { method: "POST" }); onDone(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const voidOne = async (id) => {
    setBusy(true); setError(null);
    try { await apiFetch(`/admin/invite-rewards/${id}/void`, { method: "POST", body: JSON.stringify({ reason }) }); setVoiding(null); setReason(""); onDone(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="bg-card border border-line rounded-2xl p-4 mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-ink">{group.name}</div>
          <div className="text-sm text-muted">
            {group.referrerType === "customer" ? "Customer" : "Professional"}
            {group.phone && <> · <a href={`tel:${group.phone}`} className="text-hibiscus-deep font-semibold">{group.phone}</a></>}
            {group.code && <> · code {group.code}</>}
          </div>
        </div>
        <div className="text-xl font-bold text-ink whitespace-nowrap">{total}</div>
      </div>

      <div className="mt-3 space-y-2">
        {group.rewards.map((r) => (
          <div key={r._id} className="bg-surface rounded-xl p-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-ink font-semibold">{r.referredName} <span className="text-muted font-normal">joined as a {r.joinedAs === "stylist" ? "professional" : "customer"}</span></span>
              <span className="text-muted-strong whitespace-nowrap">{formatMinor(r.amountMinor, r.currency)}</span>
            </div>
            {r.job
              ? <div className="text-muted mt-0.5">First job: {r.job.service}{r.job.professional ? ` with ${r.job.professional}` : ""}{r.job.completedAt ? ` · completed ${new Date(r.job.completedAt).toLocaleDateString()}` : ""}</div>
              : <div className="text-muted mt-0.5">Job details unavailable</div>}
            {(r.flags || []).map((f) => (
              <div key={f} className="mt-2 text-warn-fg bg-warn-bg border border-warn-line rounded-lg px-2 py-1">⚠ {FLAG_TEXT[f] || f}</div>
            ))}
            {voiding === r._id ? (
              <div className="mt-2 flex gap-2">
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why isn't this eligible?" className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-line bg-card" />
                <button onClick={() => voidOne(r._id)} disabled={busy || reason.trim().length < 5} className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold disabled:opacity-40">Void</button>
                <button onClick={() => { setVoiding(null); setReason(""); }} className="px-3 py-1.5 rounded-full border border-line text-xs">Cancel</button>
              </div>
            ) : (
              <span className="flex gap-3 mt-1">
                {["UNDER_REVIEW", "CHECKING", "EARNED"].includes(r.status) && <button onClick={() => confirmOne(r._id)} disabled={busy} className="text-xs text-ok-fg font-bold underline">Confirm</button>}
                {r.status !== "VOID" && <button onClick={() => setVoiding(r._id)} className="text-xs text-bad-fg underline">Not eligible?</button>}
                {r.status === "VOID" && r.voidReason && <span className="text-xs text-muted">Reason: {r.voidReason}</span>}
              </span>
            )}
          </div>
        ))}
      </div>

      {error && <div className="text-bad-fg text-sm mt-2">{error}</div>}
    </div>
  );
}
