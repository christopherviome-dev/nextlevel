"use client";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../lib/api";
import Nav from "../components/Nav";
import { LoadingState, EmptyState, ErrorState } from "../components/States";
import { CATEGORIES as SHOP_CATEGORIES } from "../lib/shop";
import { distanceKm } from "../lib/geo";
import { getClientId, likedSet, saveLiked, likeKey } from "../lib/clientId";
import { COUNTRIES, countryInfo, detectCountry, saveCountry } from "../lib/countries";
import { formatMoney } from "../lib/money";
import LiveStrip from "../components/discover/LiveStrip";
import Row from "../components/discover/Row";
import WorkTile from "../components/discover/WorkTile";
import ProCard from "../components/discover/ProCard";
import ContextPanel from "../components/discover/ContextPanel";

const CATEGORIES = ["All", ...SHOP_CATEGORIES];

// Spread work across professionals so one busy shop can't fill the feed.
function interleave(shops) {
  const queues = shops.map((s) => s.work.filter((w) => w.thumb).map((w) => ({ ...w, shop: s })));
  const out = [];
  for (let added = true; added;) {
    added = false;
    for (const q of queues) if (q.length) { out.push(q.shift()); added = true; }
  }
  return out;
}
const byNearest = (a, b) => (a._distanceKm ?? Infinity) - (b._distanceKm ?? Infinity);

export default function Discover() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [budget, setBudget] = useState("any");
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);
  const [selection, setSelection] = useState(null); // ids only; resolved against fresh data below
  const [focusTab, setFocusTab] = useState("work");
  // Which country's shops to show. Worked out in the browser (device time zone,
  // language, or an earlier choice), so it starts unknown.
  const [country, setCountry] = useState(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the device's location settings only exist in the browser
    setCountry(detectCountry());
  }, []);
  // Tiles only appear after the feed loads in the browser, so reading saved likes here is safe.
  const [liked, setLiked] = useState(() => (typeof window === "undefined" ? new Set() : likedSet()));

  useEffect(() => {
    if (!country) return;
    let cancelled = false;
    apiFetch(`/stylists/discover?country=${country}`)
      .then((list) => { if (!cancelled) setShops(list); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey, country]);

  const retry = () => { setError(null); setLoading(true); setReloadKey((k) => k + 1); };
  const clearFilters = () => { setQuery(""); setCategory("All"); setBudget("any"); };
  const switchCountry = (c) => {
    if (c === country) return;
    saveCountry(c); setCountry(c); setBudget("any"); setSelection(null); setMyLocation(null);
    setShops([]); setError(null); setLoading(true);
  };
  // Budgets in the local currency: GH₵100 and £20 mean very different things.
  const info = countryInfo(country);
  const BUDGETS = [["any", "Any budget", Infinity], ...info.budgets.map((n) => [String(n), `Under ${formatMoney(n, info.currency)}`, n])];

  const toggleNearMe = () => {
    if (myLocation) { setMyLocation(null); return; }
    if (!navigator.geolocation) { setLocError("This device can't share its location."); return; }
    setLocating(true); setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setLocError("Couldn't get your location. Check that location access is allowed for this site."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const withDistance = useMemo(() => shops.map((s) => ({
    ...s,
    _distanceKm: myLocation && s.location ? distanceKm(myLocation.lat, myLocation.lng, s.location.lat, s.location.lng) : null,
  })), [shops, myLocation]);

  const allWork = useMemo(() => interleave(withDistance), [withDistance]);
  const maxPrice = (BUDGETS.find((b) => b[0] === budget) || BUDGETS[0])[2];
  const q = query.trim().toLowerCase();
  const focus = !!q || category !== "All" || budget !== "any";

  const filteredShops = useMemo(() => {
    const list = withDistance.filter((s) =>
      (category === "All" || s.category === category) &&
      (!q || [s.salonName, s.name, s.category, s.area, s.bio, ...s.work.map((w) => w.name)].filter(Boolean).join(" ").toLowerCase().includes(q)) &&
      (budget === "any" || s.work.some((w) => typeof w.price === "number" && w.price <= maxPrice)));
    return myLocation ? [...list].sort(byNearest) : list;
  }, [withDistance, category, q, budget, maxPrice, myLocation]);

  const filteredWork = useMemo(() => {
    const list = allWork.filter((w) =>
      (category === "All" || w.shop.category === category) &&
      (budget === "any" || (typeof w.price === "number" && w.price <= maxPrice)) &&
      (!q || [w.name, w.shop.salonName, w.shop.name, w.shop.area, w.shop.category].filter(Boolean).join(" ").toLowerCase().includes(q)));
    return myLocation ? [...list].sort((a, b) => byNearest(a.shop, b.shop)) : list;
  }, [allWork, category, q, budget, maxPrice, myLocation]);

  // Ambient rows, all from real data. Each only shows with enough real content.
  const live = useMemo(() => [...allWork].sort((a, b) => (b.likeCount - a.likeCount) || ((b.addedAt || 0) - (a.addedAt || 0))).slice(0, 12), [allWork]);
  const newLooks = useMemo(() => allWork.filter((w) => w.addedAt).sort((a, b) => b.addedAt - a.addedAt).slice(0, 12), [allWork]);
  const loved = useMemo(() => allWork.filter((w) => w.likeCount > 0).sort((a, b) => b.likeCount - a.likeCount).slice(0, 12), [allWork]);
  const nearYou = useMemo(() => (myLocation ? withDistance.filter((s) => s._distanceKm != null).sort(byNearest).slice(0, 10) : []), [withDistance, myLocation]);
  const popular = useMemo(() => withDistance.filter((s) => s.popularThisWeek), [withDistance]);

  // Selection is stored as IDs so the panel always shows fresh numbers (e.g. after a like).
  const open = (sel) => setSelection(sel.type === "work"
    ? { type: "work", shopId: sel.item.shop._id, workId: sel.item.id }
    : { type: "pro", shopId: sel.shop._id });
  const resolved = useMemo(() => {
    if (!selection) return null;
    const shop = withDistance.find((s) => s._id === selection.shopId);
    if (!shop) return null;
    if (selection.type === "pro") return { type: "pro", shop };
    const w = shop.work.find((x) => x.id === selection.workId);
    return w ? { type: "work", item: { ...w, shop } } : { type: "pro", shop };
  }, [selection, withDistance]);

  const bumpLike = (item, delta, exact) => setShops((prev) => prev.map((s) => s._id !== item.shop._id ? s : {
    ...s, work: s.work.map((w) => w.id !== item.id ? w : { ...w, likeCount: exact ?? Math.max(0, w.likeCount + delta) }),
  }));
  const onLike = async (item) => {
    const clientId = getClientId();
    if (!clientId) return;
    const key = likeKey(item);
    const wasLiked = liked.has(key);
    const next = new Set(liked);
    if (wasLiked) next.delete(key); else next.add(key);
    setLiked(next); saveLiked(next);
    bumpLike(item, wasLiked ? -1 : 1);
    try {
      const r = await apiFetch(`/stylists/${item.shop._id}/styles/${item.id}/like?lean=1`, { method: "POST", body: JSON.stringify({ clientId }) });
      const fixed = new Set(next);
      if (r.liked) fixed.add(key); else fixed.delete(key);
      setLiked(fixed); saveLiked(fixed);
      bumpLike(item, 0, r.likeCount);
    } catch (e) {
      setLiked(liked); saveLiked(liked);
      bumpLike(item, wasLiked ? 1 : -1);
    }
  };

  const tiles = (list, fixed) => list.map((item) => (
    <WorkTile key={likeKey(item)} item={item} fixed={fixed} onOpen={open} liked={liked.has(likeKey(item))} onLike={onLike} />
  ));
  const chip = (active, onClick, label) => (
    <button key={label} type="button" onClick={onClick} aria-pressed={active}
      className={"px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border " + (active ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>{label}</button>
  );

  return (
    <div>
      <Nav />
      <div className="max-w-6xl mx-auto px-5 pt-5 pb-16">
        <div className="bg-card border border-line rounded-3xl p-4 mb-6">
          <div className="flex gap-2">
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search styles, services, professionals or areas"
              placeholder="Try 'knotless braids' or 'Kasoa'" className="flex-1 min-w-0 px-4 py-3 rounded-full border border-line bg-surface" />
            <button type="button" onClick={toggleNearMe} disabled={locating} aria-pressed={!!myLocation}
              className={"px-4 py-3 rounded-full text-sm font-bold border whitespace-nowrap " + (myLocation ? "bg-hibiscus text-white border-hibiscus" : "bg-card text-plum border-line")}>
              {locating ? "Finding you…" : myLocation ? "📍 Near me ✓" : "📍 Near me"}
            </button>
          </div>
          {locError && <p className="text-sm text-bad-fg mt-2">{locError}</p>}
          {country && (
            <div className="flex items-center gap-2 mt-3 text-sm">
              <span className="text-muted">Showing shops in</span>
              {Object.entries(COUNTRIES).map(([code, c]) => (
                <button key={code} type="button" onClick={() => switchCountry(code)} aria-pressed={country === code}
                  className={"px-3 py-1 rounded-full border font-bold " + (country === code ? "bg-ink text-card border-ink" : "bg-card text-plum border-line")}>
                  <span aria-hidden>{c.flag}</span> {code === "GB" ? "UK" : c.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3">{CATEGORIES.map((c) => chip(category === c, () => setCategory(c), c))}</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2">{BUDGETS.map(([k, label]) => chip(budget === k, () => setBudget(k), label))}</div>
        </div>

        {loading && <LoadingState label="Loading Discover" />}
        {error && <ErrorState message={`We couldn't load Discover right now. (${error})`} onRetry={retry} />}
        {!loading && !error && shops.length === 0 && (
          <EmptyState title="No shops on Sheeba yet" hint="New professionals are joining. Check back soon." />
        )}

        {!loading && !error && shops.length > 0 && focus && (
          <section aria-label="Search results">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div role="tablist" aria-label="Result type" className="flex gap-2">
                {chip(focusTab === "work", () => setFocusTab("work"), `Looks (${filteredWork.length})`)}
                {chip(focusTab === "pros", () => setFocusTab("pros"), `Professionals (${filteredShops.length})`)}
              </div>
              <button type="button" onClick={clearFilters} className="text-sm font-bold text-hibiscus-deep underline whitespace-nowrap">Clear</button>
            </div>
            {focusTab === "work" && (filteredWork.length
              ? <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">{tiles(filteredWork, false)}</div>
              : <EmptyState title="No looks match" hint="Try another category or budget, or search for a professional instead." actionLabel="Clear search and filters" onAction={clearFilters} />)}
            {focusTab === "pros" && (filteredShops.length
              ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{filteredShops.map((s) => <ProCard key={s._id} shop={s} onOpen={open} wide />)}</div>
              : <EmptyState title="No professionals match" hint="Try another category or budget." actionLabel="Clear search and filters" onAction={clearFilters} />)}
          </section>
        )}

        {!loading && !error && shops.length > 0 && !focus && (
          <>
            <LiveStrip items={live} onOpen={open} likedIds={liked} onLike={onLike} />
            {nearYou.length > 0 && (
              <Row title="Near you" subtitle="Closest first">{nearYou.map((s) => <ProCard key={s._id} shop={s} onOpen={open} />)}</Row>
            )}
            {newLooks.length >= 3 && <Row title="New looks" subtitle="Just added by professionals">{tiles(newLooks, true)}</Row>}
            {loved.length >= 3 && <Row title="Loved on Sheeba" subtitle="What people are hearting">{tiles(loved, true)}</Row>}
            {popular.length >= 2 && (
              <Row title="Popular this week" subtitle="Shops people are visiting">{popular.map((s) => <ProCard key={s._id} shop={s} onOpen={open} />)}</Row>
            )}
            <Row title="Professionals to discover">{withDistance.map((s) => <ProCard key={s._id} shop={s} onOpen={open} />)}</Row>
            <section aria-label="Explore">
              <h2 className="font-display font-extrabold text-lg text-ink mb-3">Explore</h2>
              {allWork.length
                ? <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">{tiles(allWork, false)}</div>
                : <EmptyState title="No work photos yet" hint="As professionals add photos of their work, they'll appear here." />}
            </section>
          </>
        )}
      </div>
      <ContextPanel selection={resolved} onClose={() => setSelection(null)} onSelect={open} likedIds={liked} onLike={onLike} />
    </div>
  );
}
