"use client";
import { useState } from "react";
import { shareLookCard } from "../lib/lookCard";

// One tap: a beautiful card for WhatsApp Status or Instagram, linking to
// booking this exact look.
export default function ShareLookButton({ photo, title, byline, place, price, link, kicker, label = "Share to Status", className }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const go = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await shareLookCard({ photo, title, byline, place, price, link, kicker });
      if (r === "saved") setMsg("Image saved and link copied: post it on your Status.");
    } catch (e) { setMsg("Couldn't make the card on this device."); }
    finally { setBusy(false); }
  };
  if (!photo) return null;
  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={go} disabled={busy}
        className={className || "px-3 py-1.5 rounded-full bg-hibiscus text-white text-xs font-bold disabled:opacity-50"}>
        {busy ? "Making your card…" : `✦ ${label}`}
      </button>
      {msg && <span className="text-[11px] text-muted mt-1">{msg}</span>}
    </span>
  );
}
