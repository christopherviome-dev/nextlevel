"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import VerificationCard from "../../components/VerificationCard";
import Toast from "../../components/Toast";
import Nav from "../../components/Nav";
import ProLoginForm from "../../components/ProLoginForm";
import RequestsPanel from "../../components/RequestsPanel";
import ChangePasswordForm from "../../components/ChangePasswordForm";
import ShopChecklist from "../../components/ShopChecklist";
import ShopProfileEditor from "../../components/ShopProfileEditor";
import ServicesEditor from "../../components/ServicesEditor";
import MyCodeCard from "../../components/MyCodeCard";

const TABS = [
  ["requests", "Requests"],
  ["shop", "Shop page"],
  ["services", "Services"],
  ["share", "Share & earn"],
  ["account", "Account"],
];

export default function Dashboard() {
  const { authToken, myAccount, refreshMyAccount, hydrated } = useAuth();
  const [welcome, setWelcome] = useState(false);
  const [tab, setTab] = useState(null); // null = not chosen yet, use the sensible default

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
  if (!myAccount) return <div><Nav /><div className="max-w-xl mx-auto px-5 pt-10 text-muted">Loading your shop…</div></div>;

  // A shop still waiting for approval most needs its details filled in;
  // a live shop's daily work is its requests.
  const active = tab || (myAccount.status === "APPROVED" ? "requests" : "shop");

  return (
    <div>
      {welcome && (
        <Toast message={`✅ You're logged in. Welcome, ${myAccount.salonName || myAccount.name}!`} onDone={() => setWelcome(false)} />
      )}
      <Nav />
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-16">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display font-extrabold text-xl text-ink">My Shop</h1>
            <div className="text-sm text-muted">Signed in as <b className="text-plum">{myAccount.name}</b></div>
          </div>
          {/* A plain link on purpose: shop pages load through the Netlify redirect rule. */}
          <a href={`/shop/${myAccount._id}`} className="px-4 py-2 rounded-full border border-line bg-card text-sm font-bold text-plum whitespace-nowrap">View my shop page</a>
        </div>

        {myAccount.mustChangePassword && (
          <div className="bg-warn-bg border border-warn-line rounded-2xl p-4 mb-4">
            <div className="font-bold mb-1">You're using a temporary password</div>
            <p className="text-sm text-muted-strong mb-3">Choose your own password now, so only you know it.</p>
            <ChangePasswordForm endpoint="/auth/change-password" forced onDone={refreshMyAccount} />
          </div>
        )}

        <ShopChecklist account={myAccount} goTo={setTab} />

        <div role="tablist" aria-label="My Shop sections" className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {TABS.map(([key, label]) => (
            <button key={key} role="tab" aria-selected={active === key} onClick={() => setTab(key)}
              className={"px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap " +
                (active === key ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>
              {label}
            </button>
          ))}
        </div>

        {active === "requests" && <RequestsPanel account={myAccount} />}
        {active === "shop" && (
          <div className="space-y-4">
            <div className="bg-card border border-line rounded-2xl p-4">
              <ShopProfileEditor account={myAccount} onSaved={refreshMyAccount} />
            </div>
            <VerificationCard account={myAccount} onUpdated={refreshMyAccount} />
          </div>
        )}
        {active === "services" && <ServicesEditor account={myAccount} onSaved={refreshMyAccount} />}
        {active === "share" && <MyCodeCard shareName={myAccount.salonName || myAccount.name} />}
        {active === "account" && (
          <div className="bg-card border border-line rounded-2xl p-4">
            <div className="font-bold mb-3">Change password</div>
            <ChangePasswordForm endpoint="/auth/change-password" onDone={refreshMyAccount} />
          </div>
        )}
      </div>
    </div>
  );
}
