"use client";
import { useMemo, useState } from "react";

const LABEL = {
  SHOP_APPROVED: "Approved a shop", VERIFICATION_APPROVED: "Approved an ID check", VERIFICATION_REJECTED: "Rejected an ID check",
  ACCOUNT_RESTRICTED: "Restricted an account", ACCOUNT_RESTORED: "Restored an account",
  REPORT_STATE_CHANGED: "Updated a report", REPORT_RESOLVED: "Resolved a report",
  PASSWORD_RESET_ISSUED: "Gave password help", PASSWORD_RESET_DISMISSED: "Dismissed a password request",
  INVITE_REWARD_VALIDATED: "Confirmed an invite reward", INVITE_REWARD_VOIDED: "Voided an invite reward",
  ADMIN_ROLE_GIVEN: "Gave an admin role", ADMIN_ROLE_REMOVED: "Removed an admin role", SETTING_CHANGED: "Changed a switch",
};
const label = (a) => LABEL[a] || String(a || "").toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const DAY = 86400000;
const weekStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }; // weeks start on Monday
const fmt = (t, o) => new Date(t).toLocaleDateString(undefined, o);

// Every admin action, grouped by week or month, filterable by who and what.
export default function AuditLog({ audit }) {
  const [by, setBy] = useState("week");
  const [who, setWho] = useState("");
  const [what, setWhat] = useState("");
  const admins = useMemo(() => [...new Set(audit.map((a) => a.adminName).filter(Boolean))].sort(), [audit]);
  const actions = useMemo(() => [...new Set(audit.map((a) => a.action))].sort((a, b) => label(a).localeCompare(label(b))), [audit]);
  const groups = useMemo(() => {
    const out = new Map();
    for (const a of audit) {
      if ((who && a.adminName !== who) || (what && a.action !== what) || !a.createdAt) continue;
      const t = new Date(a.createdAt).getTime();
      const key = by === "week" ? weekStart(t) : new Date(new Date(t).getFullYear(), new Date(t).getMonth(), 1).getTime();
      if (!out.has(key)) out.set(key, []);
      out.get(key).push(a);
    }
    return [...out.entries()].sort((x, y) => y[0] - x[0]);
  }, [audit, by, who, what]);
  const title = (k) => by === "week"
    ? `Week of ${fmt(k, { day: "numeric", month: "short" })} – ${fmt(k + 6 * DAY, { day: "numeric", month: "short", year: "numeric" })}`
    : fmt(k, { month: "long", year: "numeric" });
  const select = "px-3 py-2 rounded-xl border border-line bg-surface text-sm";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="inline-flex rounded-full border border-line p-1 bg-card">
          {[["week", "By week"], ["month", "By month"]].map(([k, l]) => (
            <button key={k} onClick={() => setBy(k)} className={"px-4 py-1.5 rounded-full text-sm font-bold " + (by === k ? "bg-violet text-white" : "text-plum")}>{l}</button>
          ))}
        </div>
        <select value={who} onChange={(e) => setWho(e.target.value)} className={select} aria-label="Filter by admin"><option value="">Everyone</option>{admins.map((n) => <option key={n}>{n}</option>)}</select>
        <select value={what} onChange={(e) => setWhat(e.target.value)} className={select} aria-label="Filter by action"><option value="">All actions</option>{actions.map((a) => <option key={a} value={a}>{label(a)}</option>)}</select>
      </div>
      {groups.length === 0 && <p className="text-muted">{audit.length ? "Nothing matches these filters." : "No admin actions recorded yet."}</p>}
      {groups.map(([k, list]) => (
        <section key={k}>
          <div className="flex items-baseline justify-between mb-2"><h3 className="font-extrabold text-ink">{title(k)}</h3><span className="text-sm text-muted">{list.length} action{list.length === 1 ? "" : "s"}</span></div>
          <div className="bg-card border border-line rounded-2xl divide-y divide-line">
            {list.map((a) => (
              <div key={a._id} className="p-3 text-sm">
                <div><b className="text-plum">{a.adminName || "An admin"}</b> · {label(a.action)}{a.reason ? <span className="text-muted-strong">: {a.reason}</span> : ""}</div>
                <div className="text-xs text-muted">{new Date(a.createdAt).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}{a.targetType ? ` · ${a.targetType}` : ""}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
