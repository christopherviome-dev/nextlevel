"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatMoney } from "../lib/money";

// datetime-local wants "YYYY-MM-DDTHH:MM" in the user's local time.
function localInputValue(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export default function RequestForm({ shop }) {
  const { customerToken, hydrated } = useAuth();
  const [me, setMe] = useState(null);
  const [styleId, setStyleId] = useState("");
  const [when, setWhen] = useState("");
  const [meet, setMeet] = useState("provider");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const services = (shop.styles || []).filter((s) => s.active !== false);
  const unavailable = shop.availability === "UNAVAILABLE" || shop.availability === "AWAY";

  useEffect(() => {
    if (customerToken) apiFetch("/customers/me", {}, "customer").then(setMe).catch(() => setMe(null));
  }, [customerToken]);

  if (!hydrated) return null;

  if (unavailable) {
    return (
      <div className="mt-5 bg-surface-2 rounded-xl p-4 text-sm">
        <b>{shop.salonName || shop.name}</b> isn't taking requests right now. Check back soon.
      </div>
    );
  }

  if (!customerToken) {
    const goLogin = () => {
      sessionStorage.setItem("sheeba:return", window.location.pathname);
      window.location.href = "/requests";
    };
    return (
      <div className="mt-5 bg-surface-2 rounded-xl p-4">
        <div className="font-bold">Want to book {shop.salonName || shop.name}?</div>
        <p className="text-sm text-muted-strong mt-1">Log in or create a free account to send a request. You'll come straight back here.</p>
        <button onClick={goLogin} className="mt-3 px-5 py-3 rounded-full bg-hibiscus text-white font-bold">Log in to request</button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="mt-5 bg-ok-bg border border-ok-line rounded-xl p-4">
        <div className="font-bold text-ok-fg">✓ Request sent</div>
        <p className="text-sm mt-1">{shop.salonName || shop.name} will reply soon, and we'll notify you.</p>
        <a href="/requests" className="inline-block mt-3 text-sm font-bold text-hibiscus-deep underline">See my requests</a>
      </div>
    );
  }

  const needsService = services.length > 0 && !styleId;
  const canSend = me && when && !needsService && !busy;

  const send = async () => {
    setBusy(true); setError(null);
    try {
      const at = new Date(when);
      await apiFetch("/requests", {
        method: "POST",
        body: JSON.stringify({
          stylistId: shop._id,
          styleId: styleId || undefined,
          clientId: me._id,
          clientName: me.name,
          clientPhone: me.phone,
          preferredAt: at.getTime(),
          date: at.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
          meet,
          note: note.trim() || undefined,
        }),
      }, "customer");
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 border-t border-line pt-5">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-3">Request a service</div>
      <div className="space-y-3">
        {services.length > 0 && (
          <div>
            <label className="block text-sm font-bold mb-1">Service</label>
            <select value={styleId} onChange={(e) => setStyleId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line bg-card">
              <option value="">Choose a service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.price != null ? ` · ${formatMoney(s.price, shop.currency)}` : ""}{s.duration ? ` · ${s.duration}` : ""}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-bold mb-1">When would you like it?</label>
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
        {me && <p className="text-xs text-muted">They'll see your name ({me.name}) and phone number so they can reach you.</p>}
        {error && <p className="text-sm text-hibiscus-deep">{error}</p>}
        <button onClick={send} disabled={!canSend} className="w-full py-3 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">
          {busy ? "Sending…" : "Send request"}
        </button>
      </div>
    </div>
  );
}
