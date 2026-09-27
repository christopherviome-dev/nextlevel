"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { apiFetch } from "../lib/api";
import Nav from "../components/Nav";
import SiteFooter from "../components/SiteFooter";
import { LoadingState, EmptyState, ErrorState } from "../components/States";
import { useCatalog, styleIndex, INSPIRATION_STYLES } from "../lib/catalog";
import { summarise } from "../lib/prices";
import { personalize, scoreWork } from "../lib/personalize";
import { interests, learn } from "../lib/interests";
import { useAuth } from "../context/AuthContext";
import { distanceKm } from "../lib/geo";
import { getClientId, likedSet, saveLiked, likeKey } from "../lib/clientId";
import { countryInfo } from "../lib/countries";
import { formatMoney } from "../lib/money";
import { useCountryPref, useLocationPref, setUseLocation } from "../lib/prefs";
import { useBackClose, closeLayer } from "../lib/useBackClose";
import VoiceSearchButton, { parseVoice } from "../components/discover/VoiceSearchButton";
import ServiceRoller from "../components/discover/ServiceRoller";
import FeedPost from "../components/discover/FeedPost";
import InspirationPost from "../components/discover/InspirationPost";
import InspirationSheet from "../components/discover/InspirationSheet";
import FiltersSheet from "../components/discover/FiltersSheet";
import ContextPanel from "../components/discover/ContextPanel";

const PAGE = 12;          // posts shown at first, and added each time you reach the end
const INSPIRE_EVERY = 5;  // an inspiration post after every 5 work posts
const STOP = new Set(["near", "in", "at", "for", "a", "an", "the", "and", "with", "to", "of", "me"]);

// Spread work across professionals so one busy shop can't fill the feed.
function interleave(shops) {
  const queues = shops.map((s) => s.work.filter((w) => w.thumb).map((w) => ({ ...w, shop: s })));
  const out = [];
  for (let added = true; added;) { added = false; for (const q of queues) if (q.length) { out.push(q.shift()); added = true; } }
  return out;
}

// Discover: one vertical feed, like Instagram. Services roll across the top,
// work posts fill the feed with inspiration woven in, and details open over
// the feed (Back or tapping Discover again returns you to it).
export default function Discover() {
  const country = useCountryPref();
  const useLoc = useLocationPref();
  const { customerToken } = useAuth();
  const catalog = useCatalog();
  const styles = useMemo(() => styleIndex(catalog), [catalog]);

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [myLocation, setMyLocation] = useState(null);
  const [locError, setLocError] = useState(null);
  const [query, setQuery] = useState("");
  const [service, setService] = useState("all");
  const [style, setStyle] = useState(null);
  const [budget, setBudget] = useState("any");
  const [voiceMax, setVoiceMax] = useState(null);
  const [layer, setLayer] = useState(null); // what's open over the feed
  const [shown, setShown] = useState(PAGE);
  const [prefs, setPrefs] = useState(null);
  const [learned] = useState(() => (typeof window === "undefined" ? null : interests())); // read once per visit: the feed never reshuffles mid-browse
  const [liked, setLiked] = useState(() => (typeof window === "undefined" ? new Set() : likedSet()));
  const sentinel = useRef(null);

  // The shops for the chosen country (Settings), lean and light on data.
  useEffect(() => {
    if (!country) return;
    let live = true;
    apiFetch(`/stylists/discover?country=${country}`)
      .then((list) => { if (live) { setShops(list); setError(null); } })
      .catch((e) => { if (live) setError(e.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [country, reloadKey]);

  // The location pin in the top bar (or Settings) turns "near me" on or off.
  useEffect(() => {
    if (!useLoc) { setMyLocation(null); return; } // eslint-disable-line react-hooks/set-state-in-effect -- follows the pin
    if (!navigator.geolocation) { setLocError("This device can't share its location."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocError(null); },
      () => { setLocError("Couldn't get your location. Check that location access is allowed for this site."); setUseLocation(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [useLoc]);

  useEffect(() => {
    if (!customerToken) return;
    apiFetch("/customers/me", {}, "customer").then((me) => setPrefs({ feedFor: me.feedFor || null, favourites: me.favourites || [] })).catch(() => {});
  }, [customerToken]);

  // Tapping Discover again (bottom bar) returns to the start of the feed.
  const goHome = useCallback(() => {
    setLayer(null); setQuery(""); setService("all"); setStyle(null); setBudget("any"); setVoiceMax(null); setShown(PAGE);
  }, []);
  useEffect(() => {
    window.addEventListener("sheeba:discover-home", goHome);
    return () => window.removeEventListener("sheeba:discover-home", goHome);
  }, [goHome]);
  useBackClose(layer, () => setLayer(null));
  const close = () => closeLayer(() => setLayer(null));
  const open = (l) => setLayer(l);

  const info = countryInfo(country);
  const withDistance = useMemo(() => shops.map((s) => ({
    ...s, _distanceKm: myLocation && s.location ? distanceKm(myLocation.lat, myLocation.lng, s.location.lat, s.location.lng) : null,
  })), [shops, myLocation]);
  const where = myLocation ? "near you" : `in ${info.name}`;

  // Local price ranges (one figure per shop, 3+ shops), following the chosen service/style.
  const bandShops = useMemo(() => (myLocation ? withDistance.filter((s) => s._distanceKm != null && s._distanceKm <= 25) : withDistance), [withDistance, myLocation]);
  const local = useMemo(() => summarise(bandShops, { service: service === "all" ? undefined : service, style: style || undefined }), [bandShops, service, style]);
  const budgets = local.enough
    ? [["any", "Any price", Infinity], ["low", `Up to ${formatMoney(local.low, info.currency)}`, local.low], ["typical", `Up to ${formatMoney(local.high, info.currency)}`, local.high]]
    : [["any", "Any price", Infinity]];
  if (voiceMax) budgets.push(["voice", `Up to ${formatMoney(voiceMax, info.currency)}`, voiceMax]);
  const maxPrice = (budgets.find((b) => b[0] === budget) || budgets[0])[2];

  // Word-by-word search across style, service, shop and area.
  const words = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter((w) => w && !STOP.has(w)), [query]);
  const styleWords = useCallback((w) => (w.styleKey && styles[w.styleKey] ? [styles[w.styleKey].name, ...(styles[w.styleKey].aliases || [])] : []), [styles]);
  const ctx = useMemo(() => ({ prefs, learned, styles }), [prefs, learned, styles]);

  const work = useMemo(() => {
    const list = interleave(withDistance).filter((w) =>
      (service === "all" || w.serviceKey === service || (!w.serviceKey && (w.shop.services || []).includes(service))) &&
      (!style || w.styleKey === style) &&
      (budget === "any" || (typeof w.price === "number" && w.price <= maxPrice)) &&
      (!words.length || words.every((word) => [w.name, w.serviceKey, ...styleWords(w), w.shop.salonName, w.shop.name, w.shop.area, w.shop.city].filter(Boolean).join(" ").toLowerCase().includes(word))));
    return myLocation ? [...list].sort((a, b) => (a.shop._distanceKm ?? Infinity) - (b.shop._distanceKm ?? Infinity)) : personalize(list, (x) => scoreWork(x, ctx));
  }, [withDistance, service, style, budget, maxPrice, words, styleWords, myLocation, ctx]);

  // Inspiration woven through the feed, matching the chosen service.
  const inspiration = useMemo(() => INSPIRATION_STYLES.filter((k) => styles[k] && (service === "all" || styles[k].serviceKey === service) && (!style || k === style)), [styles, service, style]);
  const feed = useMemo(() => {
    const out = [];
    let ins = 0;
    work.forEach((w, i) => {
      out.push({ kind: "work", key: likeKey(w), item: w });
      if ((i + 1) % INSPIRE_EVERY === 0 && inspiration.length) out.push({ kind: "inspire", key: `i-${i}`, styleKey: inspiration[ins++ % inspiration.length] });
    });
    if (!work.length) inspiration.forEach((k) => out.push({ kind: "inspire", key: `i-${k}`, styleKey: k })); // nothing yet: inspiration still shows
    return out;
  }, [work, inspiration]);

  // Reaching the end of the feed shows the next batch.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setShown((n) => n + PAGE); }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [feed.length]);

  // Searches teach the feed too (after a pause, so half-typed words don't count).
  useEffect(() => {
    if (!words.length) return;
    const t = setTimeout(() => {
      Object.entries(styles).filter(([, st]) => words.every((w) => [st.name, ...(st.aliases || [])].join(" ").toLowerCase().includes(w)))
        .slice(0, 2).forEach(([k, st]) => learn("search", { styleKey: k, serviceKey: st.serviceKey }));
    }, 1500);
    return () => clearTimeout(t);
  }, [words, styles]);

  const bump = (item, delta, exact) => setShops((prev) => prev.map((s) => s._id !== item.shop._id ? s : {
    ...s, work: s.work.map((w) => w.id !== item.id ? w : { ...w, likeCount: exact ?? Math.max(0, w.likeCount + delta) }),
  }));
  const onLike = async (item) => {
    const clientId = getClientId();
    if (!clientId) return;
    const key = likeKey(item), was = liked.has(key);
    const next = new Set(liked); if (was) next.delete(key); else next.add(key);
    setLiked(next); saveLiked(next); bump(item, was ? -1 : 1);
    if (!was) learn("heart", { styleKey: item.styleKey, serviceKey: item.serviceKey });
    try {
      const r = await apiFetch(`/stylists/${item.shop._id}/styles/${item.id}/like?lean=1`, { method: "POST", body: JSON.stringify({ clientId }) });
      const fixed = new Set(next); if (r.liked) fixed.add(key); else fixed.delete(key);
      setLiked(fixed); saveLiked(fixed); bump(item, 0, r.likeCount);
    } catch (e) { setLiked(liked); saveLiked(liked); bump(item, was ? 1 : -1); }
  };
  const openWork = (item) => { learn("view", { styleKey: item.styleKey, serviceKey: item.serviceKey }); open({ type: "work", item }); };
  const openPro = (shop) => { learn("view", { services: shop.services }); open({ type: "pro", shop }); };
  const onVoice = (said) => {
    const v = parseVoice(said);
    setQuery(v.text);
    if (v.max) { setVoiceMax(v.max); setBudget("voice"); }
    if (v.nearMe && !useLoc) setUseLocation(true);
  };
  const filtersOn = budget !== "any" || !!style;
  const services = catalog.map((c) => ({ key: c.key, name: c.name }));
  const chosen = catalog.find((c) => c.key === service);

  return (
    <div>
      <Nav />
      <div className="max-w-xl mx-auto sm:px-4 pt-3 pb-4">
        <div className="px-4 sm:px-0 space-y-3 mb-3">
          <div className="flex gap-2">
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search styles, services, professionals or areas"
              placeholder="Search styles, professionals, areas" className="flex-1 min-w-0 px-4 py-3 rounded-full border border-line bg-card shadow-sm" />
            <VoiceSearchButton onResult={onVoice} lang={country === "GB" ? "en-GB" : "en-GH"} />
            <button type="button" onClick={() => open({ type: "filters" })} aria-label="Filters and prices" title="Filters and prices"
              className={"relative w-12 h-12 shrink-0 rounded-full border flex items-center justify-center " + (filtersOn ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
            </button>
          </div>
          {services.length > 0 && <ServiceRoller services={services} selected={service} onSelect={(k) => { setService(k); setStyle(null); setShown(PAGE); }} />}
          {chosen && (chosen.styles || []).length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {chosen.styles.map((st) => (
                <button key={st.key} type="button" onClick={() => setStyle(style === st.key ? null : st.key)} aria-pressed={style === st.key}
                  className={"px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border " + (style === st.key ? "bg-hibiscus text-white border-hibiscus" : "bg-surface text-plum border-line")}>{st.name}</button>
              ))}
            </div>
          )}
          {locError && <p className="text-xs text-bad-fg">{locError}</p>}
        </div>

        {loading && <LoadingState label="Loading Discover" />}
        {error && <ErrorState message={`We couldn't load Discover right now. (${error})`} onRetry={() => { setError(null); setLoading(true); setReloadKey((k) => k + 1); }} />}
        {!loading && !error && feed.length === 0 && (
          <div className="px-4"><EmptyState title={shops.length ? "Nothing matches" : `No shops in ${info.name} yet`} hint={shops.length ? "Try another service or budget, or clear your search." : "New professionals are joining. You can change your country in Settings."} actionLabel={shops.length ? "Show everything" : undefined} onAction={shops.length ? goHome : undefined} /></div>
        )}
        {!loading && !error && feed.slice(0, shown).map((f) => f.kind === "work"
          ? <FeedPost key={f.key} item={f.item} liked={liked.has(f.key)} onLike={onLike} onOpenWork={openWork} onOpenPro={openPro} styleName={f.item.styleKey && styles[f.item.styleKey] ? styles[f.item.styleKey].name : null} />
          : <InspirationPost key={f.key} styleKey={f.styleKey} style={styles[f.styleKey]} onOpen={() => open({ type: "inspiration", styleKey: f.styleKey })} />)}
        {shown < feed.length && <div ref={sentinel} className="h-10" aria-hidden />}
        {!loading && feed.length > 0 && shown >= feed.length && <p className="text-center text-xs text-muted py-6">You're all caught up ✨</p>}
      </div>
      <SiteFooter />

      {layer && (layer.type === "work" || layer.type === "pro") && (
        <ContextPanel selection={layer.type === "work" ? { type: "work", item: layer.item } : { type: "pro", shop: layer.shop }}
          onClose={close} onSelect={(sel) => setLayer(sel.type === "work" ? { type: "work", item: sel.item } : { type: "pro", shop: sel.shop })} likedIds={liked} onLike={onLike} />
      )}
      {layer && layer.type === "inspiration" && styles[layer.styleKey] && (
        <InspirationSheet styleKey={layer.styleKey} style={styles[layer.styleKey]} shops={withDistance} currency={info.currency} where={where} onClose={close}
          onShowInFeed={() => { const k = layer.styleKey; close(); setService(styles[k].serviceKey); setStyle(k); setShown(PAGE); window.scrollTo({ top: 0 }); }} />
      )}
      {layer && layer.type === "filters" && (
        <FiltersSheet local={local} budgets={budgets} budget={budget} setBudget={setBudget} currency={info.currency} where={where}
          service={service === "all" ? null : service} style={style}
          label={style && styles[style] ? styles[style].name : chosen ? chosen.name : null}
          onClose={close} onClear={() => { setBudget("any"); setStyle(null); setVoiceMax(null); close(); }} />
      )}
    </div>
  );
}
