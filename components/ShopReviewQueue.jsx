"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../lib/api";
import { shopChecks, coverPhoto } from "../lib/shop";
import { formatMoney } from "../lib/money";

// New shops start UNDER_REVIEW and are invisible to customers until an admin
// approves them here. (Separate from ID verification, on purpose: a shop's
// listing and a person's identity are different checks.)
//
// Layout: a grid of cards to scan at a glance. Hovering with a mouse lifts
// the card and dims the rest; clicking (or tapping on a phone, where there
// is no hover) opens the full detail panel to decide from.

export default function ShopReviewQueue({ onDecision }) {
  const [shops, setShops] = useState(null);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    apiFetch("/stylists")
      .then((list) => setShops(
        list.filter((s) => s.status === "UNDER_REVIEW" && (s.accountStatus || "ACTIVE") === "ACTIVE")
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      ))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const approved = () => { setOpen(null); load(); if (onDecision) onDecision(); };

  return (
    <div className="mb-8">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">
        New Shops Awaiting Approval {shops && `(${shops.length})`}
      </div>
      {error && <div className="text-bad-fg">{error}</div>}
      {!shops && !error && <div className="text-muted">Loading…</div>}
      {shops && shops.length === 0 && <div className="text-muted">No new shops waiting. Every shop is live.</div>}

      {shops && shops.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" onMouseLeave={() => setHovered(null)}>
          {shops.map((s) => (
            <ShopCard key={s._id} shop={s}
              dimmed={hovered !== null && hovered !== s._id}
              onHover={() => setHovered(s._id)}
              onOpen={() => setOpen(s)} />
          ))}
        </div>
      )}

      {open && <ShopDetail shop={open} onClose={() => setOpen(null)} onApproved={approved} />}
    </div>
  );
}

function ShopCard({ shop, dimmed, onHover, onOpen }) {
  const checks = shopChecks(shop);
  const done = checks.filter(([, ok]) => ok).length;
  const cover = coverPhoto(shop);
  const name = shop.salonName || shop.name;
  return (
    <button type="button" onClick={onOpen} onMouseEnter={onHover} onFocus={onHover}
      className={
        "relative text-left bg-card border border-line rounded-2xl overflow-hidden transition duration-200 " +
        "hover:-translate-y-1 hover:scale-[1.04] hover:ring-2 hover:ring-hibiscus hover:shadow-2xl hover:z-10 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hibiscus " +
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 " +
        (dimmed ? "opacity-50" : "opacity-100")
      }>
      <div className="aspect-[4/3] bg-surface relative">
        {cover
          ? <img src={cover} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center font-display text-3xl text-faint">{name.slice(0, 2).toUpperCase()}</div>}
        <span className="absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full bg-black/60 text-white">{done}/{checks.length}</span>
        {shop.verified && <span className="absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full bg-emerald-700 text-white">✓ ID</span>}
      </div>
      <div className="p-3">
        <div className="font-bold text-ink truncate">{name}</div>
        <div className="text-xs text-muted truncate">{shop.category || "No category"} · {shop.area || "No area"}</div>
        <div className="h-1.5 bg-surface rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((done / checks.length) * 100)}%` }} />
        </div>
      </div>
    </button>
  );
}

function ShopDetail({ shop, onClose, onApproved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const closeRef = useRef(null);
  const services = shop.styles || [];
  const workPhotos = services.filter((s) => s.photo).slice(0, 8);
  const checks = shopChecks(shop);
  const done = checks.filter(([, ok]) => ok).length;

  // Escape closes the panel; focus starts on the close button for keyboard users.
  useEffect(() => {
    if (closeRef.current) closeRef.current.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const approve = async () => {
    if (!window.confirm(`Approve ${shop.salonName || shop.name}? Their shop becomes visible to all customers.`)) return;
    setBusy(true); setError(null);
    try { await apiFetch(`/stylists/${shop._id}/approve-review`, { method: "POST" }); onApproved(); }
    catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`Review ${shop.salonName || shop.name}`}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-line w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5">
        <div className="flex gap-3 items-start">
          {shop.profilePhoto
            ? <img src={shop.profilePhoto} alt="" className="w-16 h-16 rounded-full object-cover border border-line" />
            : <div className="w-16 h-16 rounded-full bg-surface border border-line flex items-center justify-center text-muted text-xs">No photo</div>}
          <div className="flex-1 min-w-0">
            <div className="text-xl font-bold text-ink">{shop.salonName || shop.name}</div>
            <div className="text-sm text-muted">
              {shop.name} · {shop.category || "No category"} · {shop.area || "No area"}{shop.phone ? ` · ${shop.phone}` : ""}
            </div>
            {shop.createdAt && <div className="text-xs text-muted">Joined {new Date(shop.createdAt).toLocaleDateString()}</div>}
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close" className="px-3 py-1 rounded-full border border-line text-ink">✕</button>
        </div>

        {shop.bio ? <p className="text-sm mt-4 text-ink">{shop.bio}</p> : <p className="text-sm mt-4 text-muted">No description yet.</p>}

        <div className="grid grid-cols-2 gap-1 mt-4 text-sm">
          {checks.map(([label, ok]) => (
            <div key={label} className={ok ? "text-ok-fg" : "text-muted"}>{ok ? "✓" : "○"} {label}</div>
          ))}
        </div>
        <div className="text-xs text-muted mt-1">{done} of {checks.length} complete · {services.length} service{services.length === 1 ? "" : "s"}</div>

        {services.length > 0 && (
          <div className="mt-4 space-y-1">
            {services.slice(0, 6).map((s) => (
              <div key={s.id} className="text-sm flex justify-between border-b border-line py-1">
                <span className="text-ink">{s.name}{s.active === false ? " (switched off)" : ""}</span>
                <span className="text-muted">{s.price != null ? formatMoney(s.price, shop.currency) : ""}{s.duration ? ` · ${s.duration}` : ""}</span>
              </div>
            ))}
          </div>
        )}

        {workPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {workPhotos.map((s) => <img key={s.id} src={s.photo} alt={s.name} className="w-full aspect-square object-cover rounded-lg border border-line" />)}
          </div>
        )}

        {error && <div className="text-bad-fg mt-3">{error}</div>}
        <div className="flex gap-2 mt-5 flex-wrap">
          <button onClick={approve} disabled={busy} className="px-5 py-2 rounded-full bg-emerald-600 text-white font-bold disabled:opacity-40">
            {busy ? "Approving…" : "Approve shop"}
          </button>
          <a href={`/shop/${shop._id}`} target="_blank" rel="noopener noreferrer" className="px-5 py-2 rounded-full border border-line font-bold text-ink">
            Preview as customers see it
          </a>
        </div>
        <div className="text-xs text-muted mt-2">Not ready yet? Close this. The professional can keep improving their shop, and it stays hidden until you approve.</div>
      </div>
    </div>
  );
}
