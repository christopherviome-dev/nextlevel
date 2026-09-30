"use client";
import { useState } from "react";
import Link from "next/link";
import { COMMUNITY } from "../lib/prefs";

// Official brand logos, downloaded from each platform's own brand resources
// into public/brand/ (they're provided for exactly this kind of "join us"
// link). If a file is missing, the name shows instead.
function Brand({ href, src, name }) {
  const [broken, setBroken] = useState(false);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Join the Mepluge community on ${name}`} title={`Join us on ${name}`}
      className="w-9 h-9 rounded-full flex items-center justify-center border border-line bg-card overflow-hidden">
      {broken ? <span className="text-[10px] font-bold text-plum">{name}</span> : <img src={src} alt="" className="w-6 h-6" onError={() => setBroken(true)} />}
    </a>
  );
}

export default function SiteFooter() {
  return (
    <footer className="max-w-xl mx-auto px-5 py-8 flex items-center justify-between gap-4 text-xs text-muted">
      <div className="flex gap-4">
        <Link href="/terms" className="underline">Terms</Link>
        <Link href="/privacy" className="underline">Privacy</Link>
        <Link href="/settings" className="underline">Settings</Link>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline">Join the community</span>
        <Brand href={COMMUNITY.telegram} src="/brand/telegram.svg" name="Telegram" />
        <Brand href={COMMUNITY.whatsapp} src="/brand/whatsapp.svg" name="WhatsApp" />
      </div>
    </footer>
  );
}
