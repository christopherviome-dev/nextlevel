"use client";
import Sheet from "./Sheet";

// Every service as a big tile, with how many professionals offer it. Newly
// approved services appear here automatically (the list comes from the server).
export default function ServicesSheet({ services, shops, selected, onPick, onClose }) {
  const count = (k) => shops.filter((s) => (s.services || []).includes(k)).length;
  const tile = (key, name, n) => (
    <button key={key} type="button" onClick={() => onPick(key)} aria-pressed={selected === key}
      className={"rounded-2xl p-4 text-left border min-h-24 flex flex-col justify-between " + (selected === key ? "bg-violet text-white border-violet" : "bg-card text-ink border-line hover:border-violet")}>
      <span className="font-extrabold">{name}</span>
      {n !== null && <span className={"text-xs " + (selected === key ? "text-white/80" : "text-muted")}>{n === 0 ? "Coming soon" : `${n} professional${n === 1 ? "" : "s"}`}</span>}
    </button>
  );
  return (
    <Sheet title="All services" onClose={onClose}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tile("all", "Everything", null)}
        {services.map((s) => tile(s.key, s.name, count(s.key)))}
      </div>
    </Sheet>
  );
}
