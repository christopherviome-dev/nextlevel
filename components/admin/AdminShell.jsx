"use client";
import { useEffect, useState } from "react";

// Admin's frame: a menu (sidebar on larger screens, drawer on phones) with
// count badges for anything waiting on the admin.
export default function AdminShell({ groups, section, setSection, title, children }) {
  const [open, setOpen] = useState(false);
  const go = (k) => { setSection(k); setOpen(false); window.scrollTo({ top: 0 }); };
  const waiting = groups.flatMap((g) => g.items).reduce((t, i) => t + (i.badge || 0), 0);
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  const menu = (
    <nav aria-label="Admin menu" className="p-3 space-y-4 overflow-y-auto h-full">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="text-[11px] font-extrabold tracking-wide text-muted uppercase px-3 mb-1">{g.title}</div>
          {g.items.map((i) => (
            <button key={i.key} onClick={() => go(i.key)} aria-current={section === i.key ? "page" : undefined}
              className={"w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-left " + (section === i.key ? "bg-violet text-white" : "text-ink hover:bg-surface")}>
              <span className="flex-1">{i.label}</span>
              {i.badge > 0 && <span className={"min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-bold flex items-center justify-center " + (section === i.key ? "bg-white text-violet" : i.urgent ? "bg-red-600 text-white" : "bg-hibiscus text-white")}>{i.badge}</span>}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
  return (
    <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-[15rem_1fr] lg:gap-6 lg:px-5">
      <aside className="hidden lg:block sticky top-20 self-start h-[calc(100vh-6rem)] bg-card border border-line rounded-2xl mt-6 overflow-hidden">{menu}</aside>
      <div className="min-w-0 px-5 lg:px-0 pt-4 lg:pt-6 pb-16">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setOpen(true)} className="lg:hidden relative w-10 h-10 rounded-full border border-line bg-card flex items-center justify-center" aria-label={`Admin menu${waiting ? ` (${waiting} waiting)` : ""}`}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            {waiting > 0 && <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-hibiscus text-white text-[11px] font-bold flex items-center justify-center">{waiting}</span>}
          </button>
          <h1 className="font-display font-extrabold text-xl text-ink">{title}</h1>
        </div>
        {children}
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Admin menu" className="absolute inset-y-0 left-0 w-[82%] max-w-xs bg-card shadow-xl pt-[env(safe-area-inset-top)]">{menu}</div>
        </div>
      )}
    </div>
  );
}
