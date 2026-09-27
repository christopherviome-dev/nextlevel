"use client";
import { useRef, useState } from "react";
import { formatMoney } from "../../lib/money";
import { formatDistance } from "../../lib/geo";

// One post in the feed, Instagram-style: who, their work, then actions.
// Double-tap the photo to love it; a single tap opens the details.
export default function FeedPost({ item, liked, onLike, onOpenWork, onOpenPro, styleName }) {
  const shop = item.shop;
  const name = shop.salonName || shop.name;
  const [burst, setBurst] = useState(false);
  const tapTimer = useRef(null);
  const lastTap = useRef(0);
  const onPhotoTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) { // double tap
      clearTimeout(tapTimer.current); lastTap.current = 0;
      if (!liked) onLike(item);
      setBurst(true); setTimeout(() => setBurst(false), 700);
      return;
    }
    lastTap.current = now;
    tapTimer.current = setTimeout(() => onOpenWork(item), 300);
  };
  const share = async () => {
    const url = `${window.location.origin}/shop/${shop._id}`;
    try { if (navigator.share) await navigator.share({ title: `${item.name} by ${name}`, url }); else await navigator.clipboard.writeText(url); } catch (e) { /* closed */ }
  };
  const meta = [styleName, shop.area, formatDistance(shop._distanceKm, shop.country)].filter(Boolean).join(" · ");
  return (
    <article className="bg-card sm:border sm:border-line sm:rounded-2xl overflow-hidden mb-4 sm:shadow-sm">
      <button type="button" onClick={() => onOpenPro(shop)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {shop.profilePhoto
          ? <img src={shop.profilePhoto} alt="" className="w-9 h-9 rounded-full object-cover border border-line" />
          : <span className="w-9 h-9 rounded-full bg-violet text-white font-bold flex items-center justify-center">{name.slice(0, 1).toUpperCase()}</span>}
        <span className="min-w-0">
          <span className="block text-sm font-bold text-ink truncate">{name} {shop.verified && <span className="text-hibiscus-deep text-xs">✓</span>}</span>
          {meta && <span className="block text-xs text-muted truncate">{meta}</span>}
        </span>
      </button>
      <div className="relative bg-surface-2 select-none" onClick={onPhotoTap} role="button" tabIndex={0} aria-label={`${item.name}. Tap for details, double-tap to love`}
        onKeyDown={(e) => { if (e.key === "Enter") onOpenWork(item); }}>
        <img src={item.thumb} alt={item.name} loading="lazy" className="w-full aspect-[4/5] object-cover" draggable={false} />
        {burst && <span className="absolute inset-0 flex items-center justify-center text-7xl text-white drop-shadow-lg motion-safe:animate-ping" aria-hidden>♥</span>}
      </div>
      <div className="px-4 pt-3 flex items-center gap-4">
        <button type="button" onClick={() => onLike(item)} aria-pressed={liked} aria-label={liked ? "Remove from loved" : "Love this"} className="text-2xl leading-none">
          <span className={liked ? "text-hibiscus" : "text-ink"}>{liked ? "♥" : "♡"}</span>
        </button>
        <button type="button" onClick={share} aria-label="Share" className="text-ink">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14" /></svg>
        </button>
        {/* A plain link on purpose: shop pages load through the Netlify redirect rule. */}
        <a href={`/shop/${shop._id}#request`} className="ml-auto px-5 py-2 rounded-full bg-hibiscus text-white text-sm font-bold">Book</a>
      </div>
      <div className="px-4 pt-2 pb-4 text-sm">
        {item.likeCount > 0 && <div className="font-bold text-ink">{item.likeCount} {item.likeCount === 1 ? "love" : "loves"}</div>}
        <div className="text-ink"><b>{item.name}</b>{typeof item.price === "number" ? <span className="text-muted-strong"> · {formatMoney(item.price, shop.currency)}</span> : null}</div>
      </div>
    </article>
  );
}
