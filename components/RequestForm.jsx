"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { learn } from "../lib/interests";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../lib/money";
import { useDraft } from "../lib/useDraft";
import { toE164 } from "../lib/countries";
import { pendingInvite } from "../lib/invite";
import { getPublicSettings } from "../lib/settings";
import PhoneInput from "./PhoneInput";

// datetime-local wants "YYYY-MM-DDTHH:MM" in the user's local time.
function localInputValue(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

// Booking in ONE place. Someone opening a shared shop link picks the service
// and time, and (if they're new) types their name, phone and a password right
// here: one tap sends the request. Nobody is sent away to another page, and
// nothing they chose is lost if the page reloads (never the password).
export default function RequestForm({ shop }) {
  const { customerToken, hydrated, customerLogin, customerRegister } = useAuth();
  const [me, setMe] = useState(null);
  const draftKey = `booking-${shop._id}`;
  const [styleId, setStyleId, clearStyle] = useDraft(`${draftKey}-service`, "");
  const [when, setWhen, clearWhen] = useDraft(`${draftKey}-when`, "");
  const [meet, setMeet] = useState("provider");
  const [note, setNote, clearNote] = useDraft(`${draftKey}-note`, "");
  // The account step, for people who aren't logged in yet.
  const [hasAccount, setHasAccount] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(shop.country || "GH");
  const [password, setPassword] = useState("");
  const [ageCheck, setAgeCheck] = useState(false);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const services = (shop.styles || []).filter((s) => s.active !== false);
  const unavailable = shop.availability === "UNAVAILABLE" || shop.availability === "AWAY";
  const shopName = shop.salonName || shop.name;

  useEffect(() => {
    if (customerToken) apiFetch("/customers/me", {}, "customer").then(setMe).catch(() => setMe(null));
  }, [customerToken]);
  useEffect(() => { getPublicSettings().then((s) => setAgeCheck(!!s.ageCheck)); }, []);

  if (!hydrated) return null;

  if (unavailable) {
    return (
      <div className="mt-5 bg-surface-2 rounded-xl p-4 text-sm">
        <b>{shopName}</b> isn't taking requests right now. Check back soon.
      </div>
    );
  }

  if (sent) {
    return (
      <div className="mt-5 bg-ok-bg border border-ok-line rounded-xl p-4">
        <div className="font-bold text-ok-fg">✓ Request sent to {shopName}</div>
        <p className="text-sm mt-1">They'll reply soon, and we'll let you know. You can follow it in Appointments.</p>
        <Link href="/requests" className="inline-block mt-3 text-sm font-bold text-hibiscus-deep underline">See my appointments</Link>
      </div>
    );
  }

  const loggedIn = !!(customerToken && me);
  const needsService = services.length > 0 && !styleId;
  const detailsOk = loggedIn || (phone.trim() && password.length >= 8 && (hasAccount || (name.trim().length >= 2 && (!ageCheck || adult))));
  const canSend = when && !needsService && detailsOk && !busy;

  const send = async () => {
    setBusy(true); setError(null);
    try {
      let customer = me;
      if (!loggedIn) {
        const p = toE164(phone, phoneCountry);
        if (!p.ok) { setError(p.error); setBusy(false); return; }
        try {
          customer = hasAccount
            ? await customerLogin(p.value, password)
            : await customerRegister(p.value, password, name.trim(), pendingInvite(), phoneCountry, ageCheck ? { ageConfirmed: adult } : {});
        } catch (e) {
          // Already registered with this number? Switch to logging in instead of a dead end.
          if (!hasAccount && /already exists/i.test(e.message)) { setHasAccount(true); setError("You already have an account with this number. Enter your password to book."); }
          else setError(e.message);
          setBusy(false);
          return;
        }
      }
      const at = new Date(when);
      await apiFetch("/requests", {
        method: "POST",
        body: JSON.stringify({
          stylistId: shop._id,
          styleId: styleId || undefined,
          clientId: customer._id,
          clientName: customer.name,
          clientPhone: customer.phone,
          preferredAt: at.getTime(),
          date: at.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
          meet,
          note: note.trim() || undefined,
        }),
      }, "customer");
      // Booking is the strongest sign of what someone likes (learned only on this phone).
      { const chosen = (shop.styles || []).find((x) => x.id === styleId); if (chosen) learn("book", { styleKey: chosen.styleKey, serviceKey: chosen.serviceKey }); }
      clearStyle(); clearWhen(); clearNote();
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 border-t border-line pt-5">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-3">Book {shopName}</div>
      <div className="space-y-3">
        {services.length > 0 && (
          <div>
            <label className="block text-sm font-bold mb-1">1. Service</label>
            <select value={styleId} onChange={(e) => setStyleId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line bg-card">
              <option value="">Choose a service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.price != null ? ` · ${formatMoney(s.price, shop.currency)}` : ""}{s.duration ? ` · ${s.duration}` : ""}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-bold mb-1">{services.length > 0 ? "2. " : ""}When would you like it?</label>
          <input type="datetime-local" value={when} min={localInputValue(new Date())} onChange={(e) => setWhen(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-line bg-card" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Where?</label>
          <select value={meet} onChange={(e) => setMeet(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line bg-card">
            <option value="provider">At the professional's place</option>
            <option value="client">At my place</option>
            <option value="midway">Somewhere in between</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Anything they should know? (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000}
            placeholder="e.g. waist-length, medium size" className="w-full px-4 py-3 rounded-xl border border-line bg-card" />
        </div>

        {loggedIn ? (
          <p className="text-xs text-muted">Booking as <b>{me.name}</b>. {shopName} will see your name and phone number so they can reach you.</p>
        ) : (
          <div className="bg-surface rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold">{services.length > 0 ? "3. " : ""}{hasAccount ? "Log in to book" : "Your details"}</div>
              <button type="button" onClick={() => { setHasAccount(!hasAccount); setError(null); }} className="text-xs font-bold text-hibiscus-deep underline">
                {hasAccount ? "I'm new here" : "I already have an account"}
              </button>
            </div>
            {!hasAccount && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name"
                className="w-full px-4 py-3 rounded-xl border border-line bg-card" />
            )}
            <PhoneInput country={phoneCountry} onCountryChange={setPhoneCountry} value={phone} onChange={setPhone} autoComplete="tel-national" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={hasAccount ? "current-password" : "new-password"}
              placeholder={hasAccount ? "Password" : "Choose a password (8+ characters)"} className="w-full px-4 py-3 rounded-xl border border-line bg-card" />
            {!hasAccount && ageCheck && (
              <label className="flex items-center gap-2 text-sm text-muted-strong">
                <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="w-4 h-4" /> I'm 18 or older
              </label>
            )}
            <p className="text-xs text-muted">
              {hasAccount
                ? <Link href="/forgot-password?type=customer" className="underline">Forgot password?</Link>
                : <>This creates your free Sheeba account so you can follow your booking. By continuing you agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy notice</Link>.</>}
            </p>
          </div>
        )}

        {error && <p className="text-sm text-hibiscus-deep">{error}</p>}
        <button onClick={send} disabled={!canSend} className="w-full py-3.5 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">
          {busy ? "Sending…" : loggedIn ? "Send request" : hasAccount ? "Log in and send request" : "Send request"}
        </button>
      </div>
    </div>
  );
}
