"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";

// New shops start UNDER_REVIEW and are invisible to customers until an admin
// approves them here. (Separate from ID verification, on purpose: a shop's
// listing and a person's identity are different checks.)
export default function ShopReviewQueue({ onDecision }) {
  const [shops, setShops] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    apiFetch("/stylists")
      .then((list) => setShops(
        list.filter((s) => s.status === "UNDER_REVIEW" && (s.accountStatus || "ACTIVE") === "ACTIVE")
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      ))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="mb-8">
      <div className="text-xs font-extrabold tracking-wide text-marigold uppercase mb-2">
        New Shops Awaiting Approval {shops && `(${shops.length})`}
      </div>
      {error && <div className="text-red-300">{error}</div>}
      {!shops && !error && <div className="text-[#a88b95]">Loading…</div>}
      {shops && shops.length === 0 && <div className="text-[#a88b95]">No new shops waiting. Every shop is live.</div>}
      {shops && shops.map((s) => <ShopItem key={s._id} shop={s} onDone={() => { load(); if (onDecision) onDecision(); }} />)}
    </div>
  );
}

function ShopItem({ shop, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const services = shop.styles || [];
  const workPhotos = services.filter((s) => s.photo).slice(0, 4);
  const checks = [
    ["Profile photo", !!shop.profilePhoto],
    ["Description", !!(shop.bio && shop.bio.trim())],
    ["Area / location", !!(shop.area && shop.area.trim())],
    ["At least one service", services.length > 0],
    ["Photos of their work", services.some((s) => s.photo)],
    ["Identity verified", !!shop.verified],
  ];
  const done = checks.filter(([, ok]) => ok).length;

  const approve = async () => {
    if (!window.confirm(`Approve ${shop.salonName || shop.name}? Their shop becomes visible to all customers.`)) return;
    setBusy(true); setError(null);
    try { await apiFetch(`/stylists/${shop._id}/approve-review`, { method: "POST" }); onDone(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-[#241318] border border-[#3a2028] rounded-2xl p-4 mb-4">
      <div className="flex gap-3 items-start">
        {shop.profilePhoto
          ? <img src={shop.profilePhoto} alt="" className="w-14 h-14 rounded-full object-cover border border-[#3a2028]" />
          : <div className="w-14 h-14 rounded-full bg-[#1a1015] border border-[#3a2028] flex items-center justify-center text-[#a88b95] text-xs">No photo</div>}
        <div className="flex-1">
          <div className="text-lg font-bold text-white">{shop.salonName || shop.name}</div>
          <div className="text-sm text-[#a88b95]">
            {shop.name} · {shop.category || "No category"} · {shop.area || "No area"}{shop.phone ? ` · ${shop.phone}` : ""}
          </div>
          {shop.createdAt && <div className="text-xs text-[#a88b95]">Joined {new Date(shop.createdAt).toLocaleDateString()}</div>}
        </div>
      </div>

      {shop.bio && <p className="text-sm mt-3">{shop.bio}</p>}

      <div className="grid grid-cols-2 gap-1 mt-3 text-sm">
        {checks.map(([label, ok]) => (
          <div key={label} className={ok ? "text-emerald-300" : "text-[#a88b95]"}>{ok ? "✓" : "○"} {label}</div>
        ))}
      </div>
      <div className="text-xs text-[#a88b95] mt-1">{done} of {checks.length} complete · {services.length} service{services.length === 1 ? "" : "s"}</div>

      {workPhotos.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {workPhotos.map((s) => <img key={s.id} src={s.photo} alt={s.name} className="w-20 h-20 object-cover rounded-lg border border-[#3a2028]" />)}
        </div>
      )}

      {error && <div className="text-red-300 mt-3">{error}</div>}
      <div className="flex gap-2 mt-4 flex-wrap">
        <button onClick={approve} disabled={busy}
          className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold disabled:opacity-40">Approve shop</button>
        <a href={`/shop/${shop._id}`} target="_blank" rel="noopener noreferrer"
          className="px-5 py-2 rounded-full border border-[#3a2028] font-bold">Preview as customers see it</a>
      </div>
      <div className="text-xs text-[#a88b95] mt-2">Not ready yet? Leave it here. The professional can keep improving their shop, and it stays hidden until you approve.</div>
    </div>
  );
}
