"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import VerificationQueue from "../../components/VerificationQueue";
import ShopReviewQueue from "../../components/ShopReviewQueue";

export default function Admin() {
  const { authToken, myAccount, isAdmin, refreshMyAccount, hydrated } = useAuth();
  const [audit, setAudit] = useState([]);

  useEffect(() => { if (hydrated) refreshMyAccount(); }, [authToken, hydrated]);

  const loadAudit = useCallback(() => apiFetch("/admin/audit").then(setAudit).catch(() => {}), []);
  useEffect(() => {
    if (isAdmin) loadAudit();
  }, [isAdmin, loadAudit]);

  if (!hydrated) return null;

  if (!authToken || !myAccount) {
    return (
      <div className="max-w-md mx-auto px-5 pt-10">
        <div className="text-plum/70 mb-3">Log in from your shop dashboard first — this area is admin-only.</div>
        <Link href="/dashboard" className="inline-block px-5 py-3 rounded-full bg-hibiscus text-white font-bold">Go to Dashboard</Link>
      </div>
    );
  }
  if (!isAdmin) {
    return <div className="max-w-md mx-auto px-5 pt-10 text-plum/70">This account isn't an admin.</div>;
  }

  return (
    <div className="min-h-screen bg-[#1a1015] text-[#f0dad0]">
      <div className="flex items-center justify-between px-5 py-4 bg-[#241318] border-b border-[#3a2028]">
        <span className="font-display font-extrabold text-[#f0dad0]">SHEEBA <span className="text-marigold">ADMIN</span></span>
        <Link href="/" className="px-3 py-2 rounded-full border border-[#3a2028] text-sm">← Exit Admin</Link>
      </div>
      <div className="max-w-4xl mx-auto px-5 pt-6">
        <ShopReviewQueue onDecision={loadAudit} />
        <VerificationQueue onDecision={loadAudit} />
        <div className="text-xs font-extrabold tracking-wide text-marigold uppercase mb-2">Recent Admin Actions</div>
        {audit.length === 0 && <div className="text-[#a88b95]">No admin actions recorded yet.</div>}
        {audit.map((a) => (
          <div key={a._id} className="bg-[#241318] border border-[#3a2028] rounded-xl p-3 mb-2"><b>{a.action}</b> on {a.targetType} {a.targetId.slice(-6)}{a.reason ? ` — ${a.reason}` : ""}</div>
        ))}
        <p className="text-sm text-[#a88b95] mt-6">
          Real, live audit data. Full shop review, reports, and account restriction tools are being ported next.
        </p>
      </div>
    </div>
  );
}
