"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";

// Admin: "Forgot password?" requests. Identity is confirmed by calling the
// phone number stored on the account, then a temporary password is issued
// and shown ONCE to read out over the phone.
export default function PasswordResetQueue({ onDecision }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    apiFetch("/admin/password-resets").then(setItems).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const done = () => { load(); if (onDecision) onDecision(); };

  return (
    <div className="mb-8">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">
        Password Help {items && `(${items.length})`}
      </div>
      {error && <div className="text-bad-fg">{error}</div>}
      {!items && !error && <div className="text-muted">Loading…</div>}
      {items && items.length === 0 && <div className="text-muted">No one is waiting for password help.</div>}
      {items && items.map((item) => <HelpRequest key={item._id} item={item} onDone={done} />)}
    </div>
  );
}

function HelpRequest({ item, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [issued, setIssued] = useState(null);

  const issue = async () => {
    if (!window.confirm(`Have you called ${item.phone} and confirmed you're speaking to ${item.name}?\n\nOnly continue if you have. The temporary password will be shown once.`)) return;
    setBusy(true); setError(null);
    try { setIssued(await apiFetch(`/admin/password-resets/${item._id}/issue`, { method: "POST" })); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const dismiss = async () => {
    if (!window.confirm("Dismiss this request? Nothing about the account will change.")) return;
    setBusy(true); setError(null);
    try { await apiFetch(`/admin/password-resets/${item._id}/dismiss`, { method: "POST" }); onDone(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  if (issued) {
    return (
      <div className="bg-card border border-ok-line rounded-2xl p-4 mb-4 space-y-2">
        <div className="text-ok-fg font-bold">Temporary password for {issued.name}</div>
        <div className="text-3xl font-mono tracking-wider text-ink select-all">{issued.tempPassword}</div>
        <p className="text-sm text-muted">
          Read it out on the call to {issued.phone}. It won't be shown again. When they log in, Sheeba will make them choose their own password straight away.
        </p>
        <button onClick={onDone} className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold">Done, I've given it to them</button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-line rounded-2xl p-4 mb-4">
      <div className="text-ink font-bold">{item.accountFound ? (item.salonName || item.name) : "Account no longer exists"}</div>
      <div className="text-sm text-muted">
        {item.accountType === "customer" ? "Customer" : "Professional"}{item.salonName && item.name ? ` · ${item.name}` : ""}
        {item.createdAt && ` · asked ${new Date(item.createdAt).toLocaleString()}`}
      </div>
      {item.phone && (
        <div className="mt-2 text-sm">
          Call the number on the account: <a href={`tel:${item.phone}`} className="text-hibiscus-deep font-bold">{item.phone}</a>
        </div>
      )}
      <p className="text-xs text-muted mt-1">Only use this number, never one the person gives you another way. Answering it is what proves it's really them.</p>
      {error && <div className="text-bad-fg mt-2">{error}</div>}
      <div className="flex gap-2 mt-3">
        <button onClick={issue} disabled={busy || !item.accountFound} className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold disabled:opacity-40">
          Issue temporary password
        </button>
        <button onClick={dismiss} disabled={busy} className="px-5 py-2 rounded-full border border-line text-ink">Dismiss</button>
      </div>
    </div>
  );
}
