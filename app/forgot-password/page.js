"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import Nav from "../../components/Nav";

export default function ForgotPassword() {
  const [accountType, setAccountType] = useState("stylist");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  // Login pages link here with ?type=customer or ?type=stylist. Read in the
  // browser because this site is exported as static pages.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("type");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the page address after load
    if (t === "customer" || t === "stylist") setAccountType(t);
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const r = await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ phone, accountType }) });
      setDone(r.message);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <Nav />
      <div className="max-w-md mx-auto px-5 pt-10">
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-3">Forgot your password?</div>
        {done ? (
          <div className="bg-card border border-line rounded-2xl p-4 space-y-2">
            <div className="font-bold text-ok-fg">Request received</div>
            <p className="text-sm text-muted-strong">{done}</p>
            <p className="text-sm text-muted-strong">Keep your phone nearby. Sheeba will only ever call the number on your account, and will never ask for your old password.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="flex gap-2">
              {[["stylist", "I have a shop"], ["customer", "I'm a customer"]].map(([v, label]) => (
                <button type="button" key={v} onClick={() => setAccountType(v)}
                  className={"flex-1 py-2 rounded-full border text-sm font-bold " + (accountType === v ? "bg-violet text-white border-violet" : "bg-card border-line text-plum")}>
                  {label}
                </button>
              ))}
            </div>
            <input type="tel" autoComplete="tel" placeholder="The phone number on your account" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-line" />
            {error && <p className="text-hibiscus-deep text-sm">{error}</p>}
            <button type="submit" disabled={busy || phone.replace(/\D/g, "").length < 9}
              className="w-full py-3 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">
              {busy ? "Sending…" : "Ask Sheeba for help"}
            </button>
            <p className="text-xs text-muted">Sheeba will call the number on your account to confirm it's you, then give you a temporary password.</p>
          </form>
        )}
      </div>
    </div>
  );
}
