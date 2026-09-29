"use client";
import { ringStyle } from "../../lib/founding";
import IdCheckedBadge from "../IdCheckedBadge";
import { formatMoney } from "../../lib/money";
import { formatDistance } from "../../lib/geo";

const WEEK = 7 * 24 * 3600 * 1000;
const Pin = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden className="inline -mt-0.5 mr-0.5 text-hibiscus-deep">
    <path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
  </svg>
);

// Sheeba's own post: a "look card". You're not scrolling videos, you're
// choosing a look to book, so the card shows what a customer needs: the
// look, its price, where it is, who does it, and "Book this look" (which
// opens the booking form with this exact service already chosen).
export default function FeedPost({ item, liked, onLike, onOpenWork, onOpenPro, following, onFollow, onMessage, onOpenReel, styleName, now }) {
  const shop = item.shop;
  const name = shop.salonName || shop.name;
  const title = styleName || item.name;
  const place = [shop.area || shop.city, formatDistance(shop._distanceKm, shop.country)].filter(Boolean).join(" · ");
  const available = shop.availability !== "UNAVAILABLE" && shop.availability !== "AWAY";
  const badge = shop.popularThisWeek ? "Popular this week" : item.addedAt && now - item.addedAt < WEEK ? "New" : null;
  const share = async () => {
    const url = `${window.location.origin}/shop/${shop._id}`;
    try { if (navigator.share) await navigator.share({ title: `${title} by ${name}`, url }); else await navigator.clipboard.writeText(url); } catch (e) { /* closed */ }
  };
  return (
    <article className="bg-card border border-line rounded-3xl p-3 mb-5 md:mb-0 shadow-sm mx-3 sm:mx-0">
      <div className="relative rounded-2xl overflow-hidden bg-surface-2">
        <button type="button" onClick={() => onOpenWork(item)} className="block w-full" aria-label={`${title} by ${name}: see details`}>
          <img src={item.thumb} alt={title} loading="lazy" className="w-full aspect-[4/5] object-cover" draggable={false} />
        </button>
        {badge && <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-card/90 text-plum">{badge}</span>}
        {item.reelCount >= 3 && onOpenReel && (
          <button type="button" onClick={() => onOpenReel(item)} className="absolute bottom-3 left-3 text-xs font-bold px-3 py-1.5 rounded-full bg-black/60 text-white">▶ {item.reelCount} photos</button>
        )}
        <button type="button" onClick={() => onLike(item)} aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"}
          className="absolute top-3 right-3 min-w-[3rem] h-10 px-3 rounded-full bg-card/90 flex items-center justify-center gap-1 shadow">
          <span className={"text-lg leading-none " + (liked ? "text-hibiscus" : "text-plum")}>{liked ? "♥" : "♡"}</span>
          {item.likeCount > 0 && <span className="text-xs font-bold text-ink">{item.likeCount}</span>}
        </button>
      </div>

      <div className="px-1 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-extrabold text-lg text-ink leading-tight truncate">{title}</h3>
            {place && <div className="text-sm text-muted-strong truncate mt-0.5"><Pin />{place}</div>}
          </div>
          {typeof item.price === "number" && (
            <div className="text-right shrink-0">
              <div className="font-extrabold text-lg text-ink">{formatMoney(item.price, shop.currency)}</div>
              {item.duration && <div className="text-xs text-muted">{item.duration}</div>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button type="button" onClick={() => onOpenPro(shop)} className="flex items-center gap-2 min-w-0" aria-label={`About ${name}`}>
            {shop.profilePhoto
              ? <img src={shop.profilePhoto} alt="" style={ringStyle(shop)} className="w-8 h-8 rounded-full object-cover border border-line" />
              : <span style={ringStyle(shop)} className="w-8 h-8 rounded-full bg-violet text-white text-sm font-bold flex items-center justify-center">{name.slice(0, 1).toUpperCase()}</span>}
            <span className="text-sm font-bold text-ink truncate">{name}</span>
            {shop.verified && <IdCheckedBadge />}
          </button>
          <span className={"flex items-center gap-1 text-xs shrink-0 " + (available ? "text-ok-fg" : "text-muted")}>
            <span className={"w-2 h-2 rounded-full " + (available ? "bg-emerald-500" : "bg-line")} />{available ? "Available" : "Away"}
          </span>
          <button type="button" onClick={() => onFollow(shop)} aria-pressed={following}
            className={"ml-auto shrink-0 px-3 py-1 rounded-full text-xs font-bold border " + (following ? "bg-surface border-line text-muted-strong" : "bg-card border-violet text-violet")}>
            {following ? "Following" : "Follow"}
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          {/* A plain link on purpose: shop pages load through the Netlify redirect rule. */}
          <a href={`/shop/${shop._id}?look=${encodeURIComponent(item.id)}#request`} className="flex-1 text-center py-3 rounded-full bg-hibiscus text-white text-sm font-bold">Book this look</a>
          <button type="button" onClick={() => onMessage(shop)} aria-label={`Message ${name}`} className="w-12 h-12 rounded-full border border-line bg-card text-plum flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><path d="M4 5h16v11H9l-5 4V5Z" /></svg>
          </button>
          <button type="button" onClick={share} aria-label="Share this look" className="w-12 h-12 rounded-full border border-line bg-card text-plum flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14" /></svg>
          </button>
        </div>
      </div>
    </article>
  );
}
