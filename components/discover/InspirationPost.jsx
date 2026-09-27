"use client";
import { useState } from "react";
import { photosFor } from "../../lib/catalog";

// An inspiration style in the feed. Always labelled: these are credited
// photos from free photo sites, never a Sheeba professional's work.
export default function InspirationPost({ styleKey, style, onOpen }) {
  const [broken, setBroken] = useState(false);
  const photo = photosFor(styleKey)[0];
  if (!photo || broken) return null;
  return (
    <article className="bg-card sm:border sm:border-line sm:rounded-2xl overflow-hidden mb-4 sm:shadow-sm">
      <div className="px-4 py-3 text-sm font-bold text-ink">✨ Inspiration</div>
      <button type="button" onClick={onOpen} className="block w-full relative" aria-label={`${style.name}: see details and who does it`}>
        <img src={photo.src} alt="" loading="lazy" onError={() => setBroken(true)} className="w-full aspect-[4/5] object-cover" />
        <span className="absolute top-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/55 text-white">Inspiration</span>
      </button>
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-ink truncate">{style.name}</div>
          {style.aliases && style.aliases.length > 0 && <div className="text-xs text-muted truncate">Also called {style.aliases.slice(0, 2).join(", ")}</div>}
        </div>
        <button type="button" onClick={onOpen} className="shrink-0 px-4 py-2 rounded-full border border-line bg-card text-sm font-bold text-plum">See who does this</button>
      </div>
    </article>
  );
}
