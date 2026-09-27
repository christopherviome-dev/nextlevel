"use client";
import { useDraft } from "../../lib/useDraft";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import Nav from "../../components/Nav";
import Link from "next/link";
import ChangePasswordForm from "../../components/ChangePasswordForm";
import { EmptyState } from "../../components/States";
import { pendingInviteInfo } from "../../lib/invite";
import PhoneInput from "../../components/PhoneInput";
import CountrySelect from "../../components/CountrySelect";
import InviteLine from "../../components/InviteLine";
import AgeFields from "../../components/AgeFields";
import { getPublicSettings } from "../../lib/settings";
import { detectCountry, toE164 } from "../../lib/countries";
import AppointmentCard from "../../components/customer/AppointmentCard";
import Toast from "../../components/Toast";

export default function Requests() {
  const { customerToken, customerName, customerLogin, customerRegister, customerLogout, hydrated } = useAuth();
  const router = useRouter();
  // Survive an accidental refresh halfway through (never the password).
  const [mode, setMode, clearMode] = useDraft("customer-auth-mode", "login");
  const [phone, setPhone, clearPhone] = useDraft("customer-auth-phone", "");
  const [password, setPassword] = useState("");
  const [name, setName, clearName] = useDraft("customer-auth-name", "");
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [me, setMe] = useState(null); // the customer account, to know about temporary passwords
  const [tab, setTab] = useState("upcoming");
  const [toast, setToast] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [inviteInfo] = useState(() => (typeof window === "undefined" ? null : pendingInviteInfo()));
  const [invite, setInvite] = useState(() => (inviteInfo && inviteInfo.code) || "");
  const [phoneCountry, setPhoneCountry] = useState(null);
  const [phoneCountryChosen, setPhoneCountryChosen] = useState(false);
  // The age check appears only when the admin has switched it on.
  const [ageCheck, setAgeCheck] = useState(false);
  const [age, setAge] = useState({});
  useEffect(() => { getPublicSettings().then((st) => setAgeCheck(!!st.ageCheck)); }, []);
  const [country, setCountry] = useState(null); // worked out in the browser
  useEffect(() => {
    // Start on the inviter's country when there is one (a UK stylist's link starts on 🇬🇧).
    const start = (inviteInfo && inviteInfo.country) || detectCountry();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the device's location settings only exist in the browser
    setCountry(start); setPhoneCountry(start);
  }, [inviteInfo]);

  useEffect(() => {
    if (customerToken) apiFetch("/customers/me/history", {}, "customer").then(setHistory).catch(() => {});
    if (customerToken) apiFetch("/customers/me", {}, "customer").then(setMe).catch(() => {});
  }, [customerToken, reloadKey]);

  // Upcoming: soonest first. Past: most recent first.
  const upcoming = history.filter((r) => ["pending", "accepted", "open"].includes(r.status))
    .sort((a, b) => (a.preferredAt || Infinity) - (b.preferredAt || Infinity));
  const past = history.filter((r) => ["completed", "declined"].includes(r.status));
  const changed = (msg) => { setToast(msg); setReloadKey((k) => k + 1); };

  const submit = async (e) => {
    e.preventDefault();
    const p = toE164(phone, phoneCountry);
    if (!p.ok) { setError(p.error); return; }
    const e164 = p.value;
    // Age answers (only when the admin has the age check switched on).
    let ageExtra = {};
    if (ageCheck && mode === "register") {
      if (false) {
        ageExtra = { apprenticeAge: age.apprenticeAge, guardianName: age.guardianName, guardianConsent: !!age.guardianConsent };
        if (age.apprenticeAge === "MINOR") {
          const g = toE164(age.guardianPhoneRaw, age.guardianCountry || country);
          if (!g.ok) { setError("Enter your parent or guardian's phone number."); return; }
          ageExtra.guardianPhone = g.value;
        }
      } else ageExtra = { ageConfirmed: !!age.ageConfirmed };
    }
    try {
      if (mode === "login") await customerLogin(e164, password);
      else await customerRegister(e164, password, name, invite, country, ageExtra);
      clearMode(); clearPhone(); clearName(); // signed in: the draft is no longer needed
      // Came here from a shop? Go straight back to it: booking always comes first.
      const back = sessionStorage.getItem("sheeba:return");
      if (back && back.startsWith("/shop/")) {
        sessionStorage.removeItem("sheeba:return");
        window.location.href = back;
        return;
      }
      // New and just browsing: two quick questions to shape their feed.
      if (mode === "register") router.push("/welcome");
    } catch (err) { setError(err.message); }
  };

  if (!hydrated) return null;

  return (
    <div>
      <Nav />
      <div className="max-w-xl mx-auto px-5 pt-6">
        {toast && <Toast message={`✅ ${toast}`} onDone={() => setToast(null)} />}
        {customerToken ? (
          <>
            <div className="flex items-center justify-between bg-surface-2 rounded-xl px-4 py-3 mb-4">
              <span>Logged in as <b>{customerName}</b></span>
              <button className="px-3 py-1.5 rounded-full border border-line text-sm font-bold bg-card" onClick={customerLogout}>Log Out</button>
            </div>
            {me && me.mustChangePassword && (
              <div className="bg-warn-bg border border-warn-line rounded-2xl p-4 mb-4">
                <div className="font-bold mb-1">You're using a temporary password</div>
                <p className="text-sm text-muted-strong mb-3">Choose your own password now, so only you know it.</p>
                <ChangePasswordForm endpoint="/customers/me/change-password" actor="customer" forced
                  onDone={() => apiFetch("/customers/me", {}, "customer").then(setMe)} />
              </div>
            )}
            <h1 className="font-display font-extrabold text-xl text-ink mb-3">Appointments</h1>
            <div role="tablist" className="flex gap-2 mb-4">
              {[["upcoming", `Upcoming (${upcoming.length})`], ["past", `Past (${past.length})`]].map(([k, label]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={"px-4 py-2 rounded-full text-sm font-bold border " + (tab === k ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>{label}</button>
              ))}
            </div>
            {tab === "upcoming" && (upcoming.length
              ? upcoming.map((r) => <AppointmentCard key={r._id} r={r} onChanged={changed} />)
              : <EmptyState title="Nothing coming up" hint="Find a professional you like and send a request." actionLabel="Browse Discover" actionHref="/" />)}
            {tab === "past" && (past.length
              ? past.map((r) => <AppointmentCard key={r._id} r={r} onChanged={changed} />)
              : <EmptyState title="No past appointments yet" hint="Once a service is done, you can book it again, save the style, or set a reminder here." />)}
            <p className="text-sm text-muted mt-6">Your saved styles, reminders and invite code are in <Link href="/my-sheeba" className="text-hibiscus-deep font-bold underline">My Sheeba</Link>.</p>
          </>
        ) : (
          <div className="bg-surface-2 rounded-xl p-4">
            <div className="font-bold mb-3">Log in to see your requests</div>
            <form onSubmit={submit} className="space-y-3">
              {mode === "register" && <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />}
              {mode === "register" && country && (
                <CountrySelect value={country} onChange={(c) => { setCountry(c); if (!phoneCountryChosen) setPhoneCountry(c); }} />
              )}
              {phoneCountry && <PhoneInput country={phoneCountry} onCountryChange={(c) => { setPhoneCountry(c); setPhoneCountryChosen(true); }} value={phone} onChange={setPhone} />}
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
              {mode === "register" && <InviteLine code={invite} name={inviteInfo && inviteInfo.code === invite ? inviteInfo.name : null} onChange={setInvite} />}
              {mode === "register" && ageCheck && <AgeFields apprentice={false} value={age} onChange={setAge} country={country} />}
              {mode === "register" && <p className="text-xs text-muted">By creating an account you agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy notice</Link>.</p>}
              {error && <p className="text-hibiscus-deep text-sm">{error}</p>}
              <button className="w-full py-3 rounded-full bg-hibiscus text-white font-bold" type="submit">{mode === "login" ? "Log In" : "Create Account"}</button>
            </form>
            <div className="mt-6 bg-surface rounded-xl px-4 py-3 text-sm text-muted-strong">Are you a beauty professional? <Link href="/dashboard" className="text-hibiscus-deep font-bold underline">Go to your shop</Link></div>
            {mode === "login" && <Link href="/forgot-password?type=customer" className="block mt-3 text-sm text-hibiscus-deep font-semibold">Forgot password?</Link>}
            <button className="mt-3 px-4 py-2 rounded-full border border-line bg-card text-sm" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
