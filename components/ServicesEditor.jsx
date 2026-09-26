"use client";
import { useState } from "react";
import { apiFetch } from "../lib/api";
import { fitImage } from "../lib/image";
import { formatMoney, currencySymbol } from "../lib/money";
import { EmptyState } from "./States";

const MAX_SERVICES = 40; // matches the server's limit
const WORK_PHOTO = { maxDim: 1000, maxChars: 290 * 1024 }; // server cap is 300 KB
// Small version for Discover, so customers browsing use little mobile data.
const WORK_THUMB = { maxDim: 360, maxChars: 55 * 1024 }; // server cap is 60 KB

export default function ServicesEditor({ account, onSaved }) {
  const services = account.styles || [];
  const [editing, setEditing] = useState(null); // a service id, "new", or null
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const run = async (id, fn) => {
    setBusyId(id); setError(null);
    try { await fn(); await onSaved(); } catch (e) { setError(e.message); } finally { setBusyId(null); }
  };
  const toggle = (s) => run(s.id, () => apiFetch(`/stylists/me/styles/${s.id}`, { method: "PUT", body: JSON.stringify({ active: s.active === false }) }));
  const remove = (s) => {
    if (!window.confirm(`Delete "${s.name}"? This can't be undone. (To just hide it for now, use "Hide" instead.)`)) return;
    run(s.id, () => apiFetch(`/stylists/me/styles/${s.id}`, { method: "DELETE" }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="text-sm text-muted">{services.length} of {MAX_SERVICES} services</div>
        {editing !== "new" && services.length < MAX_SERVICES && (
          <button onClick={() => setEditing("new")} className="px-4 py-2 rounded-full bg-hibiscus text-white text-sm font-bold">+ Add a service</button>
        )}
      </div>
      {error && <p className="text-sm text-bad-fg mb-3">{error}</p>}

      {editing === "new" && (
        <ServiceForm currency={account.currency}
          onCancel={() => setEditing(null)}
          onSubmit={async (data) => {
            await apiFetch("/stylists/me/styles", { method: "POST", body: JSON.stringify(data) });
            setEditing(null); await onSaved();
          }} />
      )}

      {services.length === 0 && editing !== "new" && (
        <EmptyState title="No services yet"
          hint="Add what you offer, with a price and a photo of your work. Shops with real photos get approved and booked faster."
          actionLabel="Add your first service" onAction={() => setEditing("new")} />
      )}

      <div className="space-y-2">
        {services.map((s) => editing === s.id ? (
          <ServiceForm key={s.id} initial={s} currency={account.currency}
            onCancel={() => setEditing(null)}
            onSubmit={async (data) => {
              await apiFetch(`/stylists/me/styles/${s.id}`, { method: "PUT", body: JSON.stringify(data) });
              setEditing(null); await onSaved();
            }} />
        ) : (
          <div key={s.id} className={"bg-card border border-line rounded-2xl p-3 flex gap-3 items-center " + (s.active === false ? "opacity-60" : "")}>
            {s.photo
              ? <img src={s.photo} alt="" className="w-16 h-16 rounded-xl object-cover border border-line shrink-0" />
              : <div className="w-16 h-16 rounded-xl bg-surface-2 border border-line shrink-0 flex items-center justify-center text-[10px] text-muted text-center px-1">No photo</div>}
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{s.name}{s.active === false && <span className="ml-2 text-xs font-semibold text-warn-fg">Hidden</span>}</div>
              <div className="text-sm text-muted">{formatMoney(s.price, account.currency)}{s.duration ? ` · ${s.duration}` : ""}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 shrink-0">
              <button onClick={() => setEditing(s.id)} disabled={busyId === s.id} className="px-3 py-1.5 rounded-full border border-line text-xs font-bold">Edit</button>
              <button onClick={() => toggle(s)} disabled={busyId === s.id} className="px-3 py-1.5 rounded-full border border-line text-xs font-bold">{s.active === false ? "Show" : "Hide"}</button>
              <button onClick={() => remove(s)} disabled={busyId === s.id} className="px-3 py-1.5 rounded-full border border-bad-line text-bad-fg text-xs font-bold">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceForm({ initial, onSubmit, onCancel, currency }) {
  const [name, setName] = useState(initial ? initial.name : "");
  const [price, setPrice] = useState(initial ? String(initial.price ?? "") : "");
  const [duration, setDuration] = useState(initial ? initial.duration || "" : "");
  const [desc, setDesc] = useState(initial ? initial.desc || "" : "");
  const [photo, setPhoto] = useState(undefined); // undefined = unchanged, null = remove
  const [thumb, setThumb] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const shownPhoto = photo === undefined ? (initial && initial.photo) : photo;
  const priceOk = price.trim() !== "" && !Number.isNaN(Number(price)) && Number(price) >= 0;
  const canSave = name.trim().length >= 2 && priceOk && !busy;

  const choosePhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const [full, small] = await Promise.all([fitImage(file, WORK_PHOTO), fitImage(file, WORK_THUMB)]);
      setPhoto(full); setThumb(small);
    } catch (err) { setError(err.message); }
  };

  const submit = async () => {
    setBusy(true); setError(null);
    const data = { name, price, duration, desc };
    if (photo !== undefined) { data.photo = photo; if (photo) data.photoThumb = thumb; }
    try { await onSubmit(data); } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="bg-card border-2 border-hibiscus rounded-2xl p-4 space-y-3 mb-2">
      <div className="font-bold">{initial ? "Edit service" : "New service"}</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Service name, e.g. Knotless braids" className="w-full px-4 py-3 rounded-xl border border-line sm:col-span-2" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" inputMode="decimal" min="0" step="any" placeholder={`Price (${currencySymbol(currency)})`} className="w-full px-4 py-3 rounded-xl border border-line" />
        <input value={duration} onChange={(e) => setDuration(e.target.value)} maxLength={30} placeholder="How long, e.g. 3 hours" className="w-full px-4 py-3 rounded-xl border border-line" />
      </div>
      {price && !priceOk && <p className="text-xs text-bad-fg">Enter a price of 0 or more.</p>}
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} rows={2} placeholder="Short description (optional)" className="w-full px-4 py-3 rounded-xl border border-line" />
      <div>
        <div className="text-sm font-bold mb-1">Photo of your work</div>
        {shownPhoto && <img src={shownPhoto} alt="" className="w-32 h-32 object-cover rounded-xl border border-line mb-1" />}
        <input type="file" accept="image/*" onChange={choosePhoto} className="block text-sm" />
        {shownPhoto && <button type="button" onClick={() => { setPhoto(null); setThumb(null); }} className="text-xs text-hibiscus-deep underline mt-1">Remove photo</button>}
        <p className="text-xs text-muted mt-1">Only photos of work you did yourself.</p>
      </div>
      {error && <p className="text-sm text-bad-fg">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={!canSave} className="px-5 py-2.5 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">{busy ? "Saving…" : "Save service"}</button>
        <button onClick={onCancel} disabled={busy} className="px-5 py-2.5 rounded-full border border-line font-bold">Cancel</button>
      </div>
    </div>
  );
}
