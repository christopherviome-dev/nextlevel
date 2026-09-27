"use client";
import Sheet from "./Sheet";
import { photosFor } from "../../lib/catalog";
import { summarise } from "../../lib/prices";
import { formatMoney } from "../../lib/money";
import { formatDistance } from "../../lib/geo";

// The inspiration detail: more photos, other names, the typical price nearby,
// and the professionals who actually do this style.
export default function InspirationSheet({ styleKey, style, shops, currency, where, onClose, onShowInFeed }) {
  const photos = photosFor(styleKey);
  const doers = shops
    .map((s) => ({ shop: s, prices: s.work.filter((w) => w.styleKey === styleKey && typeof w.price === "number").map((w) => w.price) }))
    .filter((x) => x.prices.length)
    .map((x) => ({ ...x, from: Math.min(...x.prices) }))
    .sort((a, b) => (a.shop._distanceKm ?? Infinity) - (b.shop._distanceKm ?? Infinity) || a.from - b.from);
  const typical = summarise(shops, { style: styleKey });
  return (
    <Sheet title={style.name} onClose={onClose}>
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4">
        {photos.map((p) => (
          <figure key={p.id} className="shrink-0 w-[85%] snap-center">
            <img src={p.src} alt={style.name} className="w-full aspect-[4/5] object-cover rounded-2xl" />
            <figcaption className="text-[11px] text-muted mt-1">
              <a href={p.page} target="_blank" rel="noopener noreferrer" className="underline">Photo: {p.photographer} on {p.site}</a> · Inspiration, not a Sheeba professional's work
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-4">
        <div className="font-display font-extrabold text-xl text-ink">{style.name}</div>
        {style.aliases && style.aliases.length > 0 && <div className="text-sm text-muted">Also called {style.aliases.join(", ")}</div>}
        <div className="text-sm text-muted-strong mt-2">
          {typical.enough
            ? <>Typical {where}: <b>{formatMoney(typical.low, currency)}–{formatMoney(typical.high, currency)}</b></>
            : <>Not enough prices {where} yet to show a typical price.</>}
        </div>
      </div>
      <div className="mt-5">
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Who does this {where}</div>
        {doers.length === 0 && <p className="text-sm text-muted">No professionals have listed this exact style yet. Try the feed for similar work.</p>}
        {doers.slice(0, 10).map(({ shop, from }) => (
          <a key={shop._id} href={`/shop/${shop._id}`} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
            {shop.profilePhoto
              ? <img src={shop.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover border border-line" />
              : <span className="w-10 h-10 rounded-full bg-violet text-white font-bold flex items-center justify-center">{(shop.salonName || shop.name).slice(0, 1).toUpperCase()}</span>}
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-ink truncate">{shop.salonName || shop.name} {shop.verified && <span className="text-hibiscus-deep text-xs">✓</span>}</span>
              <span className="block text-xs text-muted truncate">{[shop.area, formatDistance(shop._distanceKm, shop.country)].filter(Boolean).join(" · ")}</span>
            </span>
            <span className="text-sm font-bold text-ink whitespace-nowrap">from {formatMoney(from, shop.currency)}</span>
          </a>
        ))}
      </div>
      {doers.length > 0 && (
        <button onClick={onShowInFeed} className="w-full mt-4 py-3 rounded-full bg-hibiscus text-white font-bold">Show their work in my feed</button>
      )}
    </Sheet>
  );
}
