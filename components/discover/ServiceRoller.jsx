"use client";
import { useRef, useState, useSyncExternalStore } from "react";

// Services roll gently across the top by themselves; touching or hovering
// pauses them. People who ask their phone for less motion get a still row.
// The chosen service is pinned at the start so it's always visible.
const REDUCED = "(prefers-reduced-motion: reduce)";
const sub = (cb) => { const mq = window.matchMedia(REDUCED); mq.addEventListener("change", cb); return () => mq.removeEventListener("change", cb); };

export default function ServiceRoller({ services, selected, onSelect }) {
  const reduced = useSyncExternalStore(sub, () => window.matchMedia(REDUCED).matches, () => true);
  const [paused, setPaused] = useState(false);
  const t = useRef(null);
  const pause = () => { clearTimeout(t.current); setPaused(true); };
  const resume = (ms) => { clearTimeout(t.current); t.current = setTimeout(() => setPaused(false), ms); };
  const chosen = services.find((s) => s.key === selected);
  const chip = (s, hidden) => (
    <button key={(hidden ? "b" : "a") + s.key} type="button" tabIndex={hidden ? -1 : 0} aria-hidden={hidden || undefined} onClick={() => onSelect(s.key)}
      className="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border bg-card text-plum border-line shadow-sm">{s.name}</button>
  );
  return (
    <div className="flex items-center gap-2">
      {chosen && (
        <button type="button" onClick={() => onSelect("all")} aria-label={`Showing ${chosen.name}. Tap to show everything`}
          className="shrink-0 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap bg-violet text-white border border-violet">{chosen.name} ✕</button>
      )}
      <div className="flex-1 min-w-0 overflow-hidden" onMouseEnter={pause} onMouseLeave={() => resume(300)} onFocus={pause} onBlur={() => resume(300)}
        onTouchStart={pause} onTouchEnd={() => resume(3500)}>
        {reduced ? (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">{services.filter((s) => s.key !== selected).map((s) => chip(s, false))}</div>
        ) : (
          <div className={"flex gap-2 w-max live-drift" + (paused ? " live-drift-paused" : "")} style={{ "--drift-seconds": `${Math.max(24, services.length * 5)}s` }}>
            {services.filter((s) => s.key !== selected).map((s) => chip(s, false))}
            {services.filter((s) => s.key !== selected).map((s) => chip(s, true))}
          </div>
        )}
      </div>
    </div>
  );
}
