"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

// Every switch is enforced on the server, not just hidden on screen.
const GROUPS = [
  ["Safety", [
    ["ageCheck", "Age check at sign-up", "18+ for customers and professionals; apprentices from 15 with a parent or guardian's consent."],
    ["verifiedOnly", "Only ID-checked professionals on Discover", "Hide professionals whose ID hasn't been checked yet. Their shop links still work."],
  ]],
  ["Pauses (maintenance or emergencies)", [
    ["pauseSignups", "Pause new sign-ups", "Nobody new can join until you switch this off. Everyone else is unaffected.", true],
    ["pauseBookings", "Pause new bookings", "No new requests or \"book again\". Existing bookings carry on as normal.", true],
    ["messages", "Messages", "When off, nobody can start or send messages; people are pointed to call or WhatsApp.", false, true],
  ]],
  ["Rewards", [
    ["inviteRewards", "Invite rewards", "When off, first completed jobs earn no rewards. Who invited whom is still recorded."],
  ]],
];

function Toggle({ on, onClick, busy, warn }) {
  return (
    <button onClick={onClick} disabled={busy} role="switch" aria-checked={on}
      className={"shrink-0 w-14 h-8 rounded-full relative transition-colors " + (on ? (warn ? "bg-amber-500" : "bg-emerald-600") : "bg-surface-2 border border-line")}>
      <span className={"absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all " + (on ? "left-7" : "left-1")} />
      <span className="sr-only">{on ? "On" : "Off"}</span>
    </button>
  );
}

export default function AdminSwitches() {
  const [v, setV] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  useEffect(() => { apiFetch("/admin/settings").then((s) => { setV(s); setText(s.announcement || ""); }).catch((e) => setError(e.message)); }, []);
  const save = async (key, value) => {
    setBusy(key); setError(null);
    try { const r = await apiFetch(`/admin/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) }); setV((x) => ({ ...x, [key]: r.value })); if (key === "announcement") setText(r.value); }
    catch (e) { setError(e.message); }
    setBusy(null);
  };
  if (error && !v) return <p className="text-bad-fg">{error}</p>;
  if (!v) return <p className="text-muted">Loading…</p>;
  const paused = v.pauseSignups || v.pauseBookings || !v.messages;
  return (
    <div className="space-y-6">
      {paused && <div className="rounded-2xl p-3 bg-amber-50 border border-amber-300 text-amber-900 text-sm font-bold">Something is paused right now. Remember to switch it back on.</div>}
      {error && <p className="text-bad-fg text-sm">{error}</p>}
      {GROUPS.map(([title, items]) => (
        <div key={title}>
          <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">{title}</div>
          <div className="bg-card border border-line rounded-2xl divide-y divide-line">
            {items.map(([key, label, hint, warnWhenOn, warnWhenOff]) => (
              <div key={key} className="p-4 flex items-center justify-between gap-3">
                <div><div className="font-bold text-ink">{label}</div><div className="text-sm text-muted">{hint}</div></div>
                <Toggle on={!!v[key]} busy={busy === key} warn={warnWhenOn} onClick={() => save(key, !v[key])} />
                {warnWhenOff && !v[key] && <span className="sr-only">Paused</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Announcement</div>
        <div className="bg-card border border-line rounded-2xl p-4 space-y-3">
          <p className="text-sm text-muted">Shown at the top of every page for everyone, until you clear it. People can close it on their phone.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 200))} rows={2} placeholder="e.g. New: add a Fresh Look to your finished styles!" className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-sm" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted">{text.length}/200</span>
            <div className="flex gap-2">
              {v.announcement && <button onClick={() => save("announcement", "")} disabled={busy === "announcement"} className="px-4 py-2 rounded-full border border-line text-sm font-bold text-plum">Clear</button>}
              <button onClick={() => save("announcement", text)} disabled={busy === "announcement" || text.trim() === (v.announcement || "")} className="px-4 py-2 rounded-full bg-violet text-white text-sm font-bold disabled:opacity-50">Show it</button>
            </div>
          </div>
          {v.announcement && <div className="text-sm rounded-xl bg-violet/10 text-ink p-3"><b>Showing now:</b> {v.announcement}</div>}
        </div>
      </div>
    </div>
  );
}
