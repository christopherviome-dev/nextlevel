"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import VerificationQueue from "../../components/VerificationQueue";
import ShopReviewQueue from "../../components/ShopReviewQueue";
import PasswordResetQueue from "../../components/PasswordResetQueue";
import InviteRewardsQueue from "../../components/InviteRewardsQueue";
import AdminSwitches from "../../components/AdminSwitches";
import ServiceProposalsQueue from "../../components/ServiceProposalsQueue";
import ReportsQueue from "../../components/ReportsQueue";
import Nav from "../../components/Nav";
import ProLoginForm from "../../components/ProLoginForm";
import AdminShell from "../../components/admin/AdminShell";
import AdminMap from "../../components/admin/AdminMap";
import { Overview, Places, Demand } from "../../components/admin/AdminInsights";
import AdminTeam from "../../components/admin/AdminTeam";
import FieldWork from "../../components/admin/FieldWork";
import FieldCoverage from "../../components/admin/FieldCoverage";
import AdminSources from "../../components/admin/AdminSources";
import { roleOf, can } from "../../lib/adminRoles";

const TITLES = {
  overview: "Overview", places: "Places", demand: "Demand", map: "Map", shops: "Shops to approve", ids: "IDs to check", reports: "Reports",
  passwords: "Password help", services: "Proposed services", invites: "Invite rewards", switches: "Switches", audit: "Audit log", team: "Admin team", trips: "Field trips", coverage: "Coverage", sources: "Sources",
};
const RANGES = [[7, "7 days"], [30, "30 days"], [90, "90 days"], [365, "1 year"]];

// Admin: insights to make decisions with, and the queues that need action,
// organised in a menu with badges for anything waiting.
export default function AdminPage() {
  const { authToken, isAdmin, hydrated, myAccount } = useAuth();
  const role = roleOf(myAccount);
  const [picked, setSection] = useState(null);
  const [days, setDays] = useState(30);
  const [o, setO] = useState(null);
  const [error, setError] = useState(null);
  const [audit, setAudit] = useState([]);
  const loadOverview = useCallback(() => { if (!can(role, "analytics")) return; apiFetch(`/analytics/overview?days=${days}`).then((x) => { setO(x); setError(null); }).catch((e) => setError(e.message)); }, [days, role]);
  const loadAudit = useCallback(() => (can(role, "audit") ? apiFetch("/admin/audit").then(setAudit).catch(() => {}) : null), [role]);
  const afterDecision = useCallback(() => { loadAudit(); loadOverview(); }, [loadAudit, loadOverview]);
  useEffect(() => { if (isAdmin) { loadOverview(); loadAudit(); } }, [isAdmin, loadOverview, loadAudit]);

  if (!hydrated) return null;
  if (!authToken) {
    return (
      <div>
        <Nav />
        <ProLoginForm title="Sheeba Admin" note="Log in with your Sheeba account. Only accounts with admin permission can open this area." />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div>
        <Nav />
        <div className="max-w-md mx-auto px-5 pt-10 text-muted-strong">This account doesn't have admin permission.</div>
      </div>
    );
  }

  const t = o ? o.trust : {}, m = o ? o.members : {};
  // Each admin sees only the areas their role allows (the server checks every action too).
  const all = [
    { title: "Insights", items: [["overview", "Overview", "analytics"], ["places", "Places", "analytics"], ["demand", "Demand", "analytics"], ["sources", "Sources", "analytics"], ["map", "Map", "analytics"]] },
    { title: "Field work", items: [["trips", "Trips", "field"], ["coverage", "Coverage", "field"]] },
    { title: "To do", items: [
      ["shops", "Shops to approve", "shops", m.awaitingApproval], ["ids", "IDs to check", "ids", t.pendingVerifications],
      ["reports", "Reports", "reports", t.openReports, t.urgentOpen > 0], ["passwords", "Password help", "passwords", t.passwordHelp],
      ["services", "Proposed services", "services", t.serviceProposals], ["invites", "Invite rewards", "invites", o ? o.invites.UNDER_REVIEW || 0 : 0],
    ] },
    { title: "Settings", items: [["team", "Admin team", "team"], ["switches", "Switches", "switches"], ["audit", "Audit log", "audit"]] },
  ];
  const groups = all.map((g) => ({ title: g.title, items: g.items.filter((i) => can(role, i[2])).map(([key, label, , badge, urgent]) => ({ key, label, badge, urgent })) })).filter((g) => g.items.length);
  const allowed = groups.flatMap((g) => g.items.map((i) => i.key));
  const section = picked && allowed.includes(picked) ? picked : allowed[0];
  const insight = ["overview", "places", "demand", "sources"].includes(section);

  return (
    <div>
      <Nav />
      <AdminShell groups={groups} section={section} setSection={setSection} title={TITLES[section]}>
        {insight && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
            {RANGES.map(([d, l]) => (
              <button key={d} onClick={() => { setO(null); setDays(d); }} aria-pressed={days === d}
                className={"px-3 py-1.5 rounded-full text-sm font-bold border whitespace-nowrap " + (days === d ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>{l}</button>
            ))}
          </div>
        )}
        {insight && error && <p className="text-bad-fg">{error}</p>}
        {insight && !o && !error && <p className="text-muted">Adding it all up…</p>}
        {section === "overview" && o && <Overview o={o} go={setSection} />}
        {section === "places" && o && <Places o={o} go={setSection} />}
        {section === "demand" && o && <Demand o={o} />}
        {section === "sources" && <AdminSources days={days} />}
        {section === "map" && <AdminMap />}
        {section === "shops" && <ShopReviewQueue onDecision={afterDecision} />}
        {section === "ids" && <VerificationQueue onDecision={afterDecision} />}
        {section === "reports" && <ReportsQueue onDecision={afterDecision} />}
        {section === "passwords" && <PasswordResetQueue onDecision={afterDecision} />}
        {section === "services" && <ServiceProposalsQueue onDecision={afterDecision} />}
        {section === "invites" && <InviteRewardsQueue onDecision={afterDecision} />}
        {section === "switches" && <AdminSwitches />}
        {section === "team" && <AdminTeam country={myAccount && myAccount.country} />}
        {section === "trips" && <FieldWork />}
        {section === "coverage" && <FieldCoverage canSeeShops={can(role, "analytics")} />}
        {section === "audit" && (
          <div>
            {audit.length === 0 && <div className="text-muted">No admin actions recorded yet.</div>}
            {audit.map((a) => (
              <div key={a._id} className="bg-card border border-line rounded-xl p-3 mb-2 text-sm">
                {a.adminName && <b className="text-plum">{a.adminName}: </b>}<b>{a.action}</b> on {a.targetType} {String(a.targetId || "").slice(-6)}{a.reason ? ` — ${a.reason}` : ""}
                {a.createdAt && <span className="text-xs text-muted"> · {new Date(a.createdAt).toLocaleString()}</span>}
              </div>
            ))}
          </div>
        )}
      </AdminShell>
    </div>
  );
}
