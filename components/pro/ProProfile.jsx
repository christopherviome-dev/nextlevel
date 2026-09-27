"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { fitImage } from "../../lib/image";
import { Avatar } from "./ProShell";

const PHOTO = { maxDim: 600, maxChars: 480 * 1024 };

// A professional's profile: their picture, badges and numbers.
export default function ProProfile({ account, onSaved, go }) {
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { apiFetch("/stylists/me/profile-stats").then(setStats).catch((e) => setError(e.message)); }, []);
  const choose = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    setBusy(true); setError(null);
    try { await apiFetch("/stylists/me", { method: "PUT", body: JSON.stringify({ profilePhoto: await fitImage(f, PHOTO) }) }); await onSaved(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const tile = (n, label) => <div className="bg-surface rounded-xl p-3 text-center"><div className="text-2xl font-bold text-ink">{n}</div><div className="text-xs text-muted">{label}</div></div>;
  return (
    <div className="space-y-4">
      <div className="bg-card border border-line rounded-2xl p-5 text-center">
        <div className="inline-block relative"><Avatar account={account} size={96} /></div>
        <div className="mt-2">
          <label className="text-sm font-bold text-hibiscus-deep cursor-pointer">
            <input type="file" accept="image/*" onChange={choose} className="sr-only" disabled={busy} />
            {busy ? "Uploading…" : account.profilePhoto ? "Change photo" : "Add your photo"}
          </label>
        </div>
        <div className="font-display font-extrabold text-xl text-ink mt-2">{account.salonName || account.name}</div>
        {account.salonName && <div className="text-sm text-muted">{account.name}</div>}
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {account.verified && <span className="text-xs font-bold px-2 py-1 rounded-full bg-ok-bg text-ok-fg border border-ok-line">✓ Verified</span>}
          {stats && stats.founding && <span className="text-xs font-bold px-2 py-1 rounded-full bg-warn-bg text-warn-fg border border-warn-line">⭐ Founding member #{stats.memberNumber}</span>}
          {stats && !stats.founding && stats.memberNumber && <span className="text-xs font-bold px-2 py-1 rounded-full bg-surface-2 text-muted-strong">Member #{stats.memberNumber}</span>}
          {account.role === "APPRENTICE" && <span className="text-xs font-bold px-2 py-1 rounded-full bg-surface-2 text-plum">Apprentice</span>}
        </div>
        {error && <p className="text-sm text-bad-fg mt-2">{error}</p>}
      </div>
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {tile(stats.loves, stats.loves === 1 ? "love" : "loves")}
          {tile(stats.completedJobs, "jobs completed")}
          {tile(stats.customersServed, "customers served")}
          {tile(stats.worksPosted, "work photos posted")}
          {tile(stats.services, "services offered")}
          {tile(stats.followers, "people saved your shop")}
        </div>
      )}
      {stats && stats.joinedAt && <p className="text-xs text-muted text-center">On Sheeba since {new Date(stats.joinedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>}
      <div className="grid sm:grid-cols-3 gap-2">
        {/* A plain link on purpose: shop pages load through the Netlify redirect rule. */}
        <a href={`/shop/${account._id}`} className="text-center px-4 py-3 rounded-full border border-line bg-card font-bold text-plum text-sm">View public page</a>
        <button onClick={() => go("shop")} className="px-4 py-3 rounded-full border border-line bg-card font-bold text-plum text-sm">Edit shop page</button>
        <button onClick={() => go("share")} className="px-4 py-3 rounded-full bg-hibiscus text-white font-bold text-sm">Share my shop</button>
      </div>
    </div>
  );
}
