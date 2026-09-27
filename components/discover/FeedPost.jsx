"use client";
import { useRef, useState } from "react";
import { formatMoney } from "../../lib/money";
import { formatDistance } from "../../lib/geo";

const Pin = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden className="inline -mt-0.5 mr-0.5">
    <path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
  </svg>
);
const shadow = { filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" };

// One post, TikTok-style: the work fills the frame, actions run down the
// right (follow, like with its count, message, share), who and where sit at
// the bottom left, and a clear Book button sits underneath.
// Double-tap the photo to like; a single tap opens the details.
export default function FeedPost({ item, liked, onLike, onOpenWork, onOpenPro, following, onFollow, onMessage, styleName }) {
  const shop = item.shop;
  const name = shop.salonName || shop.name;
  const [burst, setBurst] = useState(false);
  const tapTimer = useRef(null);
  const lastTap = useRef(0);
  const onPhotoTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      clearTimeout(tapTimer.current); lastTap.current = 0;
      if (!liked) onLike(item);
      setBurst(true); setTimeout(() => setBurst(false), 700);
      return;
    }
    lastTap.current = now;
    tapTimer.current = setTimeout(() => onOpenWork(item), 300);
  };
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  const share = async () => {
    const url = `${window.location.origin}/shop/${shop._id}`;
    try { if (navigator.share) await navigator.share({ title: `${item.name} by ${name}`, url }); else await navigator.clipboard.writeText(url); } catch (e) { /* closed */ }
  };
  const place = [shop.area || shop.city, formatDistance(shop._distanceKm, shop.country)].filter(Boolean).join(" · ");

  return (
    <article className="bg-card sm:border sm:border-line sm:rounded-2xl overflow-hidden mb-4 sm:shadow-sm">
      <div className="relative bg-surface-2 select-none" onClick={onPhotoTap} role="button" tabIndex={0}
        aria-label={`${item.name} by ${name}. Tap for details, double-tap to like`} onKeyDown={(e) => { if (e.key === "Enter") onOpenWork(item); }}>
        <img src={item.thumb} alt={item.name} loading="lazy" className="w-full aspect-[4/5] object-cover" draggable={false} />
        {burst && <span className="absolute inset-0 flex items-center justify-center text-8xl text-white motion-safe:animate-ping" style={shadow} aria-hidden>♥</span>}

        {/* Who and where, bottom left */}
        <div className="absolute inset-x-0 bottom-0 p-4 pr-20 text-white" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))" }}>
          <button onClick={stop(() => onOpenPro(shop))} className="font-bold text-base text-left" style={shadow}>
            {name} {shop.verified && <span className="text-xs">✓</span>}
          </button>
          {place && <div className="text-sm opacity-95" style={shadow}><Pin />{place}</div>}
          <div className="text-sm mt-1" style={shadow}>{styleName || item.name}{typeof item.price === "number" ? ` · ${formatMoney(item.price, shop.currency)}` : ""}</div>
        </div>

        {/* Actions down the right, like TikTok */}
        <div className="absolute right-3 bottom-4 flex flex-col items-center gap-5 text-white">
          <div className="relative">
            <button onClick={stop(() => onOpenPro(shop))} aria-label={`See ${name}`} className="block">
              {shop.profilePhoto
                ? <img src={shop.profilePhoto} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white" />
                : <span className="w-11 h-11 rounded-full bg-violet font-bold flex items-center justify-center border-2 border-white">{name.slice(0, 1).toUpperCase()}</span>}
            </button>
            <button onClick={stop(() => onFollow(shop))} aria-pressed={following} aria-label={following ? `Unfollow ${name}` : `Follow ${name}`}
              className={"absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center " + (following ? "bg-white text-hibiscus" : "bg-hibiscus text-white")}>
              {following ? "✓" : "+"}
            </button>
          </div>
          <button onClick={stop(() => onLike(item))} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} className="flex flex-col items-center">
            <span className={"text-3xl leading-none " + (liked ? "text-hibiscus" : "text-white")} style={shadow}>♥</span>
            <span className="text-xs font-bold mt-0.5" style={shadow}>{item.likeCount || 0}</span>
          </button>
          <button onClick={stop(() => onMessage(shop))} aria-label={`Message ${name}`} className="flex flex-col items-center" style={shadow}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2Z" /></svg>
          </button>
          <button onClick={stop(share)} aria-label="Share" className="flex flex-col items-center" style={shadow}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden><path d="M14 4v4C7 9 4 14 3 20c2.5-3.5 6-5 11-5v4l7-7.5L14 4Z" /></svg>
          </button>
        </div>
      </div>
      {/* A plain link on purpose: shop pages load through the Netlify redirect rule. */}
      <div className="p-3">
        <a href={`/shop/${shop._id}#request`} className="block text-center w-full py-2.5 rounded-full bg-hibiscus text-white text-sm font-bold">Book with {name}</a>
      </div>
    </article>
  );
}
