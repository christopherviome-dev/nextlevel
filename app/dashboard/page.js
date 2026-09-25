"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import VerificationCard from "../../components/VerificationCard";
import Toast from "../../components/Toast";
import Nav from "../../components/Nav";
import ProLoginForm from "../../components/ProLoginForm";
import RequestsPanel from "../../components/RequestsPanel";
import ChangePasswordForm from "../../components/ChangePasswordForm";

export default function Dashboard() {
  const { authToken, myAccount, refreshMyAccount, hydrated } = useAuth();
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
  if (!myAccount) return <div className="max-w-xl mx-auto px-5 pt-10 text-muted">Loading your shop…</div>;

  return (
    <div>
      {welcome && (
        <Toast message={`✅ You're logged in. Welcome, ${myAccount.salonName || myAccount.name}!`} onDone={() => setWelcome(false)} />
      )}
      <Nav />
      <div className="max-w-xl mx-auto px-5 pt-6 pb-16">
        <div className="mb-4">
          <h1 className="font-display font-extrabold text-xl text-ink">My Shop</h1>
          <div className="text-sm text-muted">Signed in as <b className="text-plum">{myAccount.name}</b></div>
        </div>
        {myAccount.mustChangePassword && (
          <div className="bg-warn-bg border border-warn-line rounded-2xl p-4 mb-4">
            <div className="font-bold mb-1">You're using a temporary password</div>
            <p className="text-sm text-muted-strong mb-3">Choose your own password now, so only you know it.</p>
            <ChangePasswordForm endpoint="/auth/change-password" forced onDone={refreshMyAccount} />
          </div>
        )}
        <div className="bg-card border border-line rounded-2xl p-4">
          <b>{myAccount.salonName || myAccount.name}</b> · {myAccount.category} · {myAccount.area}
        </div>
        <VerificationCard account={myAccount} onUpdated={refreshMyAccount} />
        <RequestsPanel account={myAccount} />
        <details className="mt-8 bg-card border border-line rounded-2xl p-4">
          <summary className="font-bold cursor-pointer">Account security</summary>
          <div className="mt-3"><ChangePasswordForm endpoint="/auth/change-password" onDone={refreshMyAccount} /></div>
        </details>
      </div>
    </div>
  );
}
