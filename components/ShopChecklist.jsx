"use client";
import { shopChecks } from "../lib/shop";

// Which My Shop tab fixes each item.
const FIX_IN = {
  "Profile photo": "shop", "Description": "shop", "Area / location": "shop",
  "At least one service": "services", "Photos of their work": "services", "Identity verified": "shop",
};

// The same six checks the admin sees, shown to the professional with a
// direct way to fix each missing one.
export default function ShopChecklist({ account, goTo }) {
  const checks = shopChecks(account);
  const done = checks.filter(([, ok]) => ok).length;
  const live = account.status === "APPROVED";
  if (live && done === checks.length) return null; // nothing to nag about

  return (
    <div className={"border rounded-2xl p-4 mb-4 " + (live ? "bg-card border-line" : "bg-warn-bg border-warn-line")}>
      <div className="flex items-center justify-between gap-2">
        <b className={live ? "text-ink" : "text-warn-fg"}>{live ? "Your shop is live" : "Your shop is waiting for approval"}</b>
        <span className="text-sm font-bold text-muted-strong">{done}/{checks.length}</span>
      </div>
      <p className="text-sm text-muted-strong mt-1">
        {live
          ? "Customers can find and book you. A complete shop gets more bookings."
          : "Sheeba reviews every new shop before customers can see it. Completing these helps it get approved faster."}
      </p>
      <div className="h-2 bg-surface-2 rounded-full mt-3 overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((done / checks.length) * 100)}%` }} />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {checks.map(([label, ok]) => {
          const text = label.replace("their", "your");
          return ok
            ? <span key={label} className="text-xs px-3 py-1.5 rounded-full bg-ok-bg text-ok-fg border border-ok-line">✓ {text}</span>
            : <button key={label} onClick={() => goTo(FIX_IN[label])} className="text-xs px-3 py-1.5 rounded-full bg-card border border-line text-plum font-semibold hover:border-hibiscus">+ {text}</button>;
        })}
      </div>
    </div>
  );
}
