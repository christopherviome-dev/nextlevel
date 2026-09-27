"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

// Opens (or reuses) the conversation with a shop, then shows it in Messages.
export default function MessageButton({ stylistId, requestId, small = false }) {
  const { customerToken } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const cls = small ? "px-3 py-1.5 rounded-full text-sm font-bold border border-line bg-card text-plum" : "px-4 py-2 rounded-full border border-line bg-card text-sm font-bold text-plum";
  if (!customerToken) return <Link href="/requests" className={cls}>💬 Message</Link>;
  const start = async () => {
    setBusy(true); setError(null);
    try {
      const conv = await apiFetch("/conversations", { method: "POST", body: JSON.stringify({ stylistId, requestId }) }, "customer");
      router.push(`/messages?c=${conv._id}`);
    } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <>
      <button onClick={start} disabled={busy} className={cls}>💬 {busy ? "Opening…" : "Message"}</button>
      {error && <span className="text-xs text-bad-fg ml-2">{error}</span>}
    </>
  );
}
