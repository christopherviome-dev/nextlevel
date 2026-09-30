"use client";
import { useEffect, useState } from "react";
import { isIPhone, isInstalled, supported, currentSubscription, turnOn, turnOff, sendTest } from "../lib/phoneAlerts";

// Phone alerts: shows the one right thing for this phone (stupidly simple).
export default function PhoneAlerts({ as, compact = false }) {
  const [state, setState] = useState("loading");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
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
  const box = "rounded-2xl p-4 border " + (state === "on" ? "bg-ok-bg border-ok-line" : "bg-card border-line");
  return (
    <div className={box}>
      {state === "on" && <>
        <div className="font-bold text-ok-fg">🔔 Alerts are on for this phone</div>
        <p className="text-sm text-muted-strong mt-1">You'll hear about new bookings, messages and updates, even when Mepluge is closed.</p>
        <div className="flex gap-2 mt-3">
          <button onClick={() => run(async () => { const r = await sendTest(who); if (!r.sent) throw new Error("The test didn't arrive. Turn alerts off and on again."); }, null, "✓ Test sent. You should hear it now.")} disabled={busy} className="px-4 py-2 rounded-full bg-violet text-white text-sm font-bold">Send me a test</button>
          <button onClick={() => run(() => turnOff(who), "off", "Alerts are off for this phone.")} disabled={busy} className="px-4 py-2 rounded-full border border-line text-sm font-bold text-plum">Turn off</button>
        </div>
      </>}
      {state === "off" && <>
        <div className="font-bold text-ink">{as === "customer" ? "🔔 Get alerts on this phone" : "🔔 Don't miss booking requests"}</div>
        <p className="text-sm text-muted-strong mt-1">{as === "customer" ? "Know the moment your booking is confirmed or a professional messages you." : "Get a real phone alert, with sound, for every new request and message."}</p>
        <button onClick={() => run(() => turnOn(who), "on", "✓ Alerts are on. Tap “Send me a test” to hear one.")} disabled={busy} className="mt-3 px-4 py-2 rounded-full bg-hibiscus text-white text-sm font-bold">{busy ? "Turning on…" : "Turn on alerts"}</button>
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
