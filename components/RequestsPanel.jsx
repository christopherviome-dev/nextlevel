"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import Toast from "./Toast";
import ReportForm from "./ReportForm";
import ChairCard from "./pro/ChairCard";
import ShareLookButton from "./ShareLookButton";
import { fitImage } from "../lib/image";
import { countryInfo } from "../lib/countries";

const MEET = { provider: "At my place", client: "At the customer's place", midway: "Meet halfway" };

// WhatsApp needs the international format: Ghana 0241234567 → 233241234567,
// UK 07700900123 → 447700900123. Local numbers are read using the shop's
// country (customers usually book locally); numbers already written with a
// country code are kept as they are.
export function whatsappLink(phone, country = "GH") {
  const c = countryInfo(country);
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith(c.trunk) && d.length === c.trunk.length + c.nsnLength) d = c.dial + d.slice(c.trunk.length);
  return d.length >= 9 ? `https://wa.me/${d}` : null;
}

function whenLabel(r) {
  if (r.preferredAt) {
    return new Date(r.preferredAt).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  return r.date || "No time given";
}

export default function RequestsPanel({ account }) {
  const [requests, setRequests] = useState(null);
  const [chosenTab, setTab] = useState(null); // null = not chosen yet: use the sensible default
  const [now] = useState(() => Date.now()); // read the time once, not on every redraw
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Your own shop's requests, plus those of any shop you help with (staff, or
  // a confirmed apprentice): the server already allows acting on those.
  const [helpShops, setHelpShops] = useState({}); // shopId → { name, country }
  const load = useCallback(() => {
    Promise.all([apiFetch("/requests"), apiFetch("/stylists/managed-by-me").catch(() => [])])
      .then(([all, managed]) => {
        const shops = Object.fromEntries(managed.map((s) => [s._id, { name: s.salonName || s.name, country: s.country }]));
        setHelpShops(shops);
        setRequests(all.filter((r) => r.stylistId === account._id || shops[r.stylistId]));
      })
      .catch((e) => setError(e.message));
  }, [account._id]);
  useEffect(() => { load(); }, [load]);

  // Day boundaries in the professional's own time zone.
  const today0 = (() => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  const DAY = 24 * 3600 * 1000;
  const accepted = (requests || []).filter((r) => r.status === "accepted");
  const byTab = {
    today: accepted.filter((r) => r.preferredAt >= today0 && r.preferredAt < today0 + DAY).sort((a, b) => a.preferredAt - b.preferredAt),
    pending: (requests || []).filter((r) => r.status === "pending").sort((a, b) => b.createdAt - a.createdAt),
    accepted: (requests || []).filter((r) => r.status === "accepted").sort((a, b) => (a.preferredAt || a.createdAt) - (b.preferredAt || b.createdAt)),
    completed: (requests || []).filter((r) => r.status === "completed").sort((a, b) => b.updatedAt - a.updatedAt),
  };
  const tabs = [["today", "Today"], ["pending", "New"], ["accepted", "Upcoming"], ["completed", "Completed"]];
  // Open on Today when someone is coming today, otherwise on New requests.
  const tab = chosenTab || (byTab.today.length > 0 ? "today" : "pending");
  // Upcoming, grouped under day headings.
  const dayLabel = (t) => {
    if (!t) return "No date set";
    if (t < today0 + DAY) return t < today0 ? "Earlier" : "Today";
    if (t < today0 + 2 * DAY) return "Tomorrow";
    return new Date(t).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  };
  const groups = [];
  for (const r of byTab.accepted) {
    const label = dayLabel(r.preferredAt);
    const g = groups.find((x) => x[0] === label);
    if (g) g[1].push(r); else groups.push([label, [r]]);
  }
  const card = (r) => <RequestCard key={r._id} r={r} forShop={helpShops[r.stylistId] ? helpShops[r.stylistId].name : null} shopName={helpShops[r.stylistId] ? helpShops[r.stylistId].name : account.salonName || account.name} shopPlace={account.area || account.city}
    country={helpShops[r.stylistId] ? helpShops[r.stylistId].country : account.country} onChanged={(msg) => { setToast(msg); load(); }} onStale={load} />;

  return (
    <div className="mt-6">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Requests</div>
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={"px-4 py-2 rounded-full text-sm font-bold border " + (tab === key ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>
            {label}{requests && byTab[key].length > 0 ? ` (${byTab[key].length})` : ""}
          </button>
        ))}
      </div>
      {error && <div className="text-hibiscus-deep text-sm">{error} <button className="underline" onClick={load}>Try again</button></div>}
      {!requests && !error && <div className="text-muted">Loading…</div>}
      {requests && byTab[tab].length === 0 && (
        <div className="text-muted text-sm bg-card border border-line rounded-xl p-4">
          {tab === "today" && "No one is booked for today."}
          {tab === "pending" && "No new requests. Share your shop link so customers can find you."}
          {tab === "accepted" && "No upcoming appointments. Requests you accept will appear here."}
          {tab === "completed" && "No completed services yet. When you finish a service, mark it completed and it's recorded here."}
        </div>
      )}
      {tab === "today" && (
        <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) window.location.href = `/u/${encodeURIComponent(code.trim())}`; }}
          className="flex gap-2 mb-3 bg-card border border-line rounded-xl p-3">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} placeholder="Customer's code, e.g. K7M 2QX"
            aria-label="Check in a customer by their code" className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-line bg-surface font-mono tracking-widest" />
          <button type="submit" disabled={!code.trim()} className="px-4 py-2 rounded-full bg-violet text-white text-sm font-bold disabled:opacity-40">Check in</button>
        </form>
      )}
      {tab === "today" && byTab.pending.some((r) => r.preferredAt >= today0 && r.preferredAt < today0 + DAY) && (
        <button onClick={() => setTab("pending")} className="w-full text-left text-sm bg-warn-bg border border-warn-line text-warn-fg rounded-xl p-3 mb-3">
          Someone wants to come today but you haven't answered yet. See New requests →
        </button>
      )}
      {requests && tab === "accepted"
        ? groups.map(([label, items]) => (
          <div key={label} className="mb-2">
            <div className="text-xs font-bold text-muted uppercase tracking-wide mt-3 mb-1">{label}</div>
            {items.map(card)}
          </div>
        ))
        : requests && byTab[tab].map(card)}
    </div>
  );
}

function RequestCard({ r, country, forShop, shopName, shopPlace, onChanged, onStale }) {
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState(false);
  // The customer card: always for the owner; for helpers, on the day of the visit (the server checks too).
  const [now] = useState(() => Date.now()); // read once, not on every redraw
  const nearNow = r.preferredAt && Math.abs(r.preferredAt - now) < 24 * 3600 * 1000;
  const canCard = r.clientId && ["accepted", "completed"].includes(r.status) && (!forShop || nearNow);
  // Fresh Look: after the service, a photo of the finished look for the customer's gallery (14 days).
  const doneAt = r.completedAt || (r.updatedAt ? new Date(r.updatedAt).getTime() : 0);
  const lookWindow = r.status === "completed" && r.clientId && now - doneAt < 14 * 24 * 3600 * 1000;
  const [look, setLook] = useState(null);
  const [lookMsg, setLookMsg] = useState(null);
  // One button for photos of the finished work (stupidly simple): the first photo goes to the
  // customer's styles; 3 or more also play as angles. Nobody has to learn what a "reel" is.
  const addLook = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8); e.target.value = "";
    if (!files.length) return;
    const first = String(r.clientName || "their").split(" ")[0];
    setLookMsg("Adding…");
    try {
      const [photo, thumb] = await Promise.all([fitImage(files[0], { maxDim: 1000, maxChars: 290 * 1024 }), fitImage(files[0], { maxDim: 360, maxChars: 55 * 1024 })]);
      await apiFetch(`/requests/${r._id}/look`, { method: "POST", body: JSON.stringify({ photo, thumb }) });
      setLook(photo);
      if (files.length >= 3) {
        const frames = await Promise.all(files.map((f) => fitImage(f, { maxDim: 900, maxChars: 95 * 1024 })));
        await apiFetch(`/reels/look/${r._id}`, { method: "POST", body: JSON.stringify({ frames }) });
        setLookMsg(`✓ Added to ${first}'s styles, with all ${files.length} photos`);
      } else setLookMsg(`✓ Added to ${first}'s styles`);
    } catch (err) { setLookMsg(err.message); }
  };
  const [error, setError] = useState(null);

  const move = async (status, confirmText, doneText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true); setError(null);
    try {
      await apiFetch(`/requests/${r._id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      onChanged(doneText);
    } catch (e) {
      setError(e.message);
      onStale();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card border border-line rounded-2xl p-4 mb-3">
      {forShop && <div className="text-xs font-bold text-violet mb-1">For {forShop}</div>}
      {card && <ChairCard requestId={r._id} onClose={() => setCard(false)} />}
      <div className="flex justify-between gap-3">
        <div>
          <div className="font-bold">{r.clientName}</div>
          {r.clientPhone && (
            <div className="flex gap-3 flex-wrap">
              <a href={`tel:${r.clientPhone}`} className="text-sm text-hibiscus-deep font-semibold">📞 {r.clientPhone}</a>
              {whatsappLink(r.clientPhone, country) && (
                <a href={whatsappLink(r.clientPhone, country)} target="_blank" rel="noopener noreferrer" className="text-sm text-ok-fg font-semibold">WhatsApp</a>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="text-sm mt-2">
        <b>{r.serviceNameSnapshot || "General request"}</b>
        {r.priceSnapshot != null && <> · {r.currencySnapshot || "GHS"} {r.priceSnapshot}</>}
        {r.durationSnapshot && <> · {r.durationSnapshot}</>}
      </div>
      <div className="text-sm text-muted-strong mt-1">🗓 {whenLabel(r)}{r.meet && MEET[r.meet] ? ` · ${MEET[r.meet]}` : ""}</div>
      {r.note && <div className="text-sm mt-2 bg-surface rounded-lg p-2">“{r.note}”</div>}
      {/* The customer's emergency contact: someone who knows where they're going. Shared for safety. */}
      {r.emergency && <div className="text-xs text-muted mt-2">Customer's emergency contact: {r.emergency}</div>}
      {r.status === "completed" && r.rating && <div className="text-sm mt-2">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} rated by the customer</div>}
      {error && <div className="text-sm text-hibiscus-deep mt-2">{error}</div>}

      {r.status === "pending" && (
        <div className="flex gap-2 mt-3">
          <button disabled={busy} onClick={() => move("accepted", null, "Request accepted. The customer has been notified.")}
            className="px-5 py-2 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">Accept</button>
          <button disabled={busy} onClick={() => move("declined", `Decline ${r.clientName}'s request? They'll be notified.`, "Request declined.")}
            className="px-5 py-2 rounded-full border border-line font-bold disabled:opacity-40">Decline</button>
        </div>
      )}
      {r.checkedInAt && (
        <div className="text-sm font-bold text-ok-fg mt-1">✓ Checked in {new Date(r.checkedInAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</div>
      )}
      {r.status === "accepted" && (
        <div className="flex gap-2 mt-3">
          <button disabled={busy} onClick={() => move("completed", "Mark this service as completed? It will be recorded in the customer's history.", "Service recorded as completed.")}
            className="px-5 py-2 rounded-full bg-emerald-700 text-white font-bold disabled:opacity-40">Mark completed</button>
          <button disabled={busy} onClick={() => move("declined", `Cancel ${r.clientName}'s appointment? They'll be notified.`, "Appointment cancelled.")}
            className="px-5 py-2 rounded-full border border-line font-bold disabled:opacity-40">Cancel</button>
        </div>
      )}
      {lookWindow && (
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
          <label className="px-3 py-1.5 rounded-full border border-hibiscus text-hibiscus-deep font-bold cursor-pointer">
            <input type="file" accept="image/*" multiple onChange={addLook} className="sr-only" />📸 {look ? "Change the photos" : "Add photos of the finished look"}
          </label>
          {!look && !lookMsg && <span className="text-muted">1 photo, or 3 to 8 to show every side</span>}
          {lookMsg && <span className="text-muted">{lookMsg}</span>}
          {look && <ShareLookButton photo={look} title={r.serviceNameSnapshot || "Fresh look"} byline={shopName} place={shopPlace}
            link={`${window.location.origin}/shop/${r.stylistId}${r.styleId ? `?look=${encodeURIComponent(r.styleId)}` : ""}#request`} />}
        </div>
      )}
      {(canCard || r.servedByName || r.phoneHidden) && (
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
          {canCard && <button onClick={() => setCard(true)} className="px-3 py-1.5 rounded-full border border-violet text-violet font-bold">Customer card</button>}
          {r.status === "completed" && r.servedByName && <span className="text-muted">Served by {r.servedByName}</span>}
          {r.phoneHidden && <span className="text-muted">Phone hidden by the shop owner</span>}
        </div>
      )}
      {/* Professionals can report a customer they had a booking with (the server checks). */}
      {r.clientId && <ReportForm targetType="customer" requestId={r._id} name={r.clientName} country={country} label="Report this customer" />}
    </div>
  );
}
