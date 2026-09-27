"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { formatMoney } from "../lib/money";

const cache = new Map(); // one request per service/style per visit

// "What others nearby charge" for one of a professional's services: other
// shops only (your own is left out), near your pinned location or in your city.
export default function PriceHint({ account, serviceKey, styleKey }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!serviceKey) return;
    const q = new URLSearchParams({ country: account.country || "GH", service: serviceKey, exclude: account._id });
    if (styleKey) q.set("style", styleKey);
    if (account.location && account.location.lat != null) { q.set("lat", account.location.lat); q.set("lng", account.location.lng); }
    else if (account.city) q.set("city", account.city);
    const key = q.toString();
    if (!cache.has(key)) cache.set(key, apiFetch(`/prices?${key}`).catch(() => null));
    let live = true;
    cache.get(key).then((d) => { if (live) setData(d); });
    return () => { live = false; };
  }, [account, serviceKey, styleKey]);

  if (!serviceKey || !data) return null;
  const where = data.scope === "near" ? "near you" : data.scope === "city" ? `in ${account.city}` : "in your country";
  return (
    <div className="text-xs text-muted mt-0.5">
      {data.enough
        ? <>Others {where}: typical <b className="text-muted-strong">{formatMoney(data.median, data.currency)}</b> ({formatMoney(data.low, data.currency)}–{formatMoney(data.high, data.currency)})</>
        : <>Not enough prices {where} yet to compare.</>}
    </div>
  );
}
