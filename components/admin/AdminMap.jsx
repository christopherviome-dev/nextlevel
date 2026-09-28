"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../lib/api";
import "leaflet/dist/leaflet.css";

const COLORS = { LIVE: "#16a34a", WAITING: "#f59e0b", RESTRICTED: "#dc2626" };
const LABELS = { LIVE: "Live", WAITING: "Waiting for approval", RESTRICTED: "Restricted" };
// Shop names and places are typed by users: escape them fully before they go into a map pop-up.
const esc = (t) => String(t || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Every shop on a free OpenStreetMap map (no paid map service), from the whole
// country down to the street. Admin only: exact pins.
export default function AdminMap() {
  const box = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [show, setShow] = useState({ LIVE: true, WAITING: true, RESTRICTED: true });
  const map = useRef(null), layer = useRef(null), L = useRef(null);

  useEffect(() => { apiFetch("/analytics/map").then(setData).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !box.current || map.current) return;
      L.current = mod.default || mod;
      map.current = L.current.map(box.current, { zoomControl: true }).setView([7.95, -1.03], 7); // Ghana
      L.current.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map.current);
      layer.current = L.current.layerGroup().addTo(map.current);
      setShow((s) => ({ ...s })); // draw pins once the map exists
    });
    return () => { cancelled = true; if (map.current) { map.current.remove(); map.current = null; } };
  }, []);
  useEffect(() => {
    if (!data || !layer.current || !L.current) return;
    layer.current.clearLayers();
    const shown = data.pins.filter((p) => show[p.status]);
    shown.forEach((p) => {
      L.current.circleMarker([p.lat, p.lng], { radius: 7, color: "#fff", weight: 2, fillColor: COLORS[p.status], fillOpacity: 0.9 })
        .bindPopup(`<b>${esc(p.name)}</b>${p.verified ? " ✓" : ""}<br>${esc([p.area, p.city].filter(Boolean).join(", "))}<br>${LABELS[p.status]}<br><a href="/shop/${esc(p.id)}">Open shop</a>`)
        .addTo(layer.current);
    });
    if (shown.length) map.current.fitBounds(shown.map((p) => [p.lat, p.lng]), { padding: [30, 30], maxZoom: 12 });
  }, [data, show]);

  const count = (s) => (data ? data.pins.filter((p) => p.status === s).length : 0);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {Object.keys(COLORS).map((s) => (
          <button key={s} onClick={() => setShow({ ...show, [s]: !show[s] })} aria-pressed={show[s]}
            className={"flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold " + (show[s] ? "bg-card border-line text-ink" : "bg-surface border-line text-muted line-through")}>
            <span className="w-3 h-3 rounded-full" style={{ background: COLORS[s] }} />{LABELS[s]} ({count(s)})
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-bad-fg">{error}</p>}
      <div ref={box} className="w-full h-[65vh] rounded-2xl border border-line overflow-hidden z-0" />
      {data && data.withoutLocation > 0 && <p className="text-xs text-muted">{data.withoutLocation} shop{data.withoutLocation === 1 ? " hasn't" : "s haven't"} pinned a location yet, so {data.withoutLocation === 1 ? "it isn't" : "they aren't"} on the map.</p>}
    </div>
  );
}
