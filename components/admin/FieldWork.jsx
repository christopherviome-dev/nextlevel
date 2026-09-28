"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import { fitImage } from "../../lib/image";
import { useCatalog } from "../../lib/catalog";
import { queueStop, flush, pending, newKey } from "../../lib/fieldQueue";
import FieldMap, { OUTCOME } from "./FieldMap";

const GH_REGIONS = ["Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East", "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North"];
const PHOTO = { maxDim: 900, maxChars: 95 * 1024 };
const Stat = ({ n, label }) => <div className="bg-card border border-line rounded-2xl p-3 text-center"><div className="text-2xl font-extrabold text-ink">{n}</div><div className="text-xs text-muted">{label}</div></div>;

// Field work: trips out signing shops up in person. Built for a phone in one
// hand at a shop's door: big buttons, location captured automatically, and
// stops saved even without network.
export default function FieldWork() {
  const [trips, setTrips] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ name: "", area: "", region: "Greater Accra" });
  const [error, setError] = useState(null);
  const load = useCallback(() => { apiFetch("/field/trips").then(setTrips).catch((e) => setError(e.message)); }, []);
  useEffect(() => { load(); }, [load]);
  const start = async () => {
    setError(null);
    try { const t = await apiFetch("/field/trips", { method: "POST", body: JSON.stringify(form) }); setForm({ ...form, name: "" }); setOpenId(t._id); load(); }
    catch (e) { setError(e.message); }
  };
  if (openId) return <Trip id={openId} onBack={() => { setOpenId(null); load(); }} />;
  return (
    <div className="space-y-4">
      <div className="bg-card border border-line rounded-2xl p-4 space-y-2">
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase">Start a trip</div>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} placeholder='e.g. "Kasoa, Saturday"' className="w-full px-4 py-3 rounded-xl border border-line bg-surface" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} maxLength={60} placeholder="Town or area" className="px-4 py-3 rounded-xl border border-line bg-surface" />
          <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="px-3 py-3 rounded-xl border border-line bg-surface">{GH_REGIONS.map((r) => <option key={r}>{r}</option>)}</select>
        </div>
        {error && <p className="text-sm text-bad-fg">{error}</p>}
        <button onClick={start} disabled={form.name.trim().length < 2} className="w-full py-3 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">Start the trip</button>
      </div>
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Your trips</div>
        {trips && trips.length === 0 && <p className="text-sm text-muted">No trips yet. Your first one will show here.</p>}
        {trips && trips.map((t) => (
          <button key={t._id} onClick={() => setOpenId(t._id)} className="w-full text-left bg-card border border-line rounded-2xl p-4 mb-2">
            <div className="flex justify-between gap-2"><b className="text-ink">{t.name}</b><span className="text-xs text-muted">{new Date(t.startedAt).toLocaleDateString()}{t.endedAt ? "" : " · in progress"}</span></div>
            <div className="text-sm text-muted-strong mt-1">{[t.area, t.region].filter(Boolean).join(", ")} · {t.stats.stops} stops · <b className="text-ok-fg">{t.stats.signedUp} signed up</b>{t.stats.conversion != null ? ` (${t.stats.conversion}%)` : ""} · {t.stats.km} km</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Trip({ id, onBack }) {
  const catalog = useCatalog();
  const [data, setData] = useState(null);
  const [adding, setAdding] = useState(false);
  const [waiting, setWaiting] = useState(0);
  const [msg, setMsg] = useState(null);
  const load = useCallback(() => { apiFetch(`/field/trips/${id}`).then(setData).catch((e) => setMsg(e.message)); }, [id]);
  useEffect(() => {
    load();
    const count = () => setWaiting(pending().filter((p) => p.tripId === id).length);
    count();
    window.addEventListener("sheeba:field-queue", count);
    const t = setInterval(() => { flush().then(load); }, 30000); // keep trying while the page is open
    return () => { window.removeEventListener("sheeba:field-queue", count); clearInterval(t); };
  }, [id, load]);
  const end = async () => { if (!window.confirm("End this trip?")) return; await apiFetch(`/field/trips/${id}`, { method: "PUT", body: JSON.stringify({ end: true }) }); load(); };
  const link = async (v) => {
    const phone = window.prompt(`${v.placeName}: the phone number they signed up with`);
    if (!phone) return;
    try { await apiFetch(`/field/visits/${v._id}`, { method: "PUT", body: JSON.stringify({ linkPhone: phone }) }); load(); }
    catch (e) { setMsg(e.message); }
  };
  if (!data) return <p className="text-muted">{msg || "Loading…"}</p>;
  const { trip, visits, stats } = data;
  const lastArea = visits.length ? visits[visits.length - 1].area : trip.area;
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm font-bold text-hibiscus-deep">‹ All trips</button>
      <div>
        <div className="font-display font-extrabold text-xl text-ink">{trip.name}</div>
        <div className="text-sm text-muted">{[trip.area, trip.region].filter(Boolean).join(", ")} · {trip.endedAt ? "ended" : "in progress"}</div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Stat n={stats.stops} label="stops" /><Stat n={stats.signedUp} label="signed up" /><Stat n={stats.conversion == null ? "—" : `${stats.conversion}%`} label="conversion" />
        <Stat n={stats.interested} label="to follow up" /><Stat n={stats.km} label="km covered" /><Stat n={stats.hours} label="hours" />
      </div>
      {waiting > 0 && <div className="bg-warn-bg border border-warn-line text-warn-fg rounded-xl p-3 text-sm">📶 {waiting} stop{waiting === 1 ? "" : "s"} saved on this phone, waiting for network. They'll upload by themselves.</div>}
      {msg && <p className="text-sm text-bad-fg">{msg}</p>}
      {!adding && <button onClick={() => setAdding(true)} className="w-full py-4 rounded-full bg-hibiscus text-white text-lg font-bold">+ Log a stop</button>}
      {adding && <LogStop tripId={id} catalog={catalog} defaultArea={lastArea} onDone={(r) => { setAdding(false); setMsg(r && r.errors.length ? r.errors.join(" · ") : null); load(); }} onCancel={() => setAdding(false)} />}
      <FieldMap stops={visits} route />
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Stops</div>
        {visits.length === 0 && <p className="text-sm text-muted">No stops yet.</p>}
        {visits.map((v, i) => (
          <div key={v._id} className="bg-card border border-line rounded-2xl p-3 mb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-ink">{i + 1}. {v.placeName}</div>
                <div className="text-xs text-muted">{new Date(v.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}{v.area ? ` · ${v.area}` : ""}{v.services.length ? ` · ${v.services.join(", ")}` : ""}</div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full text-white shrink-0" style={{ background: OUTCOME[v.outcome].color }}>{OUTCOME[v.outcome].icon} {OUTCOME[v.outcome].label}</span>
            </div>
            {v.note && <p className="text-sm text-ink mt-2 whitespace-pre-line">{v.note}</p>}
            {v.photos.length > 0 && <div className="flex gap-2 mt-2 overflow-x-auto">{v.photos.map((p, k) => <img key={k} src={p} alt={`${v.placeName}, photo ${k + 1}`} className="w-24 h-24 rounded-xl object-cover" />)}</div>}
            <div className="flex flex-wrap gap-3 mt-2 text-xs">
              {v.signedUpStylistId ? <span className="text-ok-fg font-bold">✓ Linked to their Sheeba account</span> : <button onClick={() => link(v)} className="font-bold text-hibiscus-deep underline">They signed up: link their account</button>}
              {v.contactPhone && <a href={`tel:${v.contactPhone}`} className="font-bold text-plum">Call {v.contactPhone}</a>}
            </div>
          </div>
        ))}
      </div>
      {!trip.endedAt && <button onClick={end} className="w-full py-3 rounded-full border border-line font-bold text-plum">End this trip</button>}
    </div>
  );
}

function LogStop({ tripId, catalog, defaultArea, onDone, onCancel }) {
  const [pos, setPos] = useState(null);
  const [posMsg, setPosMsg] = useState("Finding your location…");
  const [s, setS] = useState({ placeName: "", area: defaultArea || "", services: [], outcome: null, note: "", contactPhone: "" });
  const [photos, setPhotos] = useState([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!navigator.geolocation) { setPosMsg("This phone can't share its location."); return; } // eslint-disable-line react-hooks/set-state-in-effect -- device capability
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }); setPosMsg(null); },
      () => setPosMsg("Couldn't get the location (the stop still saves)."),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
    );
  }, []);
  const svc = [...catalog.map((c) => [c.key, c.name]), ["beading", "Beading"], ["other", "Other craft"]];
  const toggle = (k) => setS({ ...s, services: s.services.includes(k) ? s.services.filter((x) => x !== k) : [...s.services, k] });
  const addPhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - photos.length); e.target.value = "";
    try { const out = []; for (const f of files) out.push(await fitImage(f, PHOTO)); setPhotos([...photos, ...out].slice(0, 4)); } catch (err) { setError(err.message); }
  };
  const save = async () => {
    if (photos.length && !consent) { setError("Tick that they agreed to the photos, or remove them."); return; }
    setBusy(true); setError(null);
    const stop = { ...s, clientKey: newKey(), at: Date.now(), lat: pos ? pos.lat : null, lng: pos ? pos.lng : null, photos, photoConsent: consent && photos.length > 0 };
    const r = await queueStop(tripId, stop);
    setBusy(false); onDone(r);
  };
  return (
    <div className="bg-card border-2 border-hibiscus rounded-2xl p-4 space-y-3">
      <div className="text-xs text-muted">{posMsg || `📍 Location captured (±${pos.acc} m)`}</div>
      <input value={s.placeName} onChange={(e) => setS({ ...s, placeName: e.target.value })} maxLength={80} placeholder="Shop's name" autoFocus className="w-full px-4 py-3 rounded-xl border border-line bg-surface text-lg" />
      <input value={s.area} onChange={(e) => setS({ ...s, area: e.target.value })} maxLength={60} placeholder="Area" className="w-full px-4 py-3 rounded-xl border border-line bg-surface" />
      <div className="flex flex-wrap gap-2">{svc.map(([k, l]) => <button key={k} type="button" onClick={() => toggle(k)} aria-pressed={s.services.includes(k)} className={"px-3 py-1.5 rounded-full text-sm font-bold border " + (s.services.includes(k) ? "bg-violet text-white border-violet" : "bg-surface text-plum border-line")}>{l}</button>)}</div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(OUTCOME).map(([k, o]) => (
          <button key={k} type="button" onClick={() => setS({ ...s, outcome: k })} aria-pressed={s.outcome === k}
            className={"py-3 rounded-xl text-sm font-bold border-2 " + (s.outcome === k ? "text-white" : "bg-surface text-ink border-line")} style={s.outcome === k ? { background: o.color, borderColor: o.color } : undefined}>{o.icon} {o.label}</button>
        ))}
      </div>
      <textarea value={s.note} onChange={(e) => setS({ ...s, note: e.target.value })} rows={3} maxLength={1000} placeholder="What they do, how it's done, where the craft comes from…" className="w-full px-4 py-3 rounded-xl border border-line bg-surface" />
      <input value={s.contactPhone} onChange={(e) => setS({ ...s, contactPhone: e.target.value })} maxLength={30} inputMode="tel" placeholder="Their phone, if they gave it (optional)" className="w-full px-4 py-3 rounded-xl border border-line bg-surface" />
      <div>
        <div className="flex flex-wrap gap-2">
          {photos.map((p, k) => <div key={k} className="relative"><img src={p} alt={`Photo ${k + 1}`} className="w-20 h-20 rounded-xl object-cover" /><button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== k))} aria-label="Remove photo" className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs">✕</button></div>)}
          {photos.length < 4 && <label className="w-20 h-20 rounded-xl border-2 border-dashed border-line flex items-center justify-center text-sm text-muted cursor-pointer text-center"><input type="file" accept="image/*" capture="environment" multiple onChange={addPhotos} className="sr-only" />📸<br />Photo</label>}
        </div>
        {photos.length > 0 && <label className="flex items-center gap-2 text-sm mt-2"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-5 h-5" /> They agreed to these photos</label>}
      </div>
      {error && <p className="text-sm text-bad-fg">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={busy || !s.placeName.trim() || !s.outcome} className="flex-1 py-3 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">{busy ? "Saving…" : "Save stop"}</button>
        <button onClick={onCancel} className="px-5 py-3 rounded-full border border-line font-bold">Cancel</button>
      </div>
    </div>
  );
}
