"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import Nav from "../../components/Nav";
import CustomerGate from "../../components/customer/CustomerGate";
import MyCodeCard from "../../components/MyCodeCard";
import ChangePasswordForm from "../../components/ChangePasswordForm";
import { EmptyState } from "../../components/States";
import { whenLabel } from "../../components/customer/AppointmentCard";

const DUE = {
  NOT_DUE: (d) => [`In ${d} days`, "bg-surface-2 text-muted-strong border-line"],
  APPROACHING: (d) => [`Coming up in ${d} day${d === 1 ? "" : "s"}`, "bg-warn-bg text-warn-fg border-warn-line"],
  DUE: () => ["Due now", "bg-ok-bg text-ok-fg border-ok-line"],
  OVERDUE: (d) => [`Overdue by ${-d} day${d === -1 ? "" : "s"}`, "bg-bad-bg text-bad-fg border-bad-line"],
};

export default function MySheebaPage() {
  return <CustomerGate title="My Sheeba"><MySheeba /></CustomerGate>;
}

// My Sheeba: what's happening now for this customer, not a directory of features.
function MySheeba() {
  const { customerName, customerLogout } = useAuth();
  const [history, setHistory] = useState([]);
  const [prefs, setPrefs] = useState([]);
  const [styles, setStyles] = useState([]);
  const [now] = useState(() => Date.now()); // read the time once, not on every redraw

  const load = useCallback(() => {
    apiFetch("/customers/me/history", {}, "customer").then(setHistory).catch(() => {});
    apiFetch("/customers/me/repeat-preferences", {}, "customer").then(setPrefs).catch(() => {});
    apiFetch("/customers/me/style-records", {}, "customer").then(setStyles).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const shopName = Object.fromEntries(history.filter((r) => r.shop).map((r) => [r.stylistId, r.shop.name]));
  const next = history.filter((r) => ["pending", "accepted"].includes(r.status) && r.preferredAt && r.preferredAt > now)
    .sort((a, b) => a.preferredAt - b.preferredAt)[0];
  const due = [...prefs].sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  const saved = styles.filter((s) => s.finishedPhoto || s.notes);

  const setReminders = async (p, on) => { await apiFetch(`/customers/me/repeat-preferences/${p._id}`, { method: "PUT", body: JSON.stringify({ remindersEnabled: on }) }, "customer"); load(); };
  const remove = async (p) => { if (!window.confirm("Remove this reminder?")) return; await apiFetch(`/customers/me/repeat-preferences/${p._id}`, { method: "DELETE" }, "customer"); load(); };

  return (
    <div>
      <Nav />
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-16 space-y-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display font-extrabold text-xl text-ink">Hi {customerName ? customerName.split(" ")[0] : "there"}</h1>
            <p className="text-sm text-muted">Your beauty, all in one place.</p>
          </div>
          <button onClick={customerLogout} className="px-3 py-1.5 rounded-full border border-line bg-card text-sm font-bold text-plum">Log out</button>
        </div>

        {next && (
          <Link href="/requests" className="block bg-card border border-ok-line rounded-2xl p-4">
            <div className="text-xs font-extrabold tracking-wide text-ok-fg uppercase">Coming up</div>
            <div className="font-bold text-ink mt-1">{next.serviceNameSnapshot || "Appointment"} with {next.shop ? next.shop.name : "your professional"}</div>
            <div className="text-sm text-muted">{whenLabel(next)} · {next.status === "accepted" ? "Confirmed" : "Waiting for confirmation"}</div>
          </Link>
        )}

        <section>
          <h2 className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">What's due</h2>
          {due.length === 0
            ? <EmptyState title="No reminders yet" hint='After a service, tap "Remind me" on it in Appointments and we will tell you when it is time again.' actionLabel="Go to Appointments" actionHref="/requests" />
            : due.map((p) => {
              const [label, cls] = (DUE[p.status] || DUE.NOT_DUE)(p.daysUntilDue);
              return (
                <div key={p._id} className={"bg-card border border-line rounded-2xl p-3 mb-2 " + (p.remindersEnabled ? "" : "opacity-60")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-ink truncate">{p.serviceName || "Your usual service"}</div>
                      <div className="text-sm text-muted truncate">{shopName[p.stylistId] ? `with ${shopName[p.stylistId]} · ` : ""}every {p.intervalDays} days</div>
                    </div>
                    <span className={"text-xs px-2 py-1 rounded-full border whitespace-nowrap " + cls}>{label}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm">
                    {/* A plain link on purpose: shop pages load through the Netlify redirect rule. */}
                    <a href={`/shop/${p.stylistId}`} className="font-bold text-hibiscus-deep">Book now</a>
                    <button onClick={() => setReminders(p, !p.remindersEnabled)} className="text-plum underline">{p.remindersEnabled ? "Pause reminders" : "Resume reminders"}</button>
                    <button onClick={() => remove(p)} className="text-bad-fg underline">Remove</button>
                  </div>
                </div>
              );
            })}
        </section>

        <section>
          <h2 className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Your styles</h2>
          {saved.length === 0
            ? <EmptyState title="No saved styles yet" hint='After a service, tap "Save this style" in Appointments to keep a photo and notes for next time.' />
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {saved.map((s) => (
                  <div key={s._id} className="bg-card border border-line rounded-2xl overflow-hidden">
                    {s.finishedPhoto ? <img src={s.finishedPhoto} alt={s.serviceNameSnapshot || "Saved style"} className="w-full aspect-square object-cover" /> : <div className="w-full aspect-square bg-surface-2" />}
                    <div className="p-2">
                      <div className="text-sm font-bold text-ink truncate">{s.serviceNameSnapshot || "Style"}</div>
                      {s.notes && <div className="text-xs text-muted line-clamp-2">{s.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>

        <section>
          <h2 className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Invite friends</h2>
          <MyCodeCard actor="customer" />
        </section>

        <details className="bg-card border border-line rounded-2xl p-4">
          <summary className="font-bold cursor-pointer">Account security</summary>
          <div className="mt-3"><ChangePasswordForm endpoint="/customers/me/change-password" actor="customer" /></div>
        </details>
      </div>
    </div>
  );
}
