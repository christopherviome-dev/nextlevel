"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";
const sub = (cb) => { const mq = window.matchMedia(REDUCED); mq.addEventListener("change", cb); return () => mq.removeEventListener("change", cb); };

// A Look Reel: the angles fade into each other like a short video. Tap to
// pause and look closely. Reduced-motion users get a still, step-through set.
export default function ReelPlayer({ frames, interval = 600, alt = "Look" }) {
  const reduced = useSyncExternalStore(sub, () => window.matchMedia(REDUCED).matches, () => true);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const playing = !paused && !reduced && frames.length > 1;
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI((x) => (x + 1) % frames.length), interval);
    return () => clearInterval(t);
  }, [playing, frames.length, interval]);
  const step = (d) => setI((x) => (x + d + frames.length) % frames.length);
  return (
    <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-black select-none">
      {frames.map((f, k) => (
        <img key={k} src={f} alt={k === i ? `${alt}: angle ${k + 1} of ${frames.length}` : ""} aria-hidden={k !== i}
          className={"absolute inset-0 w-full h-full object-cover transition-opacity duration-300 " + (k === i ? "opacity-100" : "opacity-0")} draggable={false} />
      ))}
      <div className="absolute top-2 inset-x-2 flex gap-1" aria-hidden>
        {frames.map((_, k) => <span key={k} className={"h-1 flex-1 rounded-full " + (k <= i ? "bg-white" : "bg-white/40")} />)}
      </div>
      <button type="button" onClick={() => setPaused(!paused)} className="absolute inset-0" aria-label={playing ? "Pause" : "Play"} />
      {(!playing) && frames.length > 1 && (
        <>
          <button type="button" onClick={() => step(-1)} aria-label="Previous angle" className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white text-xl">‹</button>
          <button type="button" onClick={() => step(1)} aria-label="Next angle" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white text-xl">›</button>
        </>
      )}
      <span className="absolute bottom-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/55 text-white">{i + 1}/{frames.length}{paused ? " · paused" : ""}</span>
    </div>
  );
}
