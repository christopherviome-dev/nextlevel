"use client";
import Sheet from "./Sheet";
import ComparePanel from "./ComparePanel";
import { formatMoney } from "../../lib/money";

// Budgets and price comparison, kept off the main screen until wanted.
export default function FiltersSheet({ local, budgets, budget, setBudget, currency, where, service, style, label, onClose, onClear }) {
  return (
    <Sheet title="Filters" onClose={onClose}>
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Budget</div>
      <div className="flex flex-wrap gap-2">
        {budgets.map(([k, l]) => (
          <button key={k} onClick={() => setBudget(k)} aria-pressed={budget === k}
            className={"px-4 py-2 rounded-full text-sm font-bold border " + (budget === k ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>{l}</button>
        ))}
      </div>
      <p className="text-xs text-muted mt-2">
        {local.enough ? `Typical ${where}: ${formatMoney(local.low, currency)}–${formatMoney(local.high, currency)} (from ${local.shops} professionals)` : `Not enough prices ${where} yet to suggest a budget.`}
      </p>
      <div className="mt-6"><ComparePanel service={service} style={style} label={label} currency={currency} /></div>
      <button onClick={onClear} className="w-full mt-6 py-3 rounded-full border border-line font-bold text-plum">Clear all filters</button>
    </Sheet>
  );
}
