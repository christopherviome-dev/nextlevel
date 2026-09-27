"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { formatMoney } from "../../lib/money";

// Typical prices for a service or style across cities (exact: same currency)
// and countries (each in its own currency, plus an approximate conversion).
// Places only appear once 3+ professionals there have prices.
export default function ComparePanel({ service, style, label, currency }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const q = new URLSearchParams({ currency });
    if (service) q.set("service", service);
    if (style) q.set("style", style);
    apiFetch(`/prices/compare?${q}`).then(setData).catch((e) => setError(e.message));
  }, [service, style, currency]);

  if (error) return <p className="text-sm text-bad-fg">{error}</p>;
  if (!data) return <p className="text-sm text-muted">Comparing prices…</p>;
  const row = (key, place, d, extra) => (
    <div key={key} className="flex items-center justify-between gap-3 py-2 border-b border-line last:border-0 text-sm">
      <span className="text-ink">{place} <span className="text-muted">· {d.shops} professionals</span></span>
      <span className="text-right whitespace-nowrap">
        <b className="text-ink">{formatMoney(d.median, d.currency)}</b>
        <span className="text-muted"> typical ({formatMoney(d.low, d.currency)}–{formatMoney(d.high, d.currency)})</span>
        {extra}
      </span>
    </div>
  );
  const anyApprox = data.countries.some((c) => c.approx);
  return (
    <div>
      <div className="font-bold text-ink mb-1">Typical prices: {label || "all services"}</div>
      {data.cities.length === 0 && data.countries.length === 0 && (
        <p className="text-sm text-muted">Not enough prices yet to compare. Places appear once at least {data.minShops} professionals there have prices.</p>
      )}
      {data.cities.length > 0 && <div className="text-xs font-bold text-muted uppercase mt-2">By city</div>}
      {data.cities.map((c) => row(c.country + c.city, `${c.city}, ${c.country === "GB" ? "UK" : c.country}`, c))}
      {data.countries.length > 0 && <div className="text-xs font-bold text-muted uppercase mt-3">By country</div>}
      {data.countries.map((c) => row(c.country, c.name, c, c.approx ? <span className="block text-xs text-muted">≈ {formatMoney(Math.round(c.approx.amount), c.approx.currency)} in your money</span> : null))}
      {anyApprox && (
        <p className="text-[11px] text-muted mt-2">{data.approxNote} <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline">Rates By Exchange Rate API</a></p>
      )}
    </div>
  );
}
