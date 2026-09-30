"use client";
import { useState } from "react";

// Shows who invited this person, instead of an unexplained code box.
// The inviter's name is known only for live shops (customers' names stay private).
export default function InviteLine({ code, name, onChange }) {
  const [editing, setEditing] = useState(false);
  if (!editing && code) {
    return (
      <div className="flex items-center justify-between gap-2 bg-surface rounded-xl px-4 py-3 text-sm">
        <span className="text-muted-strong">🎟 Invited by <b className="text-ink">{name || "a Mepluge member"}</b> <span className="text-muted font-mono">({code})</span></span>
        <button type="button" onClick={() => setEditing(true)} className="text-hibiscus-deep font-bold underline whitespace-nowrap">Change</button>
      </div>
    );
  }
  return (
    <div>
      <input placeholder="Invite code (optional)" value={code} onChange={(e) => onChange(e.target.value.toUpperCase())} maxLength={8}
        className="w-full px-4 py-3 rounded-xl border border-line font-mono tracking-widest" />
      <p className="text-xs text-muted mt-1">If someone invited you, enter their code so they're thanked.</p>
    </div>
  );
}
