"use client";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../lib/api";
import Nav from "../components/Nav";

const CATEGORIES = ["All", "Hair Braiding", "Barbering", "Makeup", "Nails & Pedicure", "Locs & Twists"];

// Same real formula verified earlier against known real-world distances
// (Accra–Kumasi, ~199.7km actual vs 199.5km computed).
function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => typeof v !== "number")) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Discover() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [myLocation, setMyLocation] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/stylists")
      .then((list) => { if (!cancelled) setShops(list); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const findNearMe = () => {
    if (!navigator.geolocation) { alert("GPS not available on this device."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Could not get your location.")
    );
  };

  const results = useMemo(() => {
    let list = shops;
    if (category !== "All") list = list.filter((s) => s.category === category);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((s) => [s.salonName, s.name, s.category, s.area, s.bio].filter(Boolean).join(" ").toLowerCase().includes(q));
    if (myLocation) {
      list = list
        .map((s) => ({ ...s, _distanceKm: s.location && s.location.lat != null ? distanceKm(myLocation.lat, myLocation.lng, s.location.lat, s.location.lng) : null }))
        .sort((a, b) => {
          if (a._distanceKm == null && b._distanceKm == null) return 0;
          if (a._distanceKm == null) return 1;
          if (b._distanceKm == null) return -1;
          return a._distanceKm - b._distanceKm;
        });
    }
    return list;
  }, [shops, category, query, myLocation]);

  return (
    <div>
      <Nav />
      <div className="max-w-3xl mx-auto px-5 pt-6 pb-16">
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Search</div>
        <input
          type="text"
          placeholder="Try 'bridal makeup near Osu'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-full border border-line bg-white"
        />
        <button className="mt-2 px-4 py-2 rounded-full border border-line bg-white text-sm font-bold" onClick={findNearMe}>
          📍 {myLocation ? "Near Me — updated" : "Near Me"}
        </button>

        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mt-6 mb-2">Category</div>
        <div className="flex gap-2 flex-wrap mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={"px-4 py-2 rounded-full text-sm font-bold border " + (category === c ? "bg-violet text-white border-violet" : "bg-white text-plum border-line")}
            >
              {c}
            </button>
          ))}
        </div>

        {loading && <div className="text-plum/70 py-4">Loading real shops…</div>}
        {error && <div className="text-plum/70 py-4">Couldn't load shops: {error}</div>}
        {!loading && !error && results.length === 0 && <div className="text-plum/70 py-4">No shops found yet.</div>}

        <div className="space-y-3">
          {results.map((st) => (
            // A plain link on purpose, not Next.js navigation: /shop/... only
            // exists via the Netlify redirect rule, so it needs a real page load.
            <a key={st._id} href={`/shop/${st._id}`} className="block bg-white border border-line rounded-2xl p-4 hover:border-hibiscus transition-colors">
              <b className="text-ink">{st.salonName || st.name}</b>{" "}
              {st.verified && <span className="text-xs font-bold text-hibiscus-deep">✓ Verified</span>}
              <div className="text-sm text-plum/80 mt-1">
                {st.category} · {st.area}
                {st._distanceKm != null && ` · 📍 ${st._distanceKm < 1 ? Math.round(st._distanceKm * 1000) + "m" : st._distanceKm.toFixed(1) + "km"}`}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
