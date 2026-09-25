"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import VerificationQueue from "../../components/VerificationQueue";
import ShopReviewQueue from "../../components/ShopReviewQueue";
import PasswordResetQueue from "../../components/PasswordResetQueue";
import Nav from "../../components/Nav";
import ProLoginForm from "../../components/ProLoginForm";

export default function Admin() {
  // The account itself is loaded automatically on every page (AuthContext).
  const { authToken, myAccount, isAdmin, hydrated } = useAuth();
  const [audit, setAudit] = useState([]);

  const loadAudit = useCallback(() => apiFetch("/admin/audit").then(setAudit).catch(() => {}), []);
  useEffect(() => {
    if (isAdmin) loadAudit();
  }, [isAdmin, loadAudit]);

  if (!hydrated) return null;

  if (!authToken) {
    return (
      <div>
        <Nav />
        <ProLoginForm title="Sheeba Admin" note="Log in with your Sheeba account. Only accounts with admin permission can open this area." />
      </div>
    );
  }
  if (!myAccount) return <div><Nav /><div className="max-w-md mx-auto px-5 pt-10 text-muted">Checking your account…</div></div>;
  if (!isAdmin) {
    return (
      <div>
        <Nav />
        <div className="max-w-md mx-auto px-5 pt-10 text-muted-strong">This account doesn't have admin permission.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <Nav />
      <div className="max-w-4xl mx-auto px-5 pt-6 pb-16">
        <div className="mb-5">
          <h1 className="font-display font-extrabold text-xl text-ink">Admin</h1>
          <div className="text-sm text-muted">Reviews, verification and account help. Every decision here is logged.</div>
        </div>
        <ShopReviewQueue onDecision={loadAudit} />
        <VerificationQueue onDecision={loadAudit} />
        <PasswordResetQueue onDecision={loadAudit} />
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Recent Admin Actions</div>
        {audit.length === 0 && <div className="text-muted">No admin actions recorded yet.</div>}
        {audit.map((a) => (
          <div key={a._id} className="bg-card border border-line rounded-xl p-3 mb-2"><b>{a.action}</b> on {a.targetType} {a.targetId.slice(-6)}{a.reason ? ` — ${a.reason}` : ""}</div>
        ))}
        <p className="text-sm text-muted mt-6">
          Real, live audit data. Reports and account restriction tools are coming next.
        </p>
      </div>
    </div>
  );
}
