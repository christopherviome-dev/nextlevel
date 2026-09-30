"use client";
import { useEffect, useState } from "react";
import GoogleButton from "./GoogleButton";
import PhoneInput from "./PhoneInput";
import AgeFields from "./AgeFields";
import { useAuth } from "../context/AuthContext";
import { getPublicSettings } from "../lib/settings";
import { detectCountry, toE164 } from "../lib/countries";
import { apiFetch } from "../lib/api";

// First time with Google: one short step for the phone number (Google doesn't
// give it, and customers and professionals need to reach each other).
function Finish({ as, info, invite, onDone, onCancel }) {
  const { register, customerRegister } = useAuth();
  const [country, setCountry] = useState(() => detectCountry());
  const [phone, setPhone] = useState("");
  const [news, setNews] = useState(false);
  const [ageCheck, setAgeCheck] = useState(false);
  const [age, setAge] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { getPublicSettings().then((s) => setAgeCheck(!!(s && s.ageCheck))).catch(() => {}); }, []);
  const finish = async () => {
    setError(null);
    const p = toE164(phone, country);
    if (!p.ok) { setError(p.error); return; }
    if (ageCheck && !age.ageConfirmed) { setError("Please confirm you're 18 or older."); return; }
    const extra = { googleCredential: info.credential, marketingOptIn: news, ...(ageCheck ? { ageConfirmed: true } : {}) };
    setBusy(true);
    try {
      if (as === "pro") await register(p.value, "", info.name, invite || undefined, country, extra);
      else await customerRegister(p.value, "", info.name, invite || undefined, country, extra);
      onDone();
    } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div role="dialog" aria-modal="true" aria-label="Finish signing up" className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 space-y-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
        <div>
          <div className="text-xl font-extrabold text-ink">Almost done{info.name ? `, ${String(info.name).split(" ")[0]}` : ""}!</div>
          <p className="text-sm text-muted mt-1">Add your phone number so {as === "pro" ? "customers" : "professionals"} can reach you.</p>
        </div>
        <PhoneInput country={country} onCountryChange={setCountry} value={phone} onChange={setPhone} />
        {ageCheck && <AgeFields apprentice={false} value={age} onChange={setAge} country={country} />}
        <label className="flex items-start gap-2 text-sm text-muted-strong">
          <input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} className="w-4 h-4 mt-0.5" />
          <span>Send me Mepluge news by email{info.email ? ` (${info.email})` : ""}. You can stop anytime.</span>
        </label>
        <p className="text-xs text-muted">By continuing you agree to the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy</a>.</p>
        {error && <p className="text-sm text-bad-fg">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="px-4 py-2 rounded-full border border-line font-bold text-plum">Cancel</button>
          <button type="button" onClick={finish} disabled={busy} className="px-5 py-2 rounded-full bg-hibiscus text-white font-bold disabled:opacity-60">{busy ? "Finishing…" : "Finish"}</button>
        </div>
      </div>
    </div>
  );
}

// "Continue with Google" for sign-in and sign-up (as a customer or a professional).
export default function GoogleSignIn({ as, invite, onDone }) {
  const { googleSignIn } = useAuth();
  const [finish, setFinish] = useState(null);
  const [error, setError] = useState(null);
  const onCredential = async (credential) => {
    setError(null);
    try {
      const r = await googleSignIn(as, credential);
      if (r.needsSignup) setFinish({ ...r, credential }); else onDone("login");
    } catch (e) { setError(e.message); }
  };
  return (
    <div>
      {error && <p className="text-sm text-bad-fg mb-2">{error}</p>}
      <GoogleButton onCredential={onCredential} />
      {finish && <Finish as={as} info={finish} invite={invite} onCancel={() => setFinish(null)} onDone={() => { setFinish(null); onDone("register"); }} />}
    </div>
  );
}

// Settings: connect Google to an account that already exists.
export function GoogleConnect({ as }) {
  const { myAccount, refreshMyAccount } = useAuth();
  const [customerConnected, setCustomerConnected] = useState(null); // customers: read from their account
  const [justConnected, setJustConnected] = useState(false);
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (as !== "pro") apiFetch("/customers/me", {}, "customer").then((c) => setCustomerConnected(!!c.googleConnected)).catch(() => setCustomerConnected(false));
  }, [as]);
  const connected = justConnected || (as === "pro" ? !!(myAccount && myAccount.googleConnected) : customerConnected);
  const onCredential = async (credential) => {
    setMsg(null);
    try {
      const r = await apiFetch(as === "pro" ? "/auth/google-connect" : "/customers/me/google-connect", { method: "POST", body: JSON.stringify({ credential }) }, as === "pro" ? null : "customer");
      setJustConnected(true); setMsg(`✓ Connected: ${r.email}. Next time, just tap Continue with Google.`);
      if (as === "pro" && refreshMyAccount) refreshMyAccount();
    } catch (e) { setMsg(e.message); }
  };
  if (connected === null) return null;
  if (connected) return <p className="text-sm text-ok-fg font-bold">{msg || "✓ Google is connected. You can log in with Continue with Google."}</p>;
  return <div className="space-y-2"><GoogleButton onCredential={onCredential} text="signin_with" divider={false} />{msg && <p className="text-sm text-muted-strong">{msg}</p>}</div>;
}
