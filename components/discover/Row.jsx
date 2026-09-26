"use client";
import { useRef } from "react";

// A titled horizontal row: swipe on phones, arrow buttons on larger screens.
export default function Row({ title, subtitle, children }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current && ref.current.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="mb-8" aria-label={title}>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h2 className="font-display font-extrabold text-lg text-ink">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="hidden sm:flex gap-2 shrink-0">
          <button type="button" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`} className="w-9 h-9 rounded-full border border-line bg-card text-plum font-bold">‹</button>
          <button type="button" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`} className="w-9 h-9 rounded-full border border-line bg-card text-plum font-bold">›</button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1">{children}</div>
    </section>
  );
}
