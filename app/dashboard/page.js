"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
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
import TeamPanel from "../../components/pro/TeamPanel";
import MessagesPanel from "../../components/MessagesPanel";
import CustomersPanel from "../../components/pro/CustomersPanel";
import EarningsPanel from "../../components/pro/EarningsPanel";
import MyTraining from "../../components/training/MyTraining";
import ProShell from "../../components/pro/ProShell";
import ProHome from "../../components/pro/ProHome";
import ProProfile from "../../components/pro/ProProfile";
import MarketingLinks from "../../components/pro/MarketingLinks";

const TITLES = {
  home: "Home", profile: "Profile", training: "My Training", requests: "Requests", messages: "Messages", customers: "Customers",
  earnings: "Earnings", shop: "Shop page", services: "Services", share: "Share & earn", team: "Team", apprentices: "Team",
};
const NO_COUNTS = { pendingRequests: 0, unreadMessages: 0, workToReview: 0, apprenticeRequests: 0 };

// My Shop: a clean Home with what matters now; everything else in the menu
// behind your profile picture (a sidebar on larger screens).
export default function Dashboard() {
  const { authToken, myAccount, refreshMyAccount, hydrated } = useAuth();
  const [welcome, setWelcome] = useState(false);
  const [section, setSection] = useState(null); // null = not chosen yet: use the sensible default
  const [counts, setCounts] = useState(NO_COUNTS);

  // The one-time "you're logged in" message, right after logging in or registering.
  useEffect(() => {
    if (myAccount && sessionStorage.getItem("sheeba:welcome")) {
      sessionStorage.removeItem("sheeba:welcome");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage only exists in the browser
      setWelcome(true);
    }
  }, [myAccount]);

  // Menu badges: refreshed on each section change and every minute.
  const loadCounts = useCallback(() => { apiFetch("/stylists/me/home-counts").then(setCounts).catch(() => {}); }, []);
  useEffect(() => {
    if (!authToken) return;
    loadCounts();
    const t = setInterval(loadCounts, 60000);
    return () => clearInterval(t);
  }, [authToken, loadCounts, section]);

  if (!hydrated) return null;
  if (!authToken) return (<div><Nav /><ProLoginForm title="Log In to Your Shop" /></div>);
  if (!myAccount) return <div><Nav /><div className="max-w-xl mx-auto px-5 pt-10 text-muted">Loading your shop…</div></div>;

  // Apprentices in training start on their training; everyone else on Home.
  const active = section || (myAccount.supervisorStatus === "APPROVED" ? "training" : "home");
  const title = active === "training" && myAccount.supervisorStatus === "GRADUATED" ? "Training record" : TITLES[active];

  return (
    <div>
      {welcome && <Toast message={`✅ You're logged in. Welcome, ${myAccount.salonName || myAccount.name}!`} onDone={() => setWelcome(false)} />}
      <Nav />
      <ProShell account={myAccount} counts={counts} section={active} setSection={setSection} title={title}>
        {/* Always first, whatever the section: a temporary password must be replaced. */}
        {myAccount.mustChangePassword && (
          <div className="bg-warn-bg border border-warn-line rounded-2xl p-4 mb-4">
            <div className="font-bold mb-1">You're using a temporary password</div>
            <p className="text-sm text-muted-strong mb-3">Choose your own password now, so only you know it.</p>
            <ChangePasswordForm endpoint="/auth/change-password" forced onDone={refreshMyAccount} />
          </div>
        )}

        {active === "home" && (
          <div className="space-y-4">
            {myAccount.role === "APPRENTICE" && (
              <div className={"rounded-2xl p-4 border " + (myAccount.supervisorStatus === "APPROVED" ? "bg-ok-bg border-ok-line text-ok-fg" : myAccount.supervisorStatus === "DECLINED" ? "bg-bad-bg border-bad-line text-bad-fg" : "bg-warn-bg border-warn-line text-warn-fg")}>
                <div className="font-bold">
                  {myAccount.supervisorStatus === "APPROVED" ? "You're a confirmed professional in training" : myAccount.supervisorStatus === "DECLINED" ? "Your supervisor declined your request" : "Waiting for your supervisor to confirm you"}
                </div>
                <p className="text-sm mt-1">
                  {myAccount.supervisorStatus === "APPROVED" ? "You can help with your supervisor's shop requests. Your own shop stays private while you train."
                    : myAccount.supervisorStatus === "DECLINED" ? "Talk to them, or keep building your own shop here as an independent professional."
                    : "They've been told. Once they confirm, you can help with their shop's requests."}
                </p>
              </div>
            )}
            {/* Apprentices in training don't prepare a public shop yet; it appears once they graduate. */}
            {myAccount.role !== "APPRENTICE" && <ShopChecklist account={myAccount} goTo={setSection} />}
            <ProHome account={myAccount} counts={counts} go={setSection} />
          </div>
        )}
        {active === "profile" && <ProProfile account={myAccount} onSaved={refreshMyAccount} go={setSection} />}
        {active === "training" && <MyTraining onGoToShare={() => setSection("share")} />}
        {active === "requests" && <RequestsPanel account={myAccount} />}
        {active === "messages" && <MessagesPanel side="stylist" />}
        {active === "customers" && <CustomersPanel />}
        {active === "earnings" && <EarningsPanel />}
        {active === "shop" && (
          <div className="space-y-4">
            <div className="bg-card border border-line rounded-2xl p-4"><ShopProfileEditor account={myAccount} onSaved={refreshMyAccount} /></div>
            <VerificationCard account={myAccount} onUpdated={refreshMyAccount} />
          </div>
        )}
        {active === "services" && <ServicesEditor account={myAccount} onSaved={refreshMyAccount} />}
        {active === "share" && (
          <div className="space-y-4">
            <MyCodeCard shareName={myAccount.salonName || myAccount.name} />
            {myAccount.status === "APPROVED" && <MarketingLinks account={myAccount} />}
          </div>
        )}
        {(active === "team" || active === "apprentices") && <TeamPanel account={myAccount} />}
      </ProShell>
    </div>
  );
}
