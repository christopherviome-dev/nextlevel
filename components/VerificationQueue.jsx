"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";

const NAME_CHECK = {
  MATCH: { text: "Registration name is part of the legal name", cls: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
  PARTIAL: { text: "Only partly matches the registration name. Check carefully", cls: "bg-amber-900/40 text-amber-300 border-amber-700" },
  DIFFERENT: { text: "Doesn't match the registration name at all", cls: "bg-red-900/40 text-red-300 border-red-700" },
  UNKNOWN: { text: "No legal name to compare", cls: "bg-[#241318] text-[#a88b95] border-[#3a2028]" },
};

const QUICK_REASONS = [
  "The name you typed doesn't match the name on your card.",
  "The card photo is unclear or unreadable. Please upload a sharper photo.",
  "The card number you typed doesn't match the card in the photo.",
  "Please resubmit with your full legal name exactly as on your card.",
  "This card number is already linked to another Sheeba account.",
];

export default function VerificationQueue({ onDecision }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    apiFetch("/admin/verifications").then(setItems).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const done = () => { load(); if (onDecision) onDecision(); };

  return (
    <div className="mb-8">
      <div className="text-xs font-extrabold tracking-wide text-marigold uppercase mb-2">
        ID Verification Queue {items && `(${items.length})`}
      </div>
      {error && <div className="text-red-300">{error}</div>}
      {!items && !error && <div className="text-[#a88b95]">Loading…</div>}
      {items && items.length === 0 && <div className="text-[#a88b95]">No submissions waiting for review.</div>}
      {items && items.map((item) => <Submission key={item._id} item={item} onDone={done} />)}
    </div>
  );
}

function Submission({ item, onDone }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [zoom, setZoom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const check = NAME_CHECK[item.nameCheck] || NAME_CHECK.UNKNOWN;
  const incomplete = item.missing.length > 0;

  const act = async (fn) => {
    setBusy(true); setError(null);
    try { await fn(); onDone(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const approve = () => {
    if (!window.confirm(`Approve ${item.legalFullName}? Only approve if the name and number on the card photo match exactly.`)) return;
    act(() => apiFetch(`/stylists/${item._id}/approve`, { method: "POST" }));
  };
  const reject = () => act(() => apiFetch(`/stylists/${item._id}/reject-verification`, { method: "POST", body: JSON.stringify({ reason }) }));

  return (
    <div className="bg-[#241318] border border-[#3a2028] rounded-2xl p-4 mb-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <div>
            <div className="text-[#a88b95] text-xs uppercase">Legal name they typed</div>
            <div className="text-xl font-bold text-white">{item.legalFullName || <span className="text-red-300">Missing</span>}</div>
          </div>
          <div><span className="text-[#a88b95]">Registered as:</span> {item.name}{item.salonName ? ` · ${item.salonName}` : ""}</div>
          <div className={`border rounded-lg px-3 py-2 ${check.cls}`}>{check.text}</div>
          <div>
            <span className="text-[#a88b95]">Card number:</span> <b className="text-white">{item.ghanaCardNum || "Missing"}</b>{" "}
            {item.ghanaCardNum && !item.cardFormatValid && <span className="text-red-300">(invalid format)</span>}
          </div>
          {item.duplicateAccounts.length > 0 && (
            <div className="border border-red-700 bg-red-900/40 text-red-200 rounded-lg px-3 py-2">
              ⚠ This card number is also on:{" "}
              {item.duplicateAccounts.map((d) => `${d.name}${d.salonName ? ` (${d.salonName})` : ""}${d.verified ? " — already VERIFIED" : ""}`).join(", ")}
            </div>
          )}
          {incomplete && <div className="text-red-300">Incomplete: missing {item.missing.join(", ")}. Reject and ask them to resubmit.</div>}
          <div className="text-[#a88b95] text-xs">
            Compare the name above with the card photo letter by letter. The automatic checks help, but only you can confirm the card.
          </div>
          {item.submittedAt && <div className="text-[#a88b95] text-xs">Submitted {new Date(item.submittedAt).toLocaleString()}</div>}
        </div>
        <div>
          {item.verifyPhoto ? (
            <div className={zoom ? "overflow-auto max-h-[70vh] border border-[#3a2028] rounded-lg" : ""}>
              <img src={item.verifyPhoto} alt="Submitted Ghana Card" onClick={() => setZoom(!zoom)}
                className={(zoom ? "max-w-none" : "w-full") + " rounded-lg cursor-zoom-in"} />
            </div>
          ) : <div className="text-red-300">No card photo</div>}
          {item.verifyPhoto && <div className="text-xs text-[#a88b95] mt-1">Tap the photo to {zoom ? "shrink" : "enlarge"}.</div>}
        </div>
      </div>

      {error && <div className="text-red-300 mt-3">{error}</div>}

      {!rejecting ? (
        <div className="flex gap-2 mt-4">
          <button onClick={approve} disabled={busy || incomplete}
            className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold disabled:opacity-40">Approve</button>
          <button onClick={() => setRejecting(true)} disabled={busy}
            className="px-5 py-2 rounded-full border border-red-400 text-red-300 font-bold">Reject</button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map((r) => (
              <button key={r} onClick={() => setReason(r)}
                className="text-xs px-3 py-1.5 rounded-full border border-[#3a2028] hover:border-marigold text-left">{r}</button>
            ))}
          </div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
            placeholder="Reason the stylist will see" className="w-full px-3 py-2 rounded-lg bg-[#1a1015] border border-[#3a2028] text-[#f0dad0]" />
          <div className="flex gap-2">
            <button onClick={reject} disabled={busy || reason.trim().length < 5}
              className="px-5 py-2 rounded-full bg-red-600 text-white font-bold disabled:opacity-40">Send rejection</button>
            <button onClick={() => { setRejecting(false); setReason(""); }} className="px-5 py-2 rounded-full border border-[#3a2028]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
