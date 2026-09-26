"use client";
import { useState, useRef, useSyncExternalStore } from "react";
import WorkTile from "./WorkTile";
import { likeKey } from "../../lib/clientId";

// Live Mode for Discover: real, recent work drifting slowly across the top.
// Rules from the interface plan: never interrupt. It pauses on hover, touch
// or keyboard focus, disappears entirely in search (focus) mode, and never
// moves for people who ask their device for reduced motion.
const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (cb) => { const mq = window.matchMedia(REDUCED); mq.addEventListener("change", cb); return () => mq.removeEventListener("change", cb); };

export default function LiveStrip({ items, onOpen, likedIds, onLike }) {
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => true);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef(null);
  if (items.length < 4) return null; // not enough real work yet to feel alive: show nothing rather than repeat

  const pause = () => { clearTimeout(resumeTimer.current); setPaused(true); };
  const resumeSoon = (ms) => { clearTimeout(resumeTimer.current); resumeTimer.current = setTimeout(() => setPaused(false), ms); };

  const tile = (item, hidden) => (
    <WorkTile key={(hidden ? "b-" : "a-") + item.shop._id + item.id} item={item} fixed hidden={hidden}
      onOpen={onOpen} liked={likedIds.has(likeKey(item))} onLike={onLike} />
  );

  return (
    <section aria-label="Live on Sheeba" className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          {!reduced && <span className="absolute inline-flex h-full w-full rounded-full bg-hibiscus opacity-60 motion-safe:animate-ping" />}
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-hibiscus" />
        </span>
        <h2 className="font-display font-extrabold text-lg text-ink">Fresh work on Sheeba</h2>
      </div>
      {reduced ? (
        <div className="flex gap-3 overflow-x-auto snap-x no-scrollbar pb-1">{items.map((i) => tile(i, false))}</div>
      ) : (
        <div className="overflow-hidden -mx-5 px-5"
          onMouseEnter={pause} onMouseLeave={() => resumeSoon(300)}
          onFocus={pause} onBlur={() => resumeSoon(300)}
          onTouchStart={pause} onTouchEnd={() => resumeSoon(4000)}>
          {/* Two copies side by side make the drift loop seamlessly; the copy is hidden from screen readers. */}
          <div className={"flex gap-3 w-max live-drift" + (paused ? " live-drift-paused" : "")} style={{ "--drift-seconds": `${Math.max(30, items.length * 6)}s` }}>
            {items.map((i) => tile(i, false))}
            {items.map((i) => tile(i, true))}
          </div>
        </div>
      )}
    </section>
  );
}
