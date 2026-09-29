"use client";
import { useState } from "react";
import IdCheckedBadge from "../IdCheckedBadge";
import { titleOf } from "../../lib/titles";
import { ringStyle } from "../../lib/founding";
import { formatMoney } from "../../lib/money";

// The assistant's answer: one plain sentence, then the real professionals it found.
export default function AssistAnswer({ ask, onClose }) {
  const [all, setAll] = useState(false);
  if (!ask) return null;
  const list = ask.results || [];
  const shown = all ? list : list.slice(0, 5);
  return (
    <div className="bg-card border border-violet/40 rounded-2xl p-4 shadow-sm" role="status" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span aria-hidden className="text-lg">✨</span>
          <p className="text-ink font-bold">{ask.loading ? "Looking…" : ask.error || ask.answer}</p>
        </div>
        <button onClick={onClose} aria-label="Close answer" className="shrink-0 w-7 h-7 rounded-full bg-surface-2 text-muted font-bold">×</button>
      </div>
      {shown.length > 0 && (
        <div className="mt-3 divide-y divide-line">
          {shown.map((r) => (
            <a key={r.id} href={`/shop/${r.id}`} className="flex items-center gap-3 py-2.5">
              {r.thumb
                ? <img src={r.thumb} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                : <span style={ringStyle(r)} className="w-12 h-12 rounded-xl bg-violet text-white font-bold flex items-center justify-center shrink-0">{r.name.slice(0, 1)}</span>}
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-ink truncate">{r.name} {r.idChecked && <IdCheckedBadge />}</span>
                <span className="block text-xs text-muted truncate">{[titleOf(r.services), r.place, r.km !== null ? `${r.km} km` : null].filter(Boolean).join(" · ")}</span>
              </span>
              {r.offer && (
                <span className="text-right shrink-0">
                  {r.offer.price !== null && <span className="block text-sm font-bold text-ink">{formatMoney(r.offer.price, r.offer.currency)}</span>}
                  <span className="block text-xs text-muted max-w-[8rem] truncate">{r.offer.name}</span>
                </span>
              )}
            </a>
          ))}
        </div>
      )}
      {list.length > 5 && !all && <button onClick={() => setAll(true)} className="mt-2 text-sm font-bold text-hibiscus-deep">Show all {list.length}</button>}
    </div>
  );
}
