"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import { toE164 } from "../../lib/countries";
import PhoneInput from "../PhoneInput";
import ApprenticesPanel from "../ApprenticesPanel";

function Switch({ on, onChange, label }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={"w-11 h-6 rounded-full relative transition-colors shrink-0 " + (on ? "bg-emerald-600" : "bg-surface-2 border border-line")}>
      <span className={"absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all " + (on ? "left-[1.3rem]" : "left-0.5")} />
    </button>
  );
}
const when = (t) => (t ? new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : null);

// The owner's team: helpers and apprentices, what each may do, jobs each has
// served, and a record of which customer cards they opened.
export default function TeamPanel({ account }) {
  const [team, setTeam] = useState(null);
  const [activity, setActivity] = useState([]);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(account.country || "GH");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    apiFetch("/team/me").then(setTeam).catch(() => setTeam([]));
    apiFetch("/team/me/activity").then(setActivity).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  const set = async (id, patch) => { await apiFetch(`/team/me/${id}`, { method: "PUT", body: JSON.stringify(patch) }); load(); };
  const remove = async (m) => { if (!window.confirm(`Remove ${m.name} from your shop? Their access ends immediately.`)) return; await apiFetch(`/stylists/me/staff/${m.id}`, { method: "DELETE" }); load(); };
  const add = async () => {
    const p = toE164(phone, country);
    if (!p.ok) { setMsg(p.error); return; }
    setBusy(true); setMsg(null);
    try { const r = await apiFetch("/stylists/me/staff", { method: "POST", body: JSON.stringify({ phone: p.value }) }); setPhone(""); setMsg(`✓ ${r.staffName} added to your team.`); load(); }
    catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-line rounded-2xl p-4">
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-1">Your team</div>
        <p className="text-sm text-muted mb-3">When you're away, your team can serve your customers. They see what they need at the chair; phone numbers stay hidden unless you allow them, and every customer card they open is recorded here.</p>
        {team && team.length === 0 && <p className="text-sm text-muted">No one on your team yet.</p>}
        {team && team.map((m) => (
          <div key={m.id} className="border-t border-line py-3">
            <div className="flex items-center gap-3">
              {m.photo ? <img src={m.photo} alt="" className="w-10 h-10 rounded-full object-cover" /> : <span className="w-10 h-10 rounded-full bg-violet text-white font-bold flex items-center justify-center">{m.name.slice(0, 1).toUpperCase()}</span>}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink truncate">{m.name}{m.apprentice ? <span className="text-xs text-muted font-normal"> · in training</span> : null}</div>
                <div className="text-xs text-muted">{m.jobsServed} job{m.jobsServed === 1 ? "" : "s"} served{m.lastOpenedCard ? ` · last opened a card ${when(m.lastOpenedCard)}` : ""}</div>
              </div>
              <button onClick={() => remove(m)} className="text-xs font-bold text-bad-fg underline shrink-0">Remove</button>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center justify-between gap-3"><span><b>Manage all bookings</b><span className="block text-xs text-muted">Off: they only see and complete today's appointments</span></span><Switch on={m.canManageBookings} onChange={(v) => set(m.id, { canManageBookings: v })} label={`${m.name} can manage all bookings`} /></label>
              <label className="flex items-center justify-between gap-3"><span><b>See customers' phone numbers</b><span className="block text-xs text-muted">Off: shown as •••• ••22</span></span><Switch on={m.canSeePhones} onChange={(v) => set(m.id, { canSeePhones: v })} label={`${m.name} can see phone numbers`} /></label>
            </div>
          </div>
        ))}
        <div className="border-t border-line pt-3 mt-1">
          <div className="text-sm font-bold text-ink mb-2">Add a helper</div>
          <p className="text-xs text-muted mb-2">They need their own Mepluge professional account. Enter the phone number they signed up with.</p>
          <PhoneInput country={country} onCountryChange={setCountry} value={phone} onChange={setPhone} />
          {msg && <p className="text-sm mt-2 text-muted-strong">{msg}</p>}
          <button onClick={add} disabled={busy || !phone.trim()} className="mt-2 px-4 py-2 rounded-full bg-violet text-white text-sm font-bold disabled:opacity-40">{busy ? "Adding…" : "Add to my team"}</button>
        </div>
      </div>

      <div className="bg-card border border-line rounded-2xl p-4"><ApprenticesPanel /></div>

      <div className="bg-card border border-line rounded-2xl p-4">
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Who opened which customer card</div>
        {activity.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : activity.slice(0, 30).map((a, i) => (
          <div key={i} className="text-sm py-1.5 border-b border-line last:border-0"><b>{a.staff}</b> opened <b>{a.customer}</b>'s card <span className="text-muted">· {when(a.at)}</span></div>
        ))}
      </div>
    </div>
  );
}
