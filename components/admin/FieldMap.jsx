"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export const OUTCOME = {
  SIGNED_UP: { label: "Signed up", color: "#16a34a", icon: "✅" },
  INTERESTED: { label: "Interested", color: "#2563eb", icon: "🤝" },
  FOLLOW_UP: { label: "Come back later", color: "#f59e0b", icon: "🔁" },
  NOT_INTERESTED: { label: "Not interested", color: "#9ca3af", icon: "❌" },
};
const esc = (t) => String(t || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Field stops on free OpenStreetMap: coloured by outcome, with the trip's
// route joining them in order. Optional grey dots for shops already on Sheeba.
export default function FieldMap({ stops, route = false, shops = [], height = "55vh" }) {
  const box = useRef(null), map = useRef(null), layer = useRef(null), L = useRef(null);
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !box.current || map.current) return;
      L.current = mod.default || mod;
      map.current = L.current.map(box.current).setView([7.95, -1.03], 7);
      L.current.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map.current);
      layer.current = L.current.layerGroup().addTo(map.current);
      draw();
    });
    return () => { cancelled = true; if (map.current) { map.current.remove(); map.current = null; } };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- the map is made once; draw() follows the data below
  function draw() {
    if (!layer.current || !L.current) return;
    layer.current.clearLayers();
    const pts = stops.filter((s) => typeof s.lat === "number" && typeof s.lng === "number").sort((a, b) => a.at - b.at);
    shops.forEach((s) => L.current.circleMarker([s.lat, s.lng], { radius: 4, color: "#6b7280", weight: 1, fillColor: "#9ca3af", fillOpacity: 0.6 }).bindPopup(`${esc(s.name)} (on Sheeba)`).addTo(layer.current));
    if (route && pts.length > 1) L.current.polyline(pts.map((p) => [p.lat, p.lng]), { color: "#7c3aed", weight: 3, opacity: 0.7, dashArray: "6 6" }).addTo(layer.current);
    pts.forEach((p, i) => L.current.circleMarker([p.lat, p.lng], { radius: 8, color: "#fff", weight: 2, fillColor: (OUTCOME[p.outcome] || {}).color || "#999", fillOpacity: 0.95 })
      .bindPopup(`<b>${route ? `${i + 1}. ` : ""}${esc(p.placeName)}</b><br>${esc(p.area)}<br>${(OUTCOME[p.outcome] || {}).label || ""}<br>${new Date(p.at).toLocaleString()}`).addTo(layer.current));
    const all = [...pts.map((p) => [p.lat, p.lng]), ...shops.map((s) => [s.lat, s.lng])];
    if (all.length) map.current.fitBounds(all, { padding: [30, 30], maxZoom: 15 });
  }
  useEffect(() => { draw(); }); // redraw whenever the stops change
  return <div ref={box} style={{ height }} className="w-full rounded-2xl border border-line overflow-hidden z-0" />;
}
