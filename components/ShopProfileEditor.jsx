"use client";
import { useState } from "react";
import { apiFetch } from "../lib/api";
import { fitImage } from "../lib/image";
import { WORK_MODES } from "../lib/shop";
import { useCatalog } from "../lib/catalog";
import { countryInfo } from "../lib/countries";
import { currencySymbol } from "../lib/money";

const AVAILABILITY = [
  ["AVAILABLE", "Available"],
  ["TAKING_REQUESTS", "Taking requests"],
  ["UNAVAILABLE", "Not available right now"],
  ["AWAY", "Away (on holiday, travelling)"],
];
const BIO_MAX = 600;

// Profile photos are small circles; cover photos are wide banners.
const PROFILE_PHOTO = { maxDim: 600, maxChars: 480 * 1024 };
const COVER_PHOTO = { maxDim: 1200, maxChars: 480 * 1024 };

export default function ShopProfileEditor({ account, onSaved }) {
  const [form, setForm] = useState({
    salonName: account.salonName || "",
    name: account.name || "",
    category: account.category || "",
    area: account.area || "",
    city: account.city || "",
    bio: account.bio || "",
    availability: account.availability || "AVAILABLE",
    workModes: account.workModes || [],
    services: account.services && account.services.length ? account.services : [],
  });
  const catalog = useCatalog();
  const [proposal, setProposal] = useState("");
  const [proposing, setProposing] = useState(false);
  const [proposalMsg, setProposalMsg] = useState(null);
  // Photos: undefined = unchanged (not re-sent), null = remove, string = new photo
  const [profilePhoto, setProfilePhoto] = useState(undefined);
  const [coverPhoto, setCoverPhoto] = useState(undefined);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };
  const toggleMode = (m) => set("workModes", form.workModes.includes(m) ? form.workModes.filter((x) => x !== m) : [...form.workModes, m]);
  const toggleService = (k) => set("services", form.services.includes(k) ? form.services.filter((x) => x !== k) : [...form.services, k]);
  // A service that isn't listed: shows on your shop at once, and goes to Sheeba to approve.
  const propose = async () => {
    setProposing(true); setProposalMsg(null); setError(null);
    try {
      const r = await apiFetch("/stylists/me/service-proposals", { method: "POST", body: JSON.stringify({ name: proposal }) });
      setProposalMsg(r.added ? `"${r.name}" is already on Sheeba, so it's been added to your services.` : `"${r.name}" is on your shop now, and Sheeba will review it for everyone.`);
      setProposal("");
      await onSaved();
    } catch (err) { setError(err.message); } finally { setProposing(false); }
  };

  const choose = (setter, spec) => async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow choosing the same file again
    if (!file) return;
    setError(null);
    try { setter(await fitImage(file, spec)); setSaved(false); } catch (err) { setError(err.message); }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { setError("This device can't share its location."); return; }
    setLocating(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); setSaved(false); },
      () => { setError("Couldn't get your location. Check that location access is allowed for this site."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const save = async () => {
    setBusy(true); setError(null);
    const body = { ...form };
    if (profilePhoto !== undefined) body.profilePhoto = profilePhoto;
    if (coverPhoto !== undefined) body.coverPhoto = coverPhoto;
    if (location) { body.lat = location.lat; body.lng = location.lng; }
    try {
      await apiFetch("/stylists/me", { method: "PUT", body: JSON.stringify(body) });
      setProfilePhoto(undefined); setCoverPhoto(undefined); setLocation(null);
      setSaved(true);
      await onSaved();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const shownProfile = profilePhoto === undefined ? account.profilePhoto : profilePhoto;
  const shownCover = coverPhoto === undefined ? account.coverPhoto : coverPhoto;
  const hasLocation = location || (account.location && account.location.lat != null);

  const country = countryInfo(account.country);
  return (
    <div className="space-y-4">
      <div className="text-sm bg-surface rounded-xl px-3 py-2 text-muted-strong">
        {country.name} · prices in {currencySymbol(account.currency || country.currency)}
        <span className="text-muted"> · to change your country, contact Sheeba</span>
      </div>
      <div>
        <label className="block text-sm font-bold mb-1">Profile photo</label>
        <div className="flex items-center gap-3">
          {shownProfile
            ? <img src={shownProfile} alt="Your profile" className="w-20 h-20 rounded-full object-cover border border-line" />
            : <div className="w-20 h-20 rounded-full bg-surface-2 border border-line flex items-center justify-center text-xs text-muted">No photo</div>}
          <div className="space-y-1">
            <input type="file" accept="image/*" onChange={choose(setProfilePhoto, PROFILE_PHOTO)} className="block text-sm" />
            {shownProfile && <button type="button" onClick={() => { setProfilePhoto(null); setSaved(false); }} className="text-xs text-hibiscus-deep underline">Remove photo</button>}
          </div>
        </div>
        <p className="text-xs text-muted mt-1">A clear photo of you, or your shop's logo.</p>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">Cover photo <span className="font-normal text-muted">(optional)</span></label>
        {shownCover && <img src={shownCover} alt="Your cover" className="w-full max-h-40 object-cover rounded-xl border border-line mb-1" />}
        <input type="file" accept="image/*" onChange={choose(setCoverPhoto, COVER_PHOTO)} className="block text-sm" />
        {shownCover && <button type="button" onClick={() => { setCoverPhoto(null); setSaved(false); }} className="text-xs text-hibiscus-deep underline mt-1">Remove cover</button>}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold mb-1">Shop name</label>
          <input value={form.salonName} onChange={(e) => set("salonName", e.target.value)} maxLength={60} placeholder="e.g. Etornam Braids" className="w-full px-4 py-3 rounded-xl border border-line" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Your name</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={60} className="w-full px-4 py-3 rounded-xl border border-line" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">City</label>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={40} placeholder="e.g. Accra, Kumasi, London"
            className="w-full px-4 py-3 rounded-xl border border-line" />
          <p className="text-xs text-muted mt-1">Used to compare prices between cities. Your area (below) is your neighbourhood.</p>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Area</label>
          <input value={form.area} onChange={(e) => set("area", e.target.value)} maxLength={60} placeholder="e.g. Kasoa, Osu, Nsawam" className="w-full px-4 py-3 rounded-xl border border-line" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">Description</label>
        <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} maxLength={BIO_MAX} rows={4}
          placeholder="What you're great at, how long you've been doing it, what customers can expect."
          className="w-full px-4 py-3 rounded-xl border border-line" />
        <div className="text-xs text-muted text-right">{form.bio.length}/{BIO_MAX}</div>
      </div>

      <div>
        <div className="text-sm font-bold mb-1">What I offer</div>
        <div className="flex flex-wrap gap-2">
          {catalog.map((c) => (
            <button type="button" key={c.key} onClick={() => toggleService(c.key)} aria-pressed={form.services.includes(c.key)}
              className={"px-3 py-2 rounded-full border text-sm font-semibold " + (form.services.includes(c.key) ? "bg-violet text-white border-violet" : "bg-card border-line text-plum")}>
              {form.services.includes(c.key) ? "✓ " : ""}{c.name}
            </button>
          ))}
          {(account.pendingServices || []).map((p) => (
            <span key={p.proposalId} className="px-3 py-2 rounded-full border border-warn-line bg-warn-bg text-warn-fg text-sm font-semibold">{p.name} · waiting for approval</span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input value={proposal} onChange={(e) => setProposal(e.target.value)} maxLength={40} placeholder="My service isn't listed: type it"
            className="flex-1 min-w-0 px-4 py-2 rounded-xl border border-line text-sm" />
          <button type="button" onClick={propose} disabled={proposing || proposal.trim().length < 3} className="px-4 py-2 rounded-full border border-line bg-card text-sm font-bold text-plum disabled:opacity-40">Add</button>
        </div>
        {proposalMsg && <p className="text-xs text-ok-fg mt-1">{proposalMsg}</p>}
      </div>

      <div>
        <div className="text-sm font-bold mb-1">How I work</div>
        <div className="flex flex-wrap gap-2">
          {WORK_MODES.map(([k, label]) => (
            <button type="button" key={k} onClick={() => toggleMode(k)} aria-pressed={form.workModes.includes(k)}
              className={"px-3 py-2 rounded-full border text-sm font-semibold " + (form.workModes.includes(k) ? "bg-violet text-white border-violet" : "bg-card border-line text-plum")}>
              {form.workModes.includes(k) ? "✓ " : ""}{label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 items-end">
        <div>
          <label className="block text-sm font-bold mb-1">Availability</label>
          <select value={form.availability} onChange={(e) => set("availability", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-line bg-card">
            {AVAILABILITY.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
        <div>
          <button type="button" onClick={useMyLocation} disabled={locating} className="w-full px-4 py-3 rounded-xl border border-line bg-card text-sm font-bold text-plum">
            {locating ? "Finding you…" : hasLocation ? "📍 Update my location" : "📍 Use my current location"}
          </button>
          <p className="text-xs text-muted mt-1">{location ? "New location ready. Save to keep it." : hasLocation ? "Location saved, so Near Me can find you." : "Lets customers find you with Near Me."}</p>
        </div>
      </div>

      {error && <p className="text-sm text-bad-fg">{error}</p>}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={busy || form.name.trim().length < 2} className="px-6 py-3 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">
          {busy ? "Saving…" : "Save shop details"}
        </button>
        {saved && <span className="text-sm text-ok-fg font-semibold">✓ Saved</span>}
      </div>
    </div>
  );
}
