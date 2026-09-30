"use client";
import { useEffect, useState } from "react";
import { isIPhone, isInstalled, supported, currentSubscription, turnOn, turnOff, sendTest } from "../lib/phoneAlerts";
import { apiFetch } from "../lib/api";

const GROUP_LABEL = {
  bookings: ["Bookings", "New requests, confirmations, check-ins"], messages: ["Messages", "When someone writes to you"],
  looks: ["Looks and ratings", "Fresh looks and new ratings"], team: ["Team and training", "Helpers, trainees and sign-offs"],
  rewards: ["Invites and rewards", "When people join with your code"], account: ["Your account", "Approvals, ID checks and account notices"],
  admin: ["Admin work", "Reports, IDs to check, community messages"],
};

// What rings this phone: one switch per group (everything still appears in Notifications).
export function AlertChoices({ as }) {
  const who = as === "customer" ? "customer" : null;
  const [data, setData] = useState(null);
  useEffect(() => { apiFetch("/push/prefs", {}, who).then(setData).catch(() => setData(null)); }, [who]);
  const flip = async (g) => {
    const prefs = { ...data.prefs, [g]: !data.prefs[g] };
    setData({ ...data, prefs });
    try { await apiFetch("/push/prefs", { method: "PUT", body: JSON.stringify({ prefs: { [g]: prefs[g] } }) }, who); } catch (e) { setData(data); }
  };
  if (!data) return null;
  return (
    <div className="divide-y divide-line">
      {data.groups.map((g) => (
        <label key={g} className="flex items-center justify-between gap-3 py-2.5 cursor-pointer">
          <span><span className="block text-sm font-bold text-ink">{GROUP_LABEL[g][0]}</span><span className="block text-xs text-muted">{GROUP_LABEL[g][1]}</span></span>
          <input type="checkbox" checked={!!data.prefs[g]} onChange={() => flip(g)} className="w-5 h-5 accent-violet shrink-0" />
        </label>
      ))}
    </div>
  );
}

// Phone alerts: shows the one right thing for this phone (stupidly simple).
export default function PhoneAlerts({ as, compact = false, hideWhenOn = false }) {
  const [state, setState] = useState("loading");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [choosing, setChoosing] = useState(false); // just turned on: choose what rings, once
  const who = as === "customer" ? "customer" : null;
  useEffect(() => {
    let live = true;
    (async () => {
      let s = "off";
      if (isIPhone() && !isInstalled()) s = "iphone";
      else if (!supported()) s = "unsupported";
      else if (Notification.permission === "denied") s = "blocked";
      else if (await currentSubscription().catch(() => null)) s = "on";
      if (live) setState(s);
    })();
    return () => { live = false; };
  }, []);
  const run = async (fn, next, okMsg) => {
    setBusy(true); setMsg(null);
    try { await fn(); if (next) setState(next); if (okMsg) setMsg(okMsg); }
    catch (e) { setMsg(e.message); if (typeof Notification !== "undefined" && Notification.permission === "denied") setState("blocked"); }
    setBusy(false);
  };
  if (state === "loading" || (compact && (state === "on" || state === "unsupported"))) return null;
  if (choosing) return (
    <div className="rounded-2xl p-4 border bg-card border-line">
      <div className="font-bold text-ink">✓ Alerts are on. What should ring your phone?</div>
      <p className="text-xs text-muted mt-1 mb-2">Everything still shows here in Notifications. Change this any time in Settings.</p>
      <AlertChoices as={as} />
      <button onClick={() => setChoosing(false)} className="mt-3 px-5 py-2 rounded-full bg-violet text-white text-sm font-bold">Done</button>
    </div>
  );
  if (hideWhenOn && state === "on") return null;
  const box = "rounded-2xl p-4 border " + (state === "on" ? "bg-ok-bg border-ok-line" : "bg-card border-line");
  return (
    <div className={box}>
      {state === "on" && <>
        <div className="font-bold text-ok-fg">🔔 Alerts are on for this phone</div>
        <p className="text-sm text-muted-strong mt-1">Choose what rings your phone, even when Mepluge is closed.</p>
        <div className="mt-2 bg-card rounded-xl px-3"><AlertChoices as={as} /></div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => run(async () => { const r = await sendTest(who); if (!r.sent) throw new Error("The test didn't arrive. Turn alerts off and on again."); }, null, "✓ Test sent. You should hear it now.")} disabled={busy} className="px-4 py-2 rounded-full bg-violet text-white text-sm font-bold">Send me a test</button>
          <button onClick={() => run(() => turnOff(who), "off", "Alerts are off for this phone.")} disabled={busy} className="px-4 py-2 rounded-full border border-line text-sm font-bold text-plum">Turn off</button>
        </div>
      </>}
      {state === "off" && <>
        <div className="font-bold text-ink">{as === "customer" ? "🔔 Get alerts on this phone" : "🔔 Don't miss booking requests"}</div>
        <p className="text-sm text-muted-strong mt-1">{as === "customer" ? "Know the moment your booking is confirmed or a professional messages you." : "Get a real phone alert, with sound, for every new request and message."}</p>
        <button onClick={() => run(async () => { await turnOn(who); setChoosing(true); }, "on")} disabled={busy} className="mt-3 px-4 py-2 rounded-full bg-hibiscus text-white text-sm font-bold">{busy ? "Turning on…" : "Turn on alerts"}</button>
      </>}
      {state === "iphone" && <>
        <div className="font-bold text-ink">🔔 Alerts on iPhone: add Mepluge to your Home Screen first</div>
        <ol className="text-sm text-muted-strong mt-2 space-y-1 list-decimal pl-5">
          <li>In Safari, tap the <b>Share</b> button (the square with an arrow).</li>
          <li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li>
          <li>Open Mepluge from your Home Screen and turn on alerts here.</li>
        </ol>
      </>}
      {state === "blocked" && <>
        <div className="font-bold text-ink">🔕 Alerts are blocked on this phone</div>
        <p className="text-sm text-muted-strong mt-1">Open your browser's settings for this site, allow <b>Notifications</b>, then come back and refresh.</p>
      </>}
      {state === "unsupported" && <p className="text-sm text-muted-strong">This browser can't show phone alerts. Chrome on Android, or Mepluge added to an iPhone's Home Screen, can.</p>}
      {msg && <p className="text-sm text-muted-strong mt-2">{msg}</p>}
    </div>
  );
}
