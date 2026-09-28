"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../lib/api";

export const CHANNELS = [["WHATSAPP", "WhatsApp"], ["INSTAGRAM", "Instagram"], ["TIKTOK", "TikTok"], ["FACEBOOK", "Facebook"], ["BUSINESS_CARD", "Business card"], ["QR_POSTER", "Flyer or poster"], ["DIRECT_LINK", "Direct message"], ["OTHER", "Other"]];
const NAME = Object.fromEntries(CHANNELS);

// A separate link for each place a professional shares their shop, so they
// can see which one actually brings visits and bookings.
export default function MarketingLinks({ account }) {
  const [links, setLinks] = useState(null);
  const [label, setLabel] = useState("");
  const [channel, setChannel] = useState("WHATSAPP");
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(null);
  const load = useCallback(() => { apiFetch("/stylists/me/referrals").then(setLinks).catch(() => setLinks([])); }, []);
  useEffect(() => { load(); }, [load]);
  const url = (code) => `${window.location.origin}/shop/${account._id}?ref=${encodeURIComponent(code)}`;
  const create = async () => {
    setMsg(null);
    try { await apiFetch("/stylists/me/referrals", { method: "POST", body: JSON.stringify({ label: label || `${NAME[channel]} link`, channel }) }); setLabel(""); load(); }
    catch (e) { setMsg(e.message); }
  };
  const toggle = async (l) => { await apiFetch(`/stylists/me/referrals/${l._id}`, { method: "PUT", body: JSON.stringify({ active: !l.active }) }); load(); };
  const share = async (l) => {
    const u = url(l.code);
    try { if (navigator.share) await navigator.share({ title: account.salonName || account.name, url: u }); else { await navigator.clipboard.writeText(u); setCopied(l._id); } } catch (e) { /* closed */ }
  };
  return (
    <div className="bg-card border border-line rounded-2xl p-4 space-y-3">
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase">Your links</div>
        <p className="text-sm text-muted mt-1">Use a different link for each place you share your shop, and see which one brings visits and bookings.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Where you'll share it" className="px-3 py-2 rounded-xl border border-line bg-surface text-sm">{CHANNELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder='Name (e.g. "WhatsApp status, October")' className="flex-1 min-w-[10rem] px-3 py-2 rounded-xl border border-line bg-surface text-sm" />
        <button onClick={create} className="px-4 py-2 rounded-full bg-violet text-white text-sm font-bold">Make a link</button>
      </div>
      {msg && <p className="text-sm text-bad-fg">{msg}</p>}
      {links && links.length === 0 && <p className="text-sm text-muted">No links yet.</p>}
      {links && links.map((l) => (
        <div key={l._id} className={"border-t border-line pt-3 " + (l.active ? "" : "opacity-60")}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold text-ink truncate">{l.label}</div>
              <div className="text-xs text-muted">{NAME[l.channel] || "Other"}{l.active ? "" : " · switched off"}</div>
            </div>
            <div className="text-right text-sm shrink-0"><b className="text-ink">{l.visits}</b> <span className="text-muted">visits</span> · <b className="text-ok-fg">{l.requests}</b> <span className="text-muted">bookings</span></div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {l.active && <button onClick={() => share(l)} className="px-3 py-1.5 rounded-full bg-hibiscus text-white text-xs font-bold">{copied === l._id ? "✓ Link copied" : "Share this link"}</button>}
            <button onClick={() => toggle(l)} className="px-3 py-1.5 rounded-full border border-line text-xs font-bold text-plum">{l.active ? "Switch off" : "Switch on"}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
