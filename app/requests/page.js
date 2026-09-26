"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import Nav from "../../components/Nav";
import Link from "next/link";
import ChangePasswordForm from "../../components/ChangePasswordForm";
import { EmptyState } from "../../components/States";
import { pendingInvite } from "../../lib/invite";
import { COUNTRIES, countryInfo, detectCountry } from "../../lib/countries";
import AppointmentCard from "../../components/customer/AppointmentCard";
import Toast from "../../components/Toast";

export default function Requests() {
  const { customerToken, customerName, customerLogin, customerRegister, customerLogout, hydrated } = useAuth();
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [me, setMe] = useState(null); // the customer account, to know about temporary passwords
  const [tab, setTab] = useState("upcoming");
  const [toast, setToast] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [invite, setInvite] = useState(() => (typeof window === "undefined" ? "" : pendingInvite()));
  const [country, setCountry] = useState(null); // worked out in the browser
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the device's location settings only exist in the browser
    setCountry(detectCountry());
  }, []);

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
    try {
      if (mode === "login") await customerLogin(phone, password);
      else await customerRegister(phone, password, name, invite, country);
      // Came here from a shop's "Log in to request" button? Go straight back.
      const back = sessionStorage.getItem("sheeba:return");
      if (back && back.startsWith("/shop/")) {
        sessionStorage.removeItem("sheeba:return");
        window.location.href = back;
      }
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
                <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country" className="w-full px-4 py-3 rounded-xl border border-line bg-card">
                  {Object.entries(COUNTRIES).map(([code, c]) => <option key={code} value={code}>{c.flag} {c.name}</option>)}
                </select>
              )}
              <input type="tel" placeholder={country ? `Phone number, e.g. ${countryInfo(country).phoneExample}` : "Phone number"} value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
              {mode === "register" && (
                <input placeholder="Invite code (optional)" value={invite} onChange={(e) => setInvite(e.target.value.toUpperCase())} maxLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-line font-mono tracking-widest" />
              )}
              {error && <p className="text-hibiscus-deep text-sm">{error}</p>}
              <button className="w-full py-3 rounded-full bg-hibiscus text-white font-bold" type="submit">{mode === "login" ? "Log In" : "Create Account"}</button>
            </form>
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
