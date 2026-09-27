"use client";
import { useDraft } from "../../lib/useDraft";
import { useState, useEffect } from "react";
import { pendingInviteInfo } from "../../lib/invite";
import PhoneInput from "../../components/PhoneInput";
import CountrySelect from "../../components/CountrySelect";
import InviteLine from "../../components/InviteLine";
import AgeFields from "../../components/AgeFields";
import { getPublicSettings } from "../../lib/settings";
import { detectCountry, toE164 } from "../../lib/countries";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Nav from "../../components/Nav";
import Link from "next/link";

export default function Login() {
  const { login, register } = useAuth();
  const router = useRouter();
  // Survive an accidental refresh halfway through (never the password).
  const [mode, setMode, clearMode] = useDraft("pro-auth-mode", "login");
  const [phone, setPhone, clearPhone] = useDraft("pro-auth-phone", "");
  const [password, setPassword] = useState("");
  const [name, setName, clearName] = useDraft("pro-auth-name", "");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [inviteInfo] = useState(() => (typeof window === "undefined" ? null : pendingInviteInfo()));
  const [invite, setInvite] = useState(() => (inviteInfo && inviteInfo.code) || "");
  const [phoneCountry, setPhoneCountry] = useState(null);
  const [phoneCountryChosen, setPhoneCountryChosen] = useState(false);
  // The age check appears only when the admin has switched it on.
  const [ageCheck, setAgeCheck] = useState(false);
  const [age, setAge] = useState({});
  useEffect(() => { getPublicSettings().then((st) => setAgeCheck(!!st.ageCheck)); }, []);
  // Professionals in training: they name their supervisor by Sheeba code.
  const [isApprentice, setIsApprentice] = useState(false);
  const [supervisorCode, setSupervisorCode] = useState("");
  const [country, setCountry] = useState(null); // worked out in the browser
  useEffect(() => {
    // Start on the inviter's country when there is one (a UK stylist's link starts on 🇬🇧).
    const start = (inviteInfo && inviteInfo.country) || detectCountry();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the device's location settings only exist in the browser
    setCountry(start); setPhoneCountry(start);
  }, [inviteInfo]);

  // "Join as a professional" links here with ?mode=register.
  useEffect(() => {
    // One-time read of the page address after load.
    const q = new URLSearchParams(window.location.search);
    if (q.get("mode") === "register") setMode("register");
    if (q.get("role") === "apprentice") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the page address only exists in the browser
      setIsApprentice(true);
      // Arrived through a professional's own QR or link? They're probably the supervisor.
      if (inviteInfo && inviteInfo.type === "professional" && inviteInfo.code) setSupervisorCode(inviteInfo.code);
    }
  }, [setMode, inviteInfo]);

  const submit = async (e) => {
    e.preventDefault();
    const p = toE164(phone, phoneCountry);
    if (!p.ok) { setError(p.error); return; }
    const e164 = p.value;
    // Age answers (only when the admin has the age check switched on).
    let ageExtra = {};
    if (ageCheck && mode === "register") {
      if (isApprentice) {
        ageExtra = { apprenticeAge: age.apprenticeAge, guardianName: age.guardianName, guardianConsent: !!age.guardianConsent };
        if (age.apprenticeAge === "MINOR") {
          const g = toE164(age.guardianPhoneRaw, age.guardianCountry || country);
          if (!g.ok) { setError("Enter your parent or guardian's phone number."); return; }
          ageExtra.guardianPhone = g.value;
        }
      } else ageExtra = { ageConfirmed: !!age.ageConfirmed };
    }
    setBusy(true); setError(null);
    try {
      if (mode === "login") await login(e164, password);
      else await register(e164, password, name, invite, country, { ...(isApprentice ? { role: "APPRENTICE", supervisorCode } : {}), ...ageExtra });
      clearMode(); clearPhone(); clearName(); // signed in: the draft is no longer needed
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
    <Nav />
    <div className="max-w-md mx-auto px-5 pt-12">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-3">
        {mode === "login" ? "Log In" : isApprentice ? "Join as an Apprentice" : "Create Your Shop"}
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
        )}
        {mode === "register" && country && (
                <CountrySelect value={country} onChange={(c) => { setCountry(c); if (!phoneCountryChosen) setPhoneCountry(c); }} />
              )}
        {phoneCountry && <PhoneInput country={phoneCountry} onCountryChange={(c) => { setPhoneCountry(c); setPhoneCountryChosen(true); }} value={phone} onChange={setPhone} />}
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line" />
        {mode === "register" && (
          <label className="flex items-center gap-2 text-sm text-muted-strong">
            <input type="checkbox" checked={isApprentice} onChange={(e) => setIsApprentice(e.target.checked)} className="w-4 h-4" />
            I'm training under a professional (apprentice)
          </label>
        )}
        {mode === "register" && isApprentice && (
          <div>
            <input placeholder="Your supervisor's Sheeba code" value={supervisorCode} onChange={(e) => setSupervisorCode(e.target.value.toUpperCase())} maxLength={8}
              className="w-full px-4 py-3 rounded-xl border border-line font-mono tracking-widest" />
            <p className="text-xs text-muted mt-1">Ask them for it: it's under My Shop → Share &amp; earn. They'll confirm you before you can help with their shop.</p>
          </div>
        )}
        {mode === "register" && <InviteLine code={invite} name={inviteInfo && inviteInfo.code === invite ? inviteInfo.name : null} onChange={setInvite} />}
        {mode === "register" && ageCheck && <AgeFields apprentice={isApprentice} value={age} onChange={setAge} country={country} />}
        {mode === "register" && <p className="text-xs text-muted">By creating an account you agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy notice</Link>.</p>}
        {error && <p className="text-hibiscus-deep text-sm">{error}</p>}
        <button className="w-full py-3 rounded-full bg-hibiscus text-white font-bold" type="submit" disabled={busy}>
          {busy ? "One sec…" : mode === "login" ? "Log In" : "Create Account"}
        </button>
      </form>
      {mode === "login" && <Link href="/forgot-password?type=stylist" className="block mt-3 text-sm text-hibiscus-deep font-semibold">Forgot password?</Link>}
      <button className="mt-3 px-4 py-2 rounded-full border border-line bg-card text-sm" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "New here? Create a shop" : "Already have an account? Log in"}
      </button>
    </div>
    </div>
  );
}
