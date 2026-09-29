"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_COUNTRIES, countryInfo, detectCountry } from "../lib/countries";

// Stupidly simple country choice: a button with the country's NAME (no flags,
// which show as letters on many computers), then a panel with a search box,
// your likely countries first, and every country by name, in big rows.
const ALIASES = {
  GB: "uk united kingdom britain great britain england scotland wales", US: "usa us america united states", CI: "ivory coast cote divoire",
  AE: "uae dubai emirates", ZA: "south africa sa", CD: "drc congo kinshasa", CG: "congo brazzaville", NL: "holland netherlands",
  KR: "korea south korea", CZ: "czechia", SZ: "eswatini swaziland", TR: "turkey turkiye", NG: "naija nigeria", MM: "burma myanmar",
};
const clean = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9+ ]/g, "");

export function CountryPanel({ value, withDial, onPick, onClose }) {
  const [q, setQ] = useState("");
  const box = useRef(null);
  useEffect(() => {
    if (box.current) box.current.focus();
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  const suggested = useMemo(() => [...new Set([value, detectCountry(), "GH", "NG", "GB", "US"].filter(Boolean))].slice(0, 5).map((c) => ALL_COUNTRIES.find((x) => x.code === c)).filter(Boolean), [value]);
  const t = clean(q).trim();
  const list = t ? ALL_COUNTRIES.filter((c) => clean(`${c.name} ${ALIASES[c.code] || ""} ${withDial ? "+" + c.dial : ""}`).split(" ").some((w) => w.startsWith(t)) || clean(c.name).includes(t)) : ALL_COUNTRIES;
  const row = (c) => (
    <button key={c.code} type="button" onClick={() => onPick(c.code)} aria-pressed={c.code === value}
      className={"w-full text-left px-4 py-3 flex items-center justify-between gap-3 rounded-xl " + (c.code === value ? "bg-violet/10 font-bold text-violet" : "text-ink hover:bg-surface-2")}>
      <span>{c.name}</span>{withDial && <span className="text-muted text-sm">+{c.dial}</span>}
    </button>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Choose your country" onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col pb-[env(safe-area-inset-bottom,0px)]">
        <div className="p-4 flex items-center gap-2 border-b border-line">
          <input ref={box} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your country" aria-label="Type your country"
            className="flex-1 min-w-0 px-4 py-3 rounded-full border border-line bg-surface" />
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-surface-2 text-muted font-bold">×</button>
        </div>
        <div className="overflow-y-auto p-2">
          {!t && <><div className="px-4 pt-2 pb-1 text-xs font-bold text-muted uppercase tracking-wide">Suggested</div>{suggested.map(row)}<div className="px-4 pt-4 pb-1 text-xs font-bold text-muted uppercase tracking-wide">All countries</div></>}
          {list.length ? list.map(row) : <p className="px-4 py-6 text-muted">No country matches "{q}".</p>}
        </div>
      </div>
    </div>
  );
}

export default function CountryPicker({ value, onChange, withDial = false, label = "Country", compact = false }) {
  const [open, setOpen] = useState(false);
  const info = value ? countryInfo(value) : null;
  const name = value ? (ALL_COUNTRIES.find((c) => c.code === value) || {}).name : null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={withDial ? `Phone country: ${name || "choose"}` : `${label}: ${name || "choose"}`} title={name || undefined}
        className={"flex items-center justify-between gap-2 rounded-xl border border-line bg-card text-left " + (compact ? "w-[6.5rem] shrink-0 px-3 py-3" : "w-full px-4 py-3")}>
        <span className="truncate">{withDial ? (info && info.dial ? `+${info.dial}` : "+") : name || "Choose your country"}</span>
        <span aria-hidden className="text-muted">▾</span>
      </button>
      {open && <CountryPanel value={value} withDial={withDial} onClose={() => setOpen(false)} onPick={(c) => { onChange(c); setOpen(false); }} />}
    </>
  );
}
