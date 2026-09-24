"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import VerificationCard from "../../components/VerificationCard";

export default function Dashboard() {
  const { authToken, myAccount, refreshMyAccount, login, hydrated } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (hydrated) refreshMyAccount(); }, [authToken, hydrated]);

  useEffect(() => {
    if (!myAccount) return;
    apiFetch("/requests").then((all) => {
      setRequests(all.filter((r) => r.stylistId === myAccount._id));
      setLoaded(true);
    });
  }, [myAccount]);

  if (!hydrated) return null;
  if (!authToken) return <LoginInline />;
  if (!myAccount) return <div className="max-w-xl mx-auto px-5 pt-10 text-plum/70">Loading your shop…</div>;

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-line">
        <div className="font-display font-extrabold text-lg text-hibiscus-deep">
          SHEE<span className="text-violet">BA</span> <span className="text-plum text-xs font-body font-semibold">Business</span>
        </div>
        <Link href="/" className="px-4 py-2 rounded-full border border-line text-sm font-bold">← Back to Discover</Link>
      </div>
      <div className="max-w-xl mx-auto px-5 pt-6">
        <div className="bg-emerald-700 text-white rounded-xl px-4 py-3 mb-4 text-sm font-semibold">
          ✅ You're logged in — this is your dashboard for <b>{myAccount.salonName || myAccount.name}</b>.
        </div>
        <div className="bg-white border border-line rounded-2xl p-4">
          <b>{myAccount.salonName || myAccount.name}</b> · {myAccount.category} · {myAccount.area}
        </div>
        <VerificationCard account={myAccount} onUpdated={refreshMyAccount} />
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mt-6 mb-2">Pending Requests</div>
        {!loaded && <div className="text-plum/70">Loading…</div>}
        {loaded && pending.length === 0 && <div className="text-plum/70">No pending requests right now.</div>}
        {pending.map((r) => (
          <div key={r._id} className="bg-white border border-line rounded-xl p-3 mb-2"><b>{r.clientName}</b> — {r.serviceNameSnapshot || "Service"}</div>
        ))}
        <p className="text-sm text-plum/70 mt-6">
          Real, working foundation — full business tools (Customers, Growth, Sharing, Payments) are being ported next, not faked here.
        </p>
      </div>
    </div>
  );
}

function LoginInline() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try { await login(phone, password); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="max-w-md mx-auto px-5 pt-12">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-3">Log In to Your Shop</div>
      <form onSubmit={submit} className="space-y-3">
        <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
        {error && <p className="text-hibiscus-deep text-sm">{error}</p>}
        <button className="w-full py-3 rounded-full bg-hibiscus text-white font-bold" type="submit" disabled={busy}>{busy ? "One sec…" : "Log In"}</button>
      </form>
    </div>
  );
}
