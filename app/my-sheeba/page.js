"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import Nav from "../../components/Nav";
import CustomerGate from "../../components/customer/CustomerGate";
import MyCodeCard from "../../components/MyCodeCard";
import ProfileCard from "../../components/customer/ProfileCard";
import ShareLookButton from "../../components/ShareLookButton";
import ReelSheet from "../../components/reel/ReelSheet";
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
  const saved = styles.filter((s) => s.finishedPhoto || s.proPhoto || s.notes); // includes finished looks added by the professional
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const [reel, setReel] = useState(null); // the look whose angles are playing

  const setReminders = async (p, on) => { await apiFetch(`/customers/me/repeat-preferences/${p._id}`, { method: "PUT", body: JSON.stringify({ remindersEnabled: on }) }, "customer"); load(); };
  const remove = async (p) => { if (!window.confirm("Remove this reminder?")) return; await apiFetch(`/customers/me/repeat-preferences/${p._id}`, { method: "DELETE" }, "customer"); load(); };

  return (
    <div>
      <Nav />
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-16 space-y-8">
        <ProfileCard />

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
          <h2 className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Your looks</h2>
          {saved.length === 0
            ? <EmptyState title="No looks yet" hint="After a service, your professional can add a photo of your finished look, or you can save your own from Appointments." />
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {saved.map((s) => {
                  const photo = s.finishedPhoto || s.proPhoto;
                  const title = s.serviceName || s.serviceNameSnapshot || "My look";
                  const link = `${origin}/shop/${s.stylistId}${s.styleId ? `?look=${encodeURIComponent(s.styleId)}` : ""}#request`;
                  return (
                    <div key={s._id} className="bg-card border border-line rounded-2xl overflow-hidden flex flex-col">
                      {photo ? <img src={s.proThumb && !s.finishedPhoto ? s.proThumb : photo} alt={title} className="w-full aspect-square object-cover" /> : <div className="w-full aspect-square bg-surface-2" />}
                      <div className="p-2 flex-1 flex flex-col">
                        <div className="text-sm font-bold text-ink truncate">{title}</div>
                        {s.shopName && <div className="text-xs text-muted truncate">by {s.shopName}</div>}
                        {s.notes && <div className="text-xs text-muted line-clamp-2">{s.notes}</div>}
                        <div className="flex flex-wrap gap-2 mt-auto pt-2">
                          {s.reelCount >= 3 && <button type="button" onClick={() => setReel({ s, title, link })} className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-bold">▶ See all photos</button>}
                          <ShareLookButton photo={photo} title={title} byline={s.shopName} place={s.shopPlace} link={link} label="Share my look" />
                          {/* A plain link on purpose: shop pages load through the Netlify redirect rule. */}
                          <a href={link} className="px-3 py-1.5 rounded-full border border-line text-xs font-bold text-plum">Get this again</a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </section>
        {reel && (
          <ReelSheet title={reel.title} byline={reel.s.shopName} place={reel.s.shopPlace} link={reel.link} bookLabel="Get this again"
            load={() => apiFetch(`/reels/look/${reel.s.requestId}`, {}, "customer")} onClose={() => setReel(null)} />
        )}


        <section>
          <h2 className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Invite friends</h2>
          <MyCodeCard actor="customer" />
        </section>

        <p className="text-sm text-muted">Your account, password, feed preferences and more are in <Link href="/settings" className="font-bold text-hibiscus-deep underline">Settings</Link>.</p>
      </div>
    </div>
  );
}
