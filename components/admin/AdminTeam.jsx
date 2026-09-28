"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import { toE164 } from "../../lib/countries";
import { ROLES } from "../../lib/adminRoles";
import PhoneInput from "../PhoneInput";

// Super admins only: who is on the admin team, and what each may do.
export default function AdminTeam({ country = "GH", onChanged }) {
  const [data, setData] = useState(null);
  const [phone, setPhone] = useState("");
  const [cc, setCc] = useState(country);
  const [role, setRole] = useState("SUPPORT");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { apiFetch("/admin/team").then(setData).catch((e) => setMsg(e.message)); }, []);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => { setBusy(true); setMsg(null); try { await fn(); if (ok) setMsg(ok); load(); if (onChanged) onChanged(); } catch (e) { setMsg(e.message); } finally { setBusy(false); } };
  const change = (m, to) => run(() => apiFetch(`/admin/team/${m.id}`, { method: "PUT", body: JSON.stringify({ role: to }) }), to ? `${m.name} is now ${ROLES[to].label}.` : `${m.name} is no longer on the admin team.`);
  const add = () => {
    const p = toE164(phone, cc);
    if (!p.ok) { setMsg(p.error); return; }
    run(async () => { const r = await apiFetch("/admin/team", { method: "POST", body: JSON.stringify({ phone: p.value, role }) }); setPhone(""); return r; }, "Added to the admin team.");
  };
  return (
    <div className="space-y-4">
      <div className="bg-card border border-line rounded-2xl p-4">
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-3">Roles</div>
        {Object.entries(ROLES).map(([k, r]) => <div key={k} className="text-sm py-1"><b className="text-ink">{r.label}:</b> <span className="text-muted-strong">{r.about}</span></div>)}
        <p className="text-xs text-muted mt-2">Roles are checked on every action, so a change takes effect on the person's very next click. There must always be at least one super admin.</p>
      </div>
      <div className="bg-card border border-line rounded-2xl p-4">
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">The admin team</div>
        {!data && <p className="text-sm text-muted">Loading…</p>}
        {data && data.team.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-3 py-3 border-t border-line first:border-0">
            {m.photo ? <img src={m.photo} alt="" className="w-10 h-10 rounded-full object-cover" /> : <span className="w-10 h-10 rounded-full bg-violet text-white font-bold flex items-center justify-center">{m.name.slice(0, 1).toUpperCase()}</span>}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-ink truncate">{m.name}{m.you ? " (you)" : ""}</div>
              <div className="text-xs text-muted truncate">{[m.shop, m.phone].filter(Boolean).join(" · ")}</div>
            </div>
            <select value={m.role} disabled={busy} onChange={(e) => change(m, e.target.value)} aria-label={`${m.name}'s role`} className="px-2 py-1.5 rounded-lg border border-line bg-card text-sm">
              {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
            </select>
            <button disabled={busy} onClick={() => window.confirm(`Remove ${m.name} from the admin team? Their access ends immediately.`) && change(m, null)} className="text-xs font-bold text-bad-fg underline">Remove</button>
          </div>
        ))}
      </div>
      <div className="bg-card border border-line rounded-2xl p-4 space-y-2">
        <div className="text-sm font-bold text-ink">Add someone</div>
        <p className="text-xs text-muted">They need their own Sheeba professional account. Enter the phone number they signed up with.</p>
        <PhoneInput country={cc} onCountryChange={setCc} value={phone} onChange={setPhone} />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role" className="w-full px-3 py-2 rounded-xl border border-line bg-card">
          {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}: {r.about}</option>)}
        </select>
        <button onClick={add} disabled={busy || !phone.trim()} className="px-4 py-2 rounded-full bg-violet text-white text-sm font-bold disabled:opacity-40">Add to the admin team</button>
      </div>
      {msg && <p className="text-sm text-muted-strong">{msg}</p>}
    </div>
  );
}
