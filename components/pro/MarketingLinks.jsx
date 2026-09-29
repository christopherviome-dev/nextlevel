"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../lib/api";

export const CHANNELS = [["WHATSAPP", "WhatsApp"], ["INSTAGRAM", "Instagram"], ["TIKTOK", "TikTok"], ["FACEBOOK", "Facebook"], ["QR_POSTER", "Flyer or poster"], ["OTHER", "Somewhere else"]];
const NAME = { ...Object.fromEntries(CHANNELS), BUSINESS_CARD: "Business card", DIRECT_LINK: "Direct message" };

// Stupidly simple: tap where you'll share your shop. Sheeba makes (or reuses) a
// link for that place and opens sharing; each place's visits and bookings are counted.
export default function MarketingLinks({ account }) {
  const [links, setLinks] = useState(null);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const load = useCallback(() => apiFetch("/stylists/me/referrals").then((l) => { setLinks(l); return l; }).catch(() => { setLinks([]); return []; }), []);
  useEffect(() => { load(); }, [load]);
  const share = async (channel) => {
    setBusy(channel); setMsg(null);
    try {
      let link = (links || []).find((l) => l.channel === channel && l.active);
      if (!link) { await apiFetch("/stylists/me/referrals", { method: "POST", body: JSON.stringify({ label: NAME[channel], channel }) }); link = (await load()).find((l) => l.channel === channel && l.active); }
      const url = `${window.location.origin}/shop/${account._id}?ref=${encodeURIComponent(link.code)}`;
      if (navigator.share) { try { await navigator.share({ title: account.salonName || account.name, url }); } catch (e) { /* closed */ } }
      else { await navigator.clipboard.writeText(url); setMsg(`✓ Your ${NAME[channel]} link is copied. Paste it there.`); }
    } catch (e) { setMsg(e.message); }
    setBusy(null);
  };
  const used = (links || []).filter((l) => l.visits > 0 || l.requests > 0 || l.active);
  return (
    <div className="bg-card border border-line rounded-2xl p-4 space-y-3">
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase">Share your shop</div>
        <p className="text-sm text-muted mt-1">Tap where you'll share it. We'll count the visits and bookings from each place.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {CHANNELS.map(([k, l]) => (
          <button key={k} onClick={() => share(k)} disabled={!!busy} className="px-4 py-2 rounded-full bg-violet text-white text-sm font-bold disabled:opacity-60">{busy === k ? "…" : l}</button>
        ))}
      </div>
      {msg && <p className="text-sm text-muted-strong">{msg}</p>}
      {used.length > 0 && (
        <div className="border-t border-line pt-3 space-y-1.5">
          {used.map((l) => (
            <div key={l._id} className="flex justify-between gap-2 text-sm">
              <span className="text-ink truncate">{l.label && l.label !== NAME[l.channel] ? l.label : NAME[l.channel] || "Other"}</span>
              <span className="whitespace-nowrap"><b>{l.visits}</b> <span className="text-muted">visits</span> · <b className="text-ok-fg">{l.requests}</b> <span className="text-muted">bookings</span></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
