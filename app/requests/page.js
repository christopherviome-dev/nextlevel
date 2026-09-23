"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import Nav from "../../components/Nav";

export default function Requests() {
  const { customerToken, customerName, customerLogin, customerRegister, customerLogout, hydrated } = useAuth();
  const [mode, setMode] = useState("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (customerToken) apiFetch("/customers/me/history", {}, "customer").then(setHistory).catch(() => {});
  }, [customerToken]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "login") await customerLogin(phone, password);
      else await customerRegister(phone, password, name);
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
              <button className="px-3 py-1.5 rounded-full border border-line text-sm font-bold bg-white" onClick={customerLogout}>Log Out</button>
            </div>
            <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Your Requests</div>
            {history.length === 0 && <div className="text-plum/70">Nothing yet — go find a shop on Discover.</div>}
            {history.map((r) => (
              <div key={r._id} className="bg-white border border-line rounded-xl p-3 mb-2"><b>{r.serviceNameSnapshot || "Service"}</b> — {r.status}</div>
            ))}
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
            <button className="mt-3 px-4 py-2 rounded-full border border-line bg-white text-sm" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
