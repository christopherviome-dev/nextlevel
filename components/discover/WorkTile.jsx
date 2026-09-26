"use client";
import { formatMoney } from "../../lib/money";

// One piece of real work: photo, service, price, professional, and a heart.
// `fixed` = uniform size for carousels; otherwise natural height (masonry feed).
export default function WorkTile({ item, onOpen, liked, onLike, fixed = false, hidden = false }) {
  const shopName = item.shop.salonName || item.shop.name;
  const tab = hidden ? -1 : 0;
  return (
    <div className={"relative rounded-2xl overflow-hidden bg-surface-2 border border-line " + (fixed ? "w-40 sm:w-48 shrink-0 snap-start" : "mb-3 break-inside-avoid")}
      aria-hidden={hidden || undefined}>
      <button type="button" tabIndex={tab} onClick={() => onOpen({ type: "work", item })} className="block w-full text-left"
        aria-label={`${item.name}, ${formatMoney(item.price, item.shop.currency)}, by ${shopName}`}>
        <img src={item.thumb} alt="" loading="lazy" className={fixed ? "w-full aspect-[4/5] object-cover block" : "w-full h-auto block"} />
        <div className="absolute inset-x-0 bottom-0 p-2 pt-10 text-white" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))" }}>
          <div className="text-sm font-bold truncate">{item.name}</div>
          <div className="text-xs opacity-90 truncate">{formatMoney(item.price, item.shop.currency)} · {shopName}</div>
        </div>
      </button>
      <HeartButton liked={liked} count={item.likeCount} onClick={() => onLike(item)} tabIndex={tab} />
    </div>
  );
}

export function HeartButton({ liked, count, onClick, tabIndex = 0, large = false }) {
  return (
    <button type="button" tabIndex={tabIndex} onClick={onClick} aria-pressed={liked}
      aria-label={liked ? "Remove from loved" : "Love this"}
      className={"absolute top-2 right-2 flex items-center gap-1 rounded-full font-bold bg-black/55 text-white " + (large ? "px-3 py-2 text-sm" : "px-2 py-1 text-xs")}>
      <span aria-hidden className={liked ? "text-hibiscus" : ""}>{liked ? "♥" : "♡"}</span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
