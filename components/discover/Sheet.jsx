"use client";
import { useEffect, useRef } from "react";

// A panel over the feed: slides up on phones, sits on the right on larger
// screens. Escape or tapping outside closes it (the Back button too, via useBackClose).
export default function Sheet({ title, onClose, children }) {
  const closeRef = useRef(null);
  const cb = useRef(onClose);
  useEffect(() => { cb.current = onClose; }, [onClose]);
  useEffect(() => {
    if (closeRef.current) closeRef.current.focus();
    const k = (e) => { if (e.key === "Escape") cb.current(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <div className="fixed inset-0 z-40" role="presentation">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title}
        className="absolute inset-x-0 bottom-0 max-h-[90vh] rounded-t-3xl lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[440px] lg:max-h-none lg:rounded-none bg-card overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 bg-card/95 backdrop-blur flex items-center justify-between px-4 py-3 border-b border-line z-10">
          <div className="lg:hidden w-10 h-1.5 rounded-full bg-line absolute left-1/2 -translate-x-1/2 top-1.5" aria-hidden />
          <div className="font-bold text-ink truncate pr-3">{title}</div>
          <button ref={closeRef} onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full border border-line text-plum shrink-0">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
