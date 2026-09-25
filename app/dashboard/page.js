"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import VerificationCard from "../../components/VerificationCard";
import Toast from "../../components/Toast";
import Nav from "../../components/Nav";
import ProLoginForm from "../../components/ProLoginForm";
import RequestsPanel from "../../components/RequestsPanel";

export default function Dashboard() {
  const { authToken, myAccount, refreshMyAccount, hydrated, isAdmin } = useAuth();
  const [welcome, setWelcome] = useState(false);

  // Show the "you're logged in" pop-up once, right after logging in or
  // registering, instead of a permanent bar on every visit.
  useEffect(() => {
    if (myAccount && sessionStorage.getItem("sheeba:welcome")) {
      sessionStorage.removeItem("sheeba:welcome");
      // Deliberate: sessionStorage only exists in the browser, after the page loads.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWelcome(true);
    }
  }, [myAccount]);


  if (!hydrated) return null;
  if (!authToken) return (<div><Nav /><ProLoginForm title="Log In to Your Shop" /></div>);
  if (!myAccount) return <div className="max-w-xl mx-auto px-5 pt-10 text-plum/70">Loading your shop…</div>;

  return (
    <div>
      {welcome && (
        <Toast message={`✅ You're logged in. Welcome, ${myAccount.salonName || myAccount.name}!`} onDone={() => setWelcome(false)} />
      )}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-line gap-3">
        <div>
          <div className="font-display font-extrabold text-lg text-hibiscus-deep">
            SHEE<span className="text-violet">BA</span> <span className="text-plum text-xs font-body font-semibold">Business</span>
          </div>
          <div className="text-xs text-plum/70">Signed in as <b>{myAccount.name}</b></div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {isAdmin && <Link href="/admin" className="px-4 py-2 rounded-full bg-ink text-white text-sm font-bold">Admin</Link>}
          <Link href="/" className="px-4 py-2 rounded-full border border-line text-sm font-bold">← Discover</Link>
        </div>
      </div>
      <div className="max-w-xl mx-auto px-5 pt-6 pb-16">
        <div className="bg-white border border-line rounded-2xl p-4">
          <b>{myAccount.salonName || myAccount.name}</b> · {myAccount.category} · {myAccount.area}
        </div>
        <VerificationCard account={myAccount} onUpdated={refreshMyAccount} />
        <RequestsPanel account={myAccount} />
      </div>
    </div>
  );
}
