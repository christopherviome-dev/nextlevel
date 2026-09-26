"use client";
import { useEffect, useRef } from "react";
import { HeartButton } from "./WorkTile";
import { AVAILABILITY_LABEL } from "./ProCard";
import { workModeLabel } from "../../lib/shop";
import { formatDistance } from "../../lib/geo";
import { likeKey } from "../../lib/clientId";
import { formatMoney } from "../../lib/money";

// Opens in place instead of navigating away, so browsing context is kept.
// Walks the chain from the interface plan:
//   the work → service and price → professional → availability → action.
// Phones: a sheet from the bottom. Larger screens: a panel on the right.
export default function ContextPanel({ selection, onClose, onSelect, likedIds, onLike }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  const isOpen = !!selection;
  // Runs only when the panel opens or closes, not on every redraw: otherwise
  // tapping the heart (which redraws) would yank focus back to Close.
  useEffect(() => {
    if (!isOpen) return;
    if (closeRef.current) closeRef.current.focus();
    const onKey = (e) => { if (e.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);
  if (!selection) return null;

  const shop = selection.type === "work" ? selection.item.shop : selection.shop;
  const item = selection.type === "work" ? selection.item : null;
  const name = shop.salonName || shop.name;
  const [availText, availCls] = AVAILABILITY_LABEL[shop.availability] || AVAILABILITY_LABEL.AVAILABLE;
  const canBook = shop.availability !== "UNAVAILABLE" && shop.availability !== "AWAY";
  const otherWork = shop.work.filter((w) => w.thumb && (!item || w.id !== item.id));
  const services = shop.work.filter((w) => typeof w.price === "number");

  return (
    <div className="fixed inset-0 z-40" role="presentation">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={item ? `${item.name} by ${name}` : name}
        className="absolute inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[440px] lg:max-h-none lg:rounded-none bg-card border-t lg:border-t-0 lg:border-l border-line overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 bg-card/95 backdrop-blur flex items-center justify-between px-4 py-3 border-b border-line z-10">
          <div className="lg:hidden w-10 h-1.5 rounded-full bg-line absolute left-1/2 -translate-x-1/2 top-1.5" aria-hidden />
          <div className="font-bold text-ink truncate pr-3">{item ? item.name : name}</div>
          <button ref={closeRef} onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full border border-line text-plum shrink-0">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {item && (
            <div>
              <div className="relative rounded-2xl overflow-hidden bg-surface-2">
                <img src={item.thumb} alt={item.name} className="w-full max-h-96 object-cover" />
                <HeartButton large liked={likedIds.has(likeKey(item))} count={item.likeCount} onClick={() => onLike(item)} />
              </div>
              <div className="flex items-baseline justify-between gap-3 mt-3">
                <div className="text-lg font-bold text-ink">{item.name}</div>
                <div className="text-lg font-bold text-hibiscus-deep whitespace-nowrap">{formatMoney(item.price, shop.currency)}</div>
              </div>
              {item.duration && <div className="text-sm text-muted">Takes about {item.duration}</div>}
            </div>
          )}

          <div className="bg-surface border border-line rounded-2xl p-3">
            <div className="flex items-center gap-3">
              {shop.profilePhoto
                ? <img src={shop.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover border border-line" />
                : <div className="w-12 h-12 rounded-full bg-violet text-white font-bold flex items-center justify-center">{name.slice(0, 1).toUpperCase()}</div>}
              <div className="min-w-0">
                <div className="font-bold text-ink truncate">{name} {shop.verified && <span className="text-xs text-hibiscus-deep">✓ Verified</span>}</div>
                <div className="text-sm text-muted truncate">{[shop.category, shop.area, formatDistance(shop._distanceKm, shop.country)].filter(Boolean).join(" · ")}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              <span className={"text-xs px-2 py-1 rounded-full border " + availCls}>{availText}</span>
              {(shop.workModes || []).map((m) => <span key={m} className="text-xs px-2 py-1 rounded-full border border-line text-plum">{workModeLabel(m)}</span>)}
            </div>
            {shop.bio && <p className="text-sm text-muted-strong mt-3 whitespace-pre-line">{shop.bio}{shop.bio.length >= 200 ? "…" : ""}</p>}
          </div>

          {!item && services.length > 0 && (
            <div>
              <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Services</div>
              {services.slice(0, 8).map((w) => (
                <div key={w.id} className="flex justify-between gap-3 text-sm py-1.5 border-b border-line last:border-0">
                  <span className="text-ink truncate">{w.name}</span><span className="text-muted-strong whitespace-nowrap">{formatMoney(w.price, shop.currency)}</span>
                </div>
              ))}
            </div>
          )}

          {otherWork.length > 0 && (
            <div>
              <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">{item ? `More from ${name}` : "Their work"}</div>
              <div className="grid grid-cols-3 gap-2">
                {otherWork.slice(0, 9).map((w) => (
                  <button key={w.id} type="button" onClick={() => onSelect({ type: "work", item: { ...w, shop } })}
                    className="rounded-xl overflow-hidden border border-line" aria-label={`${w.name}, ${formatMoney(w.price, shop.currency)}`}>
                    <img src={w.thumb} alt="" loading="lazy" className="w-full aspect-square object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="sticky bottom-0 bg-card pt-2 pb-2">
            {/* A plain link on purpose: shop pages load through the Netlify redirect rule. */}
            <a href={`/shop/${shop._id}`} className={"block text-center w-full py-3.5 rounded-full font-bold " + (canBook ? "bg-hibiscus text-white" : "bg-surface-2 text-plum border border-line")}>
              {canBook ? (item ? `Book ${item.name} with ${name}` : `View ${name} and book`) : `View ${name}'s shop`}
            </a>
            {!canBook && <p className="text-xs text-muted text-center mt-2">{name} isn't taking bookings right now.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
