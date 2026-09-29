"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";

// A look's photos: swipe left/right on phones, arrows on laptops, dots and a
// counter. Extra photos load only when the look is opened (reelUrl).
export default function SwipePhotos({ first, alt, reelUrl, children }) {
  const [frames, setFrames] = useState([]);
  const [i, setI] = useState(0);
  const box = useRef(null);
  useEffect(() => {
    let on = true;
    if (reelUrl) apiFetch(reelUrl).then((r) => { if (on && r && Array.isArray(r.frames)) setFrames(r.frames); }).catch(() => {});
    return () => { on = false; };
  }, [reelUrl]);
  const photos = [first, ...frames].filter(Boolean);
  const onScroll = () => { const el = box.current; if (el && el.clientWidth) setI(Math.round(el.scrollLeft / el.clientWidth)); };
  const go = (n) => { const el = box.current; if (el) el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" }); };
  return (
    <div className="relative rounded-2xl overflow-hidden bg-surface-2">
      <div ref={box} onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar" aria-label={photos.length > 1 ? `${photos.length} photos: swipe to see them all` : undefined}>
        {photos.map((p, n) => <img key={n} src={p} alt={n === 0 ? alt : `${alt}, photo ${n + 1}`} className="w-full shrink-0 snap-center max-h-96 object-cover" />)}
      </div>
      {photos.length > 1 && (
        <>
          <div className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full bg-black/60 text-white">{i + 1}/{photos.length}</div>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
            {photos.map((_, n) => <span key={n} className={"w-1.5 h-1.5 rounded-full " + (n === i ? "bg-white" : "bg-white/50")} />)}
          </div>
          {i > 0 && <button type="button" onClick={() => go(i - 1)} aria-label="Previous photo" className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white text-xl items-center justify-center">‹</button>}
          {i < photos.length - 1 && <button type="button" onClick={() => go(i + 1)} aria-label="Next photo" className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white text-xl items-center justify-center">›</button>}
        </>
      )}
      {children}
    </div>
  );
}
