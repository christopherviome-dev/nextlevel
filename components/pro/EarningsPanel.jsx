"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { formatMoney } from "../../lib/money";

const PERIODS = [["today", "Today"], ["week", "7 days"], ["month", "This month"], ["lastMonth", "Last month"], ["year", "This year"], ["all", "All time"]];

// What completed services were worth, from the price recorded at booking.
// Customers pay professionals directly: Sheeba doesn't hold or process money,
// so this is a record, not a bank balance.
export default function EarningsPanel() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let live = true;
    apiFetch(`/stylists/me/service-value?period=${period}`).then((d) => { if (live) setData(d); }).catch((e) => setError(e.message));
    return () => { live = false; };
  }, [period]);
  const totals = data ? Object.entries(data.recordedServiceValueByCurrency || {}) : [];
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {PERIODS.map(([k, l]) => (
          <button key={k} onClick={() => { setData(null); setPeriod(k); }} aria-pressed={period === k}
            className={"px-3 py-1.5 rounded-full text-sm font-bold border whitespace-nowrap " + (period === k ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>{l}</button>
        ))}
      </div>
      {error && <p className="text-sm text-bad-fg">{error}</p>}
      {!data && !error && <p className="text-sm text-muted">Adding it up…</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-card border border-line rounded-2xl p-3 col-span-2">
              <div className="text-xs text-muted">Recorded service value</div>
              {totals.length === 0 ? <div className="text-2xl font-bold text-ink">{formatMoney(0, "GHS")}</div>
                : totals.map(([cur, v]) => <div key={cur} className="text-2xl font-bold text-ink">{formatMoney(v.total, cur)}</div>)}
            </div>
            <div className="bg-card border border-line rounded-2xl p-3"><div className="text-xs text-muted">Services done</div><div className="text-2xl font-bold text-ink">{data.completedCount}</div></div>
            <div className="bg-card border border-line rounded-2xl p-3"><div className="text-xs text-muted">New / repeat</div><div className="text-2xl font-bold text-ink">{data.newCustomers} / {data.repeatCustomers}</div></div>
          </div>
          {data.byService.length > 0 && (
            <div className="bg-card border border-line rounded-2xl p-3">
              <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">By service</div>
              {data.byService.map((s) => (
                <div key={s.name} className="flex justify-between gap-2 text-sm py-1.5 border-b border-line last:border-0">
                  <span className="text-ink">{s.name} <span className="text-muted">× {s.count}</span></span>
                  <span className="text-muted-strong">{formatMoney(s.total, s.currency)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted">Worked out from the price recorded when each booking was made, dated by when the service was completed. Customers pay you directly: Sheeba doesn't hold or process money, so this is a record, not a balance.</p>
        </>
      )}
    </div>
  );
}
