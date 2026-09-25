"use client";
import { useState } from "react";
import { apiFetch } from "../lib/api";

// Used by professionals (endpoint /auth/change-password) and customers
// (endpoint /customers/me/change-password, actor "customer").
// `forced` = the user is on a temporary password and must choose their own.
export default function ChangePasswordForm({ endpoint, actor = null, forced = false, onDone }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 8;
  const canSubmit = current && next.length >= 8 && next === confirm && !busy;

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      await apiFetch(endpoint, { method: "POST", body: JSON.stringify({ currentPassword: current, newPassword: next }) }, actor);
      setSaved(true); setCurrent(""); setNext(""); setConfirm("");
      if (onDone) await onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  if (saved && !forced) return <p className="text-sm text-emerald-800 font-semibold">✓ Password changed.</p>;

  return (
    <form onSubmit={submit} className="space-y-2">
      <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)}
        placeholder={forced ? "Temporary password" : "Current password"} className="w-full px-4 py-3 rounded-xl border border-line" />
      <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)}
        placeholder="New password (at least 8 characters)" className="w-full px-4 py-3 rounded-xl border border-line" />
      {tooShort && <p className="text-xs text-hibiscus-deep">At least 8 characters.</p>}
      <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
        placeholder="Type the new password again" className="w-full px-4 py-3 rounded-xl border border-line" />
      {mismatch && <p className="text-xs text-hibiscus-deep">The two new passwords don't match.</p>}
      {error && <p className="text-sm text-hibiscus-deep">{error}</p>}
      <button type="submit" disabled={!canSubmit} className="px-5 py-3 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">
        {busy ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
