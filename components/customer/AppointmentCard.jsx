"use client";
import { useState } from "react";
import { apiFetch } from "../../lib/api";
import { formatMoney } from "../../lib/money";
import { fitImage } from "../../lib/image";

const STATUS = {
  pending: ["Waiting for confirmation", "bg-warn-bg text-warn-fg border-warn-line"],
  open: ["Looking for a professional", "bg-warn-bg text-warn-fg border-warn-line"],
  accepted: ["Confirmed", "bg-ok-bg text-ok-fg border-ok-line"],
  completed: ["Done", "bg-surface-2 text-muted-strong border-line"],
  declined: ["Not accepted", "bg-bad-bg text-bad-fg border-bad-line"],
};
const REMIND = [[14, "2 weeks"], [28, "4 weeks"], [42, "6 weeks"], [56, "8 weeks"], [90, "3 months"]];
const STYLE_PHOTO = { maxDim: 1000, maxChars: 290 * 1024 };

export function whenLabel(r) {
  if (r.preferredAt) {
    return new Date(r.preferredAt).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  }
  return r.date || null;
}

// One appointment, with what the customer can do next depending on its state.
export default function AppointmentCard({ r, onChanged }) {
  const [panel, setPanel] = useState(null); // "again" | "style" | "remind"
  const shopName = r.shop ? r.shop.name : "A professional";
  const [label, cls] = STATUS[r.status] || STATUS.pending;
  const when = whenLabel(r);
  const toggle = (p) => setPanel(panel === p ? null : p);

  return (
    <div className="bg-card border border-line rounded-2xl p-4 mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-ink truncate">{r.serviceNameSnapshot || "Service"}</div>
          <div className="text-sm text-muted truncate">with {shopName}{when ? ` · ${when}` : ""}</div>
        </div>
        <span className={"text-xs px-2 py-1 rounded-full border whitespace-nowrap " + cls}>{label}</span>
      </div>
      {r.checkedInAt && <div className="text-sm font-bold text-ok-fg mt-1">✓ Checked in {new Date(r.checkedInAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</div>}
      {r.priceSnapshot != null && <div className="text-sm text-muted-strong mt-1">{formatMoney(r.priceSnapshot, r.currencySnapshot || "GHS")}</div>}

      {r.status === "completed" && (
        <>
          <div className="flex flex-wrap gap-2 mt-3">
            {r.shop && r.shop.bookable && <button onClick={() => toggle("again")} className={"px-3 py-1.5 rounded-full text-sm font-bold border " + (panel === "again" ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>Book again</button>}
            <button onClick={() => toggle("style")} className={"px-3 py-1.5 rounded-full text-sm font-bold border " + (panel === "style" ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>Save this style</button>
            <button onClick={() => toggle("remind")} className={"px-3 py-1.5 rounded-full text-sm font-bold border " + (panel === "remind" ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>Remind me</button>
          </div>
          {panel === "again" && <BookAgain r={r} shopName={shopName} onDone={(m) => { setPanel(null); onChanged(m); }} />}
          {panel === "style" && <SaveStyle r={r} onDone={(m) => { setPanel(null); onChanged(m); }} />}
          {panel === "remind" && <RemindMe r={r} onDone={(m) => { setPanel(null); onChanged(m); }} />}
        </>
      )}
    </div>
  );
}

function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async (fn) => { setBusy(true); setError(null); try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return { busy, error, run };
}

function BookAgain({ r, shopName, onDone }) {
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const { busy, error, run } = useAction();
  // Earliest pickable moment (now, in local time), read once rather than on every redraw.
  const [minValue] = useState(() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); });
  return (
    <div className="mt-3 bg-surface rounded-xl p-3 space-y-2">
      <label className="block text-sm font-bold">When would you like to come?</label>
      <input type="datetime-local" value={when} min={minValue} onChange={(e) => setWhen(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line bg-card" />
      <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={2} placeholder="Anything to add? (optional)" className="w-full px-3 py-2 rounded-lg border border-line bg-card" />
      {error && <p className="text-sm text-bad-fg">{error}</p>}
      <button disabled={busy || !when} onClick={() => run(async () => {
        await apiFetch(`/customers/me/book-again/${r._id}`, { method: "POST", body: JSON.stringify({ preferredAt: new Date(when).getTime(), note }) }, "customer");
        onDone(`Request sent to ${shopName}`);
      })} className="px-4 py-2 rounded-full bg-hibiscus text-white text-sm font-bold disabled:opacity-40">{busy ? "Sending…" : "Send request"}</button>
    </div>
  );
}

function SaveStyle({ r, onDone }) {
  const [photo, setPhoto] = useState(null);
  const [notes, setNotes] = useState("");
  const { busy, error, run } = useAction();
  const [pickError, setPickError] = useState(null);
  const choose = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    setPickError(null);
    try { setPhoto(await fitImage(f, STYLE_PHOTO)); } catch (err) { setPickError(err.message); }
  };
  return (
    <div className="mt-3 bg-surface rounded-xl p-3 space-y-2">
      <div className="text-sm text-muted-strong">Keep a photo of how it turned out, so you can ask for it again.</div>
      <input type="file" accept="image/*" onChange={choose} className="block text-sm" />
      {photo && <img src={photo} alt="Your finished style" className="w-32 h-32 object-cover rounded-lg border border-line" />}
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} placeholder="Notes for next time, e.g. length, products used" className="w-full px-3 py-2 rounded-lg border border-line bg-card" />
      {(pickError || error) && <p className="text-sm text-bad-fg">{pickError || error}</p>}
      <button disabled={busy || (!photo && !notes.trim())} onClick={() => run(async () => {
        const body = {}; if (photo) body.finishedPhoto = photo; if (notes.trim()) body.notes = notes;
        await apiFetch(`/customers/me/style-records/by-request/${r._id}`, { method: "PATCH", body: JSON.stringify(body) }, "customer");
        onDone("Style saved to My Sheeba");
      })} className="px-4 py-2 rounded-full bg-hibiscus text-white text-sm font-bold disabled:opacity-40">{busy ? "Saving…" : "Save style"}</button>
    </div>
  );
}

function RemindMe({ r, onDone }) {
  const { busy, error, run } = useAction();
  return (
    <div className="mt-3 bg-surface rounded-xl p-3">
      <div className="text-sm text-muted-strong mb-2">Remind me to book {r.serviceNameSnapshot || "this"} again in:</div>
      <div className="flex flex-wrap gap-2">
        {REMIND.map(([days, label]) => (
          <button key={days} disabled={busy} onClick={() => run(async () => {
            await apiFetch("/customers/me/repeat-preferences", { method: "POST", body: JSON.stringify({
              stylistId: r.stylistId, styleId: r.styleId || null, serviceName: r.serviceNameSnapshot, intervalDays: days, lastCompletedAt: new Date(r.updatedAt).getTime(),
            }) }, "customer");
            onDone(`We'll remind you in ${label}`);
          })} className="px-3 py-1.5 rounded-full border border-line bg-card text-sm font-bold text-plum disabled:opacity-40">{label}</button>
        ))}
      </div>
      {error && <p className="text-sm text-bad-fg mt-2">{error}</p>}
    </div>
  );
}
