"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "../../components/Nav";
import SiteFooter from "../../components/SiteFooter";
import ThemeToggle from "../../components/ThemeToggle";
import CountrySelect from "../../components/CountrySelect";
import ChangePasswordForm from "../../components/ChangePasswordForm";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import { setCountryPref, useCountryPref, setUseLocation, useLocationPref, COMMUNITY } from "../../lib/prefs";
import { forgetInterests, hasLearned } from "../../lib/interests";

function Section({ title, children }) {
  return (
    <section className="bg-card border border-line rounded-2xl overflow-hidden">
      <h2 className="text-xs font-extrabold tracking-wide text-plum uppercase px-4 pt-4 pb-2">{title}</h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}
function Row({ label, hint, children }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
function Switch({ on, onChange, label }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={"w-12 h-7 rounded-full relative transition-colors " + (on ? "bg-emerald-600" : "bg-surface-2 border border-line")}>
      <span className={"absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all " + (on ? "left-[1.375rem]" : "left-0.5")} />
    </button>
  );
}

// One tidy place for everything that doesn't need to be on the main screens.
export default function SettingsPage() {
  const { hydrated, activeRole, hasBothRoles, switchRole, myAccount, customerName, logout, customerLogout, refreshMyAccount } = useAuth();
  const country = useCountryPref();
  const useLocation = useLocationPref();
  const [learned, setLearned] = useState(false);
  const [me, setMe] = useState(null);
  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState(null);
  const [pw, setPw] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- learned interests live only on this phone
    setLearned(hasLearned());
  }, []);
  useEffect(() => {
    if (activeRole !== "customer") return;
    apiFetch("/customers/me", {}, "customer").then((c) => { setMe(c); setName(c.name || ""); }).catch(() => {});
  }, [activeRole]);

  const saveName = async () => {
    setNameMsg(null);
    try { const c = await apiFetch("/customers/me", { method: "PUT", body: JSON.stringify({ name }) }, "customer"); setMe(c); setNameMsg("Saved"); }
    catch (e) { setNameMsg(e.message); }
  };
  if (!hydrated) return null;
  const who = activeRole === "pro" ? myAccount && (myAccount.salonName || myAccount.name) : activeRole === "customer" ? customerName : null;

  return (
    <div>
      <Nav />
      <div className="max-w-xl mx-auto px-5 pt-6 pb-4 space-y-4">
        <h1 className="font-display font-extrabold text-2xl text-ink">Settings</h1>

        <Section title="Account">
          {!activeRole && (
            <div className="px-4 py-4 text-sm text-muted-strong">
              You're browsing without an account. <Link href="/requests" className="font-bold text-hibiscus-deep underline">Sign in or create one</Link>, or <Link href="/dashboard" className="font-bold text-hibiscus-deep underline">go to your shop</Link>.
            </div>
          )}
          {activeRole && <Row label="Signed in as" hint={activeRole === "pro" ? "Professional account" : "Customer account"}><span className="text-sm font-bold text-ink">{who}</span></Row>}
          {activeRole === "customer" && me && (
            <div className="px-4 py-3 space-y-2">
              <label className="text-sm font-semibold text-ink block">Your name</label>
              <div className="flex gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-line bg-surface" />
                <button onClick={saveName} className="px-4 rounded-full border border-line text-sm font-bold">Save</button>
              </div>
              {nameMsg && <div className="text-xs text-muted">{nameMsg}</div>}
              <div className="text-xs text-muted">Phone: {me.phone} · to change it, contact Sheeba</div>
            </div>
          )}
          {activeRole === "pro" && myAccount && <Row label="Phone" hint="To change it, contact Sheeba"><span className="text-sm text-muted-strong">{myAccount.phone}</span></Row>}
          {activeRole && <Row label="Your Sheeba code and invites"><Link href={activeRole === "pro" ? "/dashboard" : "/my-sheeba"} className="text-sm font-bold text-hibiscus-deep">Open ›</Link></Row>}
          {activeRole && (
            <div className="px-4 py-3">
              <button onClick={() => setPw(!pw)} className="text-sm font-semibold text-ink">Change password {pw ? "▴" : "▾"}</button>
              {pw && <div className="mt-3"><ChangePasswordForm endpoint={activeRole === "pro" ? "/auth/change-password" : "/customers/me/change-password"} actor={activeRole === "customer" ? "customer" : undefined} onDone={activeRole === "pro" ? refreshMyAccount : undefined} /></div>}
            </div>
          )}
          {hasBothRoles && (
            <Row label={activeRole === "pro" ? "Switch to your customer account" : "Switch to your shop"}>
              <Link href={activeRole === "pro" ? "/my-sheeba" : "/dashboard"} onClick={() => switchRole(activeRole === "pro" ? "customer" : "pro")} className="text-sm font-bold text-hibiscus-deep">Switch ›</Link>
            </Row>
          )}
          {activeRole && <div className="px-4 py-3"><button onClick={activeRole === "pro" ? logout : customerLogout} className="text-sm font-bold text-bad-fg">Log out</button></div>}
        </Section>

        <Section title="Appearance">
          <Row label="Light or dark" hint="Auto follows your phone"><ThemeToggle /></Row>
        </Section>

        <Section title="Location and region">
          <Row label="Country" hint="Sets which shops you see, and the currency">
            <div className="w-44">{country && <CountrySelect value={country} onChange={setCountryPref} />}</div>
          </Row>
          <Row label="Use my location" hint="Shows what's near you first. Also on the pin at the top."><Switch on={useLocation} onChange={setUseLocation} label="Use my location" /></Row>
        </Section>

        <Section title="Your feed">
          {activeRole === "customer" && <Row label="What to show first" hint="Men's or women's styles, and your favourites"><Link href="/welcome" className="text-sm font-bold text-hibiscus-deep">Change ›</Link></Row>}
          <Row label="What Sheeba has learned" hint="From what you look at, like, save and book. Kept only on this phone.">
            {learned ? <button onClick={() => { forgetInterests(); setLearned(false); }} className="text-sm font-bold text-plum underline">Clear</button> : <span className="text-xs text-muted">Nothing yet</span>}
          </Row>
        </Section>

        <Section title="Community and help">
          <Row label="Join the community" hint="Ask questions and meet other members">
            <span className="flex gap-3 text-sm font-bold">
              <a href={COMMUNITY.telegram} target="_blank" rel="noopener noreferrer" className="text-hibiscus-deep">Telegram</a>
              {COMMUNITY.whatsapp && <a href={COMMUNITY.whatsapp} target="_blank" rel="noopener noreferrer" className="text-hibiscus-deep">WhatsApp</a>}
            </span>
          </Row>
          <Row label="Forgot a password?"><Link href="/forgot-password" className="text-sm font-bold text-hibiscus-deep">Get help ›</Link></Row>
        </Section>

        <Section title="Privacy and terms">
          <Row label="Terms of Use"><Link href="/terms" className="text-sm font-bold text-hibiscus-deep">Read ›</Link></Row>
          <Row label="Privacy notice"><Link href="/privacy" className="text-sm font-bold text-hibiscus-deep">Read ›</Link></Row>
          <Row label="Delete my account" hint="Ask the Sheeba team in the community, and we'll remove it"><a href={COMMUNITY.telegram} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-hibiscus-deep">Ask ›</a></Row>
        </Section>
      </div>
      <SiteFooter />
    </div>
  );
}
