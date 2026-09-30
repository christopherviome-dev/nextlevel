"use client";
import { useState } from "react";
import { photosFor } from "../../lib/catalog";

// An inspiration style in the feed. Always labelled: these are credited
// photos from free photo sites, never a Mepluge professional's work.
export default function InspirationPost({ styleKey, style, onOpen }) {
  const [broken, setBroken] = useState(false);
  const photo = photosFor(styleKey)[0];
  if (!photo || broken) return null;
  return (
    <article className="bg-card border border-line rounded-3xl p-3 mb-5 md:mb-0 shadow-sm mx-3 sm:mx-0">
            <button type="button" onClick={onOpen} className="block w-full relative rounded-2xl overflow-hidden" aria-label={`${style.name}: see details and who does it`}>
        <img src={photo.src} alt="" loading="lazy" onError={() => setBroken(true)} className="w-full aspect-[4/5] object-cover" />
        <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-card/90 text-plum">✨ Inspiration</span>
      </button>
      <div className="px-1 pt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-ink truncate">{style.name}</div>
          {style.aliases && style.aliases.length > 0 && <div className="text-xs text-muted truncate">Also called {style.aliases.slice(0, 2).join(", ")}</div>}
        </div>
        <button type="button" onClick={onOpen} className="shrink-0 px-4 py-2 rounded-full border border-line bg-card text-sm font-bold text-plum">See who does this</button>
      </div>
    </article>
  );
}
