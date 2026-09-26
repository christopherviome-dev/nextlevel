"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

// "Save shop" on a shop page. Saving to an account needs a customer login
// (the server checks this too), so logged-out visitors get a way to log in.
export default function SaveShopButton({ shopId }) {
  const { customerToken } = useAuth();
  const [me, setMe] = useState(null);
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!customerToken) return;
    let cancelled = false;
    Promise.all([apiFetch("/customers/me", {}, "customer"), apiFetch("/customers/me/following", {}, "customer")])
      .then(([m, list]) => { if (!cancelled) { setMe(m); setSaved(list.some((s) => String(s._id) === String(shopId))); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [customerToken, shopId]);

  if (!customerToken) return <Link href="/requests" className="px-4 py-2 rounded-full border border-line bg-card text-sm font-bold text-plum">♡ Save shop</Link>;
  if (saved === null || !me) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      const r = await apiFetch(`/stylists/${shopId}/follow?lean=1`, { method: "POST", body: JSON.stringify({ clientId: me._id }) }, "customer");
      setSaved(r.following);
    } catch (e) { /* leave as it was */ } finally { setBusy(false); }
  };
  return (
    <button onClick={toggle} disabled={busy} aria-pressed={saved}
      className={"px-4 py-2 rounded-full border text-sm font-bold " + (saved ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>
      {saved ? "✓ Saved" : "♡ Save shop"}
    </button>
  );
}
