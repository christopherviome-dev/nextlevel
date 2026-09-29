"use client";
import { useState } from "react";
import { apiFetch } from "../lib/api";
import { fitImage } from "../lib/image";

const WORK_PHOTO = { maxDim: 1000, maxChars: 290 * 1024 };
const WORK_THUMB = { maxDim: 360, maxChars: 55 * 1024 };

// Stupidly simple bulk add: pick many photos from the phone (e.g. saved from
// Instagram or WhatsApp), say what each one is and its price, add them all.
export default function BulkAddServices({ serviceOptions, room, currency, onDone, onCancel }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const styles = serviceOptions.flatMap((sv) => (sv.styles || []).map((st) => ({ ...st, serviceKey: sv.key, serviceName: sv.name })));
  const pick = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, Math.min(10, room)); e.target.value = "";
    setBusy("Preparing photos…");
    const made = await Promise.all(files.map(async (f) => { const [photo, thumb] = await Promise.all([fitImage(f, WORK_PHOTO), fitImage(f, WORK_THUMB)]); return { photo, thumb, name: "", price: "", styleKey: "", serviceKey: serviceOptions[0] ? serviceOptions[0].key : null }; }));
    setRows(made); setBusy(null);
  };
  const set = (i, patch) => setRows((r) => r.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  const ready = rows.length > 0 && rows.every((r) => r.name.trim() && r.price !== "" && Number(r.price) >= 0);
  const addAll = async () => {
    setError(null);
    for (let i = 0; i < rows.length; i++) {
      setBusy(`Adding ${i + 1} of ${rows.length}…`);
      const r = rows[i];
      try { await apiFetch("/stylists/me/styles", { method: "POST", body: JSON.stringify({ name: r.name.trim(), price: r.price, serviceKey: r.serviceKey, styleKey: r.styleKey || null, photo: r.photo, photoThumb: r.thumb }) }); }
      catch (err) { setError(`Photo ${i + 1}: ${err.message}`); setRows((x) => x.slice(i)); setBusy(null); await onDone(false); return; }
    }
    setBusy(null); await onDone(true);
  };
  return (
    <div className="bg-card border-2 border-hibiscus rounded-2xl p-4 space-y-3 mb-3">
      <div className="font-bold text-ink">Add many at once</div>
      {rows.length === 0 && (
        <>
          <p className="text-sm text-muted">Pick up to {Math.min(10, room)} photos of your work from your phone, for example ones you saved from Instagram, TikTok or WhatsApp.</p>
          <label className="inline-block px-4 py-2 rounded-full bg-violet text-white text-sm font-bold cursor-pointer">
            <input type="file" accept="image/*" multiple onChange={pick} className="sr-only" />📷 Choose photos
          </label>
        </>
      )}
      {rows.map((r, i) => (
        <div key={i} className="flex gap-3 items-start border-t border-line pt-3">
          <img src={r.thumb} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <select value={r.styleKey} aria-label="What is it?" onChange={(e) => { const st = styles.find((x) => x.key === e.target.value); set(i, st ? { styleKey: st.key, serviceKey: st.serviceKey, name: r.name || st.name } : { styleKey: "" }); }}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-sm">
              <option value="">What is it?</option>
              {serviceOptions.map((sv) => <optgroup key={sv.key} label={sv.name}>{(sv.styles || []).map((st) => <option key={st.key} value={st.key}>{st.name}</option>)}</optgroup>)}
            </select>
            <div className="flex gap-2">
              <input value={r.name} onChange={(e) => set(i, { name: e.target.value.slice(0, 60) })} placeholder="Name" className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-line bg-surface text-sm" />
              <input value={r.price} onChange={(e) => set(i, { price: e.target.value.replace(/[^0-9.]/g, "") })} inputMode="decimal" placeholder={`Price (${currency || "GHS"})`} className="w-28 px-3 py-2 rounded-xl border border-line bg-surface text-sm" />
            </div>
          </div>
          <button type="button" onClick={() => setRows((x) => x.filter((_, n) => n !== i))} aria-label="Remove this photo" className="text-muted text-lg px-1">×</button>
        </div>
      ))}
      {error && <p className="text-sm text-bad-fg">{error}</p>}
      {busy && <p className="text-sm text-muted">{busy}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} disabled={!!busy} className="px-4 py-2 rounded-full border border-line text-sm font-bold text-plum">Cancel</button>
        {rows.length > 0 && <button type="button" onClick={addAll} disabled={!ready || !!busy} className="px-4 py-2 rounded-full bg-hibiscus text-white text-sm font-bold disabled:opacity-50">Add all {rows.length}</button>}
      </div>
      {rows.length > 0 && !ready && <p className="text-xs text-muted text-right">Each photo needs a name and a price.</p>}
    </div>
  );
}
