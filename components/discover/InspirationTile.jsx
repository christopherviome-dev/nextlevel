"use client";
import { useState } from "react";

// A style from the inspiration library. Always labelled "Inspiration": these
// photos are credited stock images, never a Sheeba professional's work.
export default function InspirationTile({ style, photo, onOpen }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null; // photo not downloaded yet: show nothing rather than a broken image
  return (
    <button type="button" onClick={onOpen} className="w-36 sm:w-44 shrink-0 snap-start text-left relative rounded-2xl overflow-hidden border border-line bg-surface-2"
      aria-label={`${style.name}: see professionals who do this style`}>
      <img src={photo.src} alt="" loading="lazy" onError={() => setBroken(true)} className="w-full aspect-[4/5] object-cover" />
      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/55 text-white">Inspiration</span>
      <div className="absolute inset-x-0 bottom-0 p-2 pt-8 text-white" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))" }}>
        <div className="text-sm font-bold truncate">{style.name}</div>
      </div>
    </button>
  );
}
