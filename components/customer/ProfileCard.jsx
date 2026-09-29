"use client";
import { ringStyle } from "../../lib/founding";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { fitImage } from "../../lib/image";

const PHOTO = { maxDim: 600, maxChars: 480 * 1024 };

// A customer's profile: their picture, name, badge and numbers.
export default function ProfileCard() {
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    apiFetch("/customers/me", {}, "customer").then(setMe).catch(() => {});
    apiFetch("/customers/me/profile-stats", {}, "customer").then(setStats).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  const choose = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    setBusy(true); setError(null);
    try { setMe(await apiFetch("/customers/me", { method: "PUT", body: JSON.stringify({ profilePhoto: await fitImage(f, PHOTO) }) }, "customer")); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  if (!me) return null;
  const tile = (n, label) => <div className="text-center"><div className="text-xl font-bold text-ink">{n}</div><div className="text-[11px] text-muted leading-tight">{label}</div></div>;
  return (
    <div className="bg-card border border-line rounded-2xl p-4">
      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer shrink-0" aria-label={me.profilePhoto ? "Change your photo" : "Add your photo"}>
          <input type="file" accept="image/*" onChange={choose} className="sr-only" disabled={busy} />
          {me.profilePhoto
            ? <img src={me.profilePhoto} alt="" style={ringStyle(me)} className="w-20 h-20 rounded-full object-cover border border-line" />
            : <span style={ringStyle(me)} className="w-20 h-20 rounded-full bg-violet text-white text-2xl font-bold flex items-center justify-center">{(me.name || "?").slice(0, 1).toUpperCase()}</span>}
          <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-hibiscus text-white text-sm flex items-center justify-center border-2 border-card">{busy ? "…" : "+"}</span>
        </label>
        <div className="min-w-0 flex-1">
          <div className="font-display font-extrabold text-xl text-ink truncate">{me.name}</div>
          {stats && stats.memberNumber && <div className="text-xs font-bold text-warn-fg">{stats.founding ? `⭐ Founding member #${stats.memberNumber}` : `Member #${stats.memberNumber}`}</div>}
          <Link href="/settings" className="text-xs font-bold text-hibiscus-deep">⚙ Settings</Link>
        </div>
      </div>
      {stats && (
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-line">
          {tile(stats.completedServices, "services done")}
          {tile(stats.savedStyles, "styles saved")}
          <Link href="/saved" className="block">{tile(stats.savedShops, "following")}</Link>
        </div>
      )}
      {error && <p className="text-sm text-bad-fg mt-2">{error}</p>}
    </div>
  );
}
