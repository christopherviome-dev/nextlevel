"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import { formatMinor } from "../lib/money";

// Admin: invite rewards earned and waiting to be paid by hand, grouped by the
// person to pay, with each qualifying job shown so it can be checked first.
export default function InviteRewardsQueue({ onDecision }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    apiFetch("/admin/invite-rewards").then(setData).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);
  const done = () => { load(); if (onDecision) onDecision(); };

  return (
    <div className="mb-8">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">
        Invite Rewards to Pay {data && `(${data.summary.earned})`}
      </div>
      {error && <div className="text-bad-fg">{error}</div>}
      {!data && !error && <div className="text-muted">Loading…</div>}
      {data && (
        <div className="text-xs text-muted mb-3">
          {data.summary.joined} waiting for a first job · {data.summary.earned} to pay · {data.summary.paid} paid · {data.summary.voided} not eligible
        </div>
      )}
      {data && data.groups.length === 0 && <div className="text-muted">No rewards waiting to be paid.</div>}
      {data && data.groups.map((g) => <PayGroup key={g.referrerType + g.referrerId} group={g} onDone={done} />)}
    </div>
  );
}

function PayGroup({ group, onDone }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [voiding, setVoiding] = useState(null);
  const [reason, setReason] = useState("");
  const total = formatMinor(group.totalMinor, group.currency);

  const pay = async () => {
    if (!window.confirm(`Mark ${total} as paid to ${group.name}? Only do this after you've sent the money.`)) return;
    setBusy(true); setError(null);
    try { await apiFetch("/admin/invite-rewards/pay", { method: "POST", body: JSON.stringify({ rewardIds: group.rewards.map((r) => r._id), note }) }); onDone(); }
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
            {r.flag === "REFERRER_INVOLVED" && (
              <div className="mt-2 text-warn-fg bg-warn-bg border border-warn-line rounded-lg px-2 py-1">
                Check this one: {group.name} was also on this job. It's normal when someone joins from a shop's own QR code, but make sure the job was real before paying.
              </div>
            )}
            {voiding === r._id ? (
              <div className="mt-2 flex gap-2">
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why isn't this eligible?" className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-line bg-card" />
                <button onClick={() => voidOne(r._id)} disabled={busy || reason.trim().length < 5} className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold disabled:opacity-40">Void</button>
                <button onClick={() => { setVoiding(null); setReason(""); }} className="px-3 py-1.5 rounded-full border border-line text-xs">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setVoiding(r._id)} className="mt-1 text-xs text-bad-fg underline">Not eligible?</button>
            )}
          </div>
        ))}
      </div>

      {error && <div className="text-bad-fg text-sm mt-2">{error}</div>}
      <div className="flex gap-2 mt-3 flex-wrap">
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Payment reference, e.g. MoMo ID"
          className="flex-1 min-w-[12rem] px-3 py-2 rounded-full border border-line bg-card text-sm" />
        <button onClick={pay} disabled={busy} className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold text-sm disabled:opacity-40">Mark {total} as paid</button>
      </div>
    </div>
  );
}
