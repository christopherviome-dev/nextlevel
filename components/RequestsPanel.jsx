"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import Toast from "./Toast";

const MEET = { provider: "At my place", client: "At the customer's place", midway: "Meet halfway" };

// WhatsApp needs the international format: a Ghana number like 0241234567
// becomes 233241234567. Numbers already starting with a country code are kept.
export function whatsappLink(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 10) d = "233" + d.slice(1);
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
  const [tab, setTab] = useState("pending");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    apiFetch("/requests")
      .then((all) => setRequests(all.filter((r) => r.stylistId === account._id)))
      .catch((e) => setError(e.message));
  }, [account._id]);
  useEffect(() => { load(); }, [load]);

  const byTab = {
    pending: (requests || []).filter((r) => r.status === "pending").sort((a, b) => b.createdAt - a.createdAt),
    accepted: (requests || []).filter((r) => r.status === "accepted").sort((a, b) => (a.preferredAt || a.createdAt) - (b.preferredAt || b.createdAt)),
    completed: (requests || []).filter((r) => r.status === "completed").sort((a, b) => b.updatedAt - a.updatedAt),
  };
  const tabs = [["pending", "New"], ["accepted", "Upcoming"], ["completed", "Completed"]];

  return (
    <div className="mt-6">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Requests</div>
      <div className="flex gap-2 mb-3">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={"px-4 py-2 rounded-full text-sm font-bold border " + (tab === key ? "bg-ink text-white border-ink" : "bg-white text-plum border-line")}>
            {label}{requests && byTab[key].length > 0 ? ` (${byTab[key].length})` : ""}
          </button>
        ))}
      </div>
      {error && <div className="text-hibiscus-deep text-sm">{error} <button className="underline" onClick={load}>Try again</button></div>}
      {!requests && !error && <div className="text-plum/70">Loading…</div>}
      {requests && byTab[tab].length === 0 && (
        <div className="text-plum/70 text-sm bg-white border border-line rounded-xl p-4">
          {tab === "pending" && "No new requests. Share your shop link so customers can find you."}
          {tab === "accepted" && "No upcoming appointments. Requests you accept will appear here."}
          {tab === "completed" && "No completed services yet. When you finish a service, mark it completed and it's recorded here."}
        </div>
      )}
      {requests && byTab[tab].map((r) => (
        <RequestCard key={r._id} r={r} onChanged={(msg) => { setToast(msg); load(); }} onStale={load} />
      ))}
    </div>
  );
}

function RequestCard({ r, onChanged, onStale }) {
  const [busy, setBusy] = useState(false);
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
    <div className="bg-white border border-line rounded-2xl p-4 mb-3">
      <div className="flex justify-between gap-3">
        <div>
          <div className="font-bold">{r.clientName}</div>
          {r.clientPhone && (
            <div className="flex gap-3 flex-wrap">
              <a href={`tel:${r.clientPhone}`} className="text-sm text-hibiscus-deep font-semibold">📞 {r.clientPhone}</a>
              {whatsappLink(r.clientPhone) && (
                <a href={whatsappLink(r.clientPhone)} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-700 font-semibold">WhatsApp</a>
              )}
            </div>
          )}
        </div>
        {r.emergency && r.emergency !== "no" && <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-1 h-fit">Urgent</span>}
      </div>
      <div className="text-sm mt-2">
        <b>{r.serviceNameSnapshot || "General request"}</b>
        {r.priceSnapshot != null && <> · {r.currencySnapshot || "GHS"} {r.priceSnapshot}</>}
        {r.durationSnapshot && <> · {r.durationSnapshot}</>}
      </div>
      <div className="text-sm text-plum/80 mt-1">🗓 {whenLabel(r)}{r.meet && MEET[r.meet] ? ` · ${MEET[r.meet]}` : ""}</div>
      {r.note && <div className="text-sm mt-2 bg-surface rounded-lg p-2">“{r.note}”</div>}
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
      {r.status === "accepted" && (
        <div className="flex gap-2 mt-3">
          <button disabled={busy} onClick={() => move("completed", "Mark this service as completed? It will be recorded in the customer's history.", "Service recorded as completed.")}
            className="px-5 py-2 rounded-full bg-emerald-700 text-white font-bold disabled:opacity-40">Mark completed</button>
          <button disabled={busy} onClick={() => move("declined", `Cancel ${r.clientName}'s appointment? They'll be notified.`, "Appointment cancelled.")}
            className="px-5 py-2 rounded-full border border-line font-bold disabled:opacity-40">Cancel</button>
        </div>
      )}
    </div>
  );
}
