"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import Nav from "../../components/Nav";
import Link from "next/link";
import ChangePasswordForm from "../../components/ChangePasswordForm";
import { EmptyState } from "../../components/States";

export default function Requests() {
  const { customerToken, customerName, customerLogin, customerRegister, customerLogout, hydrated } = useAuth();
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [me, setMe] = useState(null); // the customer account, to know about temporary passwords

  useEffect(() => {
    if (customerToken) apiFetch("/customers/me/history", {}, "customer").then(setHistory).catch(() => {});
    if (customerToken) apiFetch("/customers/me", {}, "customer").then(setMe).catch(() => {});
  }, [customerToken]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "login") await customerLogin(phone, password);
      else await customerRegister(phone, password, name);
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
            <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Your Requests</div>
            {history.length === 0 && <EmptyState title="No requests yet" hint="Find a professional you like and send your first request." actionLabel="Browse Discover" actionHref="/" />}
            {history.map((r) => (
              <div key={r._id} className="bg-card border border-line rounded-xl p-3 mb-2"><b>{r.serviceNameSnapshot || "Service"}</b> — {r.status}</div>
            ))}
            <details className="mt-8 bg-card border border-line rounded-2xl p-4">
              <summary className="font-bold cursor-pointer">Account security</summary>
              <div className="mt-3"><ChangePasswordForm endpoint="/customers/me/change-password" actor="customer" /></div>
            </details>
          </>
        ) : (
          <div className="bg-surface-2 rounded-xl p-4">
            <div className="font-bold mb-3">Log in to see your requests</div>
            <form onSubmit={submit} className="space-y-3">
              {mode === "register" && <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />}
              <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
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
