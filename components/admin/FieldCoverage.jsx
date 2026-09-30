"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import FieldMap, { OUTCOME } from "./FieldMap";

function Table({ title, rows }) {
  return (
    <div className="bg-card border border-line rounded-2xl p-4">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">{title}</div>
      {rows.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted"><th className="py-1 pr-2">Where</th><th className="pr-2">Stops</th><th className="pr-2">Signed up</th><th>Conversion</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.key} className="border-t border-line"><td className="py-1.5 pr-2 text-ink">{r.key}</td><td className="pr-2">{r.stops}</td><td className="pr-2 text-ok-fg font-bold">{r.signedUp}</td><td>{r.conversion == null ? "—" : `${r.conversion}%`}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Every stop from every trip on one map (with shops already on Mepluge for
// comparison), and results by region and area: where you've been, what
// worked, and where to go next.
export default function FieldCoverage({ canSeeShops }) {
  const [o, setO] = useState(null);
  const [shops, setShops] = useState([]);
  const [showShops, setShowShops] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    apiFetch("/field/overview").then(setO).catch((e) => setError(e.message));
    if (canSeeShops) apiFetch("/analytics/map").then((m) => setShops(m.pins.filter((p) => p.status === "LIVE"))).catch(() => {});
  }, [canSeeShops]);
  if (error) return <p className="text-bad-fg">{error}</p>;
  if (!o) return <p className="text-muted">Adding it up…</p>;
  const t = o.totals;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[[o.trips, "trips"], [t.stops, "shops visited"], [t.signedUp, "signed up"], [t.conversion == null ? "—" : `${t.conversion}%`, "conversion"], [t.areas, "areas covered"]].map(([n, l]) => (
          <div key={l} className="bg-card border border-line rounded-2xl p-3 text-center"><div className="text-2xl font-extrabold text-ink">{n}</div><div className="text-xs text-muted">{l}</div></div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-strong">
        {Object.values(OUTCOME).map((x) => <span key={x.label} className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: x.color }} />{x.label}</span>)}
        {canSeeShops && <label className="flex items-center gap-1"><input type="checkbox" checked={showShops} onChange={(e) => setShowShops(e.target.checked)} /> Shops already on Mepluge ({shops.length})</label>}
      </div>
      <FieldMap stops={o.stops} shops={showShops ? shops : []} height="60vh" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Table title="By region" rows={o.byRegion} />
        <Table title="By area" rows={o.byArea} />
      </div>
      <p className="text-xs text-muted">{o.linkedAccounts} of the shops signed up in person are linked to their account on Mepluge, so you can follow how they do.</p>
    </div>
  );
}
