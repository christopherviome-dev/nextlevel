"use client";
import { workModeLabel } from "../../lib/shop";
import { formatDistance } from "../../lib/geo";
import { formatMoney } from "../../lib/money";

export const AVAILABILITY_LABEL = {
  AVAILABLE: ["Available", "bg-ok-bg text-ok-fg border-ok-line"],
  TAKING_REQUESTS: ["Taking requests", "bg-ok-bg text-ok-fg border-ok-line"],
  UNAVAILABLE: ["Not available", "bg-surface-2 text-muted border-line"],
  AWAY: ["Away", "bg-warn-bg text-warn-fg border-warn-line"],
};

// A professional to discover. `wide` = full width (search results); otherwise a carousel card.
export default function ProCard({ shop, onOpen, wide = false }) {
  const name = shop.salonName || shop.name;
  const banner = (shop.work.find((w) => w.thumb) || {}).thumb || null;
  const [availText, availCls] = AVAILABILITY_LABEL[shop.availability] || AVAILABILITY_LABEL.AVAILABLE;
  const priced = shop.work.filter((w) => typeof w.price === "number");
  const from = priced.length ? Math.min(...priced.map((w) => w.price)) : null;
  return (
    <button type="button" onClick={() => onOpen({ type: "pro", shop })}
      className={"text-left bg-card border border-line rounded-2xl overflow-hidden hover:border-hibiscus transition-colors " + (wide ? "w-full" : "w-64 shrink-0 snap-start")}>
      <div className="h-28 bg-surface-2 relative">
        {banner && <img src={banner} alt="" loading="lazy" className="w-full h-full object-cover" />}
        <div className="absolute -bottom-6 left-3">
          {shop.profilePhoto
            ? <img src={shop.profilePhoto} alt="" loading="lazy" className="w-12 h-12 rounded-full object-cover border-2 border-card" />
            : <div className="w-12 h-12 rounded-full bg-violet text-white font-bold flex items-center justify-center border-2 border-card">{name.slice(0, 1).toUpperCase()}</div>}
        </div>
      </div>
      <div className="p-3 pt-8">
        <div className="font-bold text-ink truncate">{name} {shop.verified && <span className="text-xs text-hibiscus-deep">✓</span>}</div>
        <div className="text-xs text-muted truncate">{[shop.category, shop.area, formatDistance(shop._distanceKm, shop.country)].filter(Boolean).join(" · ")}</div>
        <div className="flex flex-wrap gap-1 mt-2">
          <span className={"text-[11px] px-2 py-0.5 rounded-full border " + availCls}>{availText}</span>
          {from != null && <span className="text-[11px] px-2 py-0.5 rounded-full border border-line text-plum">From {formatMoney(from, shop.currency)}</span>}
          {(shop.workModes || []).slice(0, 1).map((m) => <span key={m} className="text-[11px] px-2 py-0.5 rounded-full border border-line text-plum">{workModeLabel(m)}</span>)}
        </div>
      </div>
    </button>
  );
}
