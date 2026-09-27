"use client";
import { useState, useMemo, useCallback } from "react";
import Nav from "../../components/Nav";
import { LoadingState, ErrorState } from "../../components/States";
import { INSPIRATION_STYLES, photosFor } from "../../lib/catalog";
import { summarise } from "../../lib/prices";
import { formatMoney } from "../../lib/money";
import { formatDistance } from "../../lib/geo";
import { likeKey } from "../../lib/clientId";
import { useLikes } from "../../lib/useLikes";
import { learn } from "../../lib/interests";
import { useDiscoverData } from "../../lib/useDiscoverData";
import { useBackClose, closeLayer } from "../../lib/useBackClose";
import { setUseLocation } from "../../lib/prefs";
import VoiceSearchButton, { parseVoice } from "../../components/discover/VoiceSearchButton";
import InspirationSheet from "../../components/discover/InspirationSheet";
import FiltersSheet from "../../components/discover/FiltersSheet";
import ContextPanel from "../../components/discover/ContextPanel";

const STOP = new Set(["near", "in", "at", "for", "a", "an", "the", "and", "with", "to", "of", "me"]);

// Search: type or speak; choose a budget from real local prices; results as
// Looks, Professionals and Styles. Details open over the page (Back closes them).
export default function SearchPage() {
  const d = useDiscoverData();
  const { styles, catalog, withDistance, info, where, myLocation } = d;
  const [query, setQuery] = useState("");
  const [service, setService] = useState("all");
  const [budget, setBudget] = useState("any");
  const [voiceMax, setVoiceMax] = useState(null);
  const [tab, setTab] = useState("looks");
  const [layer, setLayer] = useState(null);
  const { liked, onLike } = useLikes(d.setShops);
  useBackClose(layer, () => setLayer(null));
  const close = () => closeLayer(() => setLayer(null));

  const bandShops = useMemo(() => (myLocation ? withDistance.filter((s) => s._distanceKm != null && s._distanceKm <= 25) : withDistance), [withDistance, myLocation]);
  const local = useMemo(() => summarise(bandShops, { service: service === "all" ? undefined : service }), [bandShops, service]);
  const budgets = local.enough
    ? [["any", "Any price", Infinity], ["low", `Up to ${formatMoney(local.low, info.currency)}`, local.low], ["typical", `Up to ${formatMoney(local.high, info.currency)}`, local.high]]
    : [["any", "Any price", Infinity]];
  if (voiceMax) budgets.push(["voice", `Up to ${formatMoney(voiceMax, info.currency)}`, voiceMax]);
  const maxPrice = (budgets.find((b) => b[0] === budget) || budgets[0])[2];

  const words = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter((w) => w && !STOP.has(w)), [query]);
  const styleWords = useCallback((w) => (w.styleKey && styles[w.styleKey] ? [styles[w.styleKey].name, ...(styles[w.styleKey].aliases || [])] : []), [styles]);
  const svcName = useCallback((k) => (catalog.find((c) => c.key === k) || {}).name || "", [catalog]);
  const active = words.length > 0 || service !== "all" || budget !== "any";
  const byNear = (a, b) => (a._distanceKm ?? Infinity) - (b._distanceKm ?? Infinity);

  const looks = useMemo(() => withDistance.flatMap((s) => s.work.filter((w) => w.thumb).map((w) => ({ ...w, shop: s }))).filter((w) =>
    (service === "all" || w.serviceKey === service || (!w.serviceKey && (w.shop.services || []).includes(service))) &&
    (budget === "any" || (typeof w.price === "number" && w.price <= maxPrice)) &&
    (!words.length || words.every((x) => [w.name, svcName(w.serviceKey), ...styleWords(w), w.shop.salonName, w.shop.name, w.shop.area, w.shop.city].filter(Boolean).join(" ").toLowerCase().includes(x))))
    .sort((a, b) => byNear(a.shop, b.shop)), [withDistance, service, budget, maxPrice, words, styleWords, svcName]);
  const pros = useMemo(() => withDistance.filter((s) =>
    (service === "all" || (s.services || []).includes(service)) &&
    (budget === "any" || s.work.some((w) => typeof w.price === "number" && w.price <= maxPrice)) &&
    (!words.length || words.every((x) => [s.salonName, s.name, s.area, s.city, s.bio, ...(s.services || []).map(svcName), ...s.work.flatMap((w) => [w.name, ...styleWords(w)])].filter(Boolean).join(" ").toLowerCase().includes(x))))
    .sort(byNear), [withDistance, service, budget, maxPrice, words, styleWords, svcName]);
  const styleHits = useMemo(() => Object.entries(styles).filter(([, st]) =>
    (service === "all" || st.serviceKey === service) &&
    (!words.length || words.every((x) => [st.name, ...(st.aliases || [])].join(" ").toLowerCase().includes(x)))).map(([k, st]) => ({ key: k, ...st })), [styles, service, words]);

  const onVoice = (said) => {
    const v = parseVoice(said);
    setQuery(v.text);
    if (v.max) { setVoiceMax(v.max); setBudget("voice"); }
    if (v.nearMe) setUseLocation(true);
  };
  const openStyle = (k) => { learn("search", { styleKey: k, serviceKey: styles[k] && styles[k].serviceKey }); setLayer({ type: "inspiration", styleKey: k }); };
  const chip = (on, onClick, label, key) => (
    <button key={key || label} type="button" onClick={onClick} aria-pressed={on}
      className={"px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border " + (on ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>{label}</button>
  );
  const tabs = [["looks", `Looks (${looks.length})`], ["pros", `Professionals (${pros.length})`], ["styles", `Styles (${styleHits.length})`]];

  return (
    <div>
      <Nav />
      <div className="max-w-xl mx-auto px-4 pt-3 pb-16 space-y-4">
        <div className="flex gap-2">
          <input type="search" autoFocus value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search styles, professionals or areas"
            placeholder="Styles, professionals, areas…" className="flex-1 min-w-0 px-4 py-3 rounded-full border border-line bg-card shadow-sm" />
          <VoiceSearchButton onResult={onVoice} lang={d.country === "GB" ? "en-GB" : "en-GH"} />
        </div>

        {/* Budget appears once someone searches or picks a service: the first view is just the search box. */}
        {active && <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-extrabold tracking-wide text-plum uppercase">Your budget</div>
            <button onClick={() => setLayer({ type: "filters" })} className="text-xs font-bold text-hibiscus-deep">Compare prices ›</button>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">{budgets.map(([k, l]) => chip(budget === k, () => setBudget(k), l, k))}</div>
          <p className="text-xs text-muted mt-1">{local.enough ? `Typical ${where}: ${formatMoney(local.low, info.currency)}–${formatMoney(local.high, info.currency)}` : `Not enough prices ${where} yet to suggest a budget.`}</p>
        </div>}

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[["all", "All services"], ...catalog.map((c) => [c.key, c.name])].map(([k, l]) => chip(service === k, () => setService(k), l, k))}
        </div>

        {d.loading && <LoadingState label="Loading" />}
        {d.error && <ErrorState message={`We couldn't load results right now. (${d.error})`} onRetry={d.retry} />}

        {!d.loading && !d.error && !active && (
          <div>
            <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Explore styles</div>
            <div className="grid grid-cols-3 gap-2">
              {INSPIRATION_STYLES.filter((k) => styles[k]).map((k) => (
                <button key={k} onClick={() => openStyle(k)} className="relative rounded-xl overflow-hidden text-left" aria-label={styles[k].name}>
                  <img src={photosFor(k)[0].src} alt="" loading="lazy" className="w-full aspect-square object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[11px] font-bold p-1 truncate">{styles[k].name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!d.loading && !d.error && active && (
          <div>
            <div role="tablist" className="flex gap-2 overflow-x-auto no-scrollbar mb-3">{tabs.map(([k, l]) => chip(tab === k, () => setTab(k), l, k))}</div>
            {tab === "looks" && (looks.length
              ? <div className="grid grid-cols-3 gap-1">{looks.map((w) => (
                  <button key={likeKey(w)} onClick={() => setLayer({ type: "work", item: w })} className="relative" aria-label={`${w.name} by ${w.shop.salonName || w.shop.name}`}>
                    <img src={w.thumb} alt="" loading="lazy" className="w-full aspect-square object-cover" />
                  </button>))}</div>
              : <p className="text-sm text-muted">No looks match. Try another word, service or budget.</p>)}
            {tab === "pros" && (pros.length
              ? pros.map((s) => {
                  const priced = s.work.filter((w) => typeof w.price === "number");
                  return (
                    <button key={s._id} onClick={() => setLayer({ type: "pro", shop: s })} className="w-full flex items-center gap-3 py-3 border-b border-line text-left">
                      {s.profilePhoto ? <img src={s.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover border border-line" />
                        : <span className="w-12 h-12 rounded-full bg-violet text-white font-bold flex items-center justify-center">{(s.salonName || s.name).slice(0, 1).toUpperCase()}</span>}
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-ink truncate">{s.salonName || s.name} {s.verified && <span className="text-hibiscus-deep text-xs">✓</span>}</span>
                        <span className="block text-xs text-muted truncate">📍 {[s.area || s.city, formatDistance(s._distanceKm, s.country)].filter(Boolean).join(" · ")}{s.followerCount ? ` · ${s.followerCount} followers` : ""}</span>
                      </span>
                      {priced.length > 0 && <span className="text-sm font-bold text-ink whitespace-nowrap">from {formatMoney(Math.min(...priced.map((w) => w.price)), s.currency)}</span>}
                    </button>
                  );
                })
              : <p className="text-sm text-muted">No professionals match yet.</p>)}
            {tab === "styles" && (styleHits.length
              ? styleHits.map((st) => (
                  <button key={st.key} onClick={() => openStyle(st.key)} className="w-full flex items-center gap-3 py-3 border-b border-line text-left">
                    {photosFor(st.key).length ? <img src={photosFor(st.key)[0].src} alt="" className="w-12 h-12 rounded-xl object-cover" /> : <span className="w-12 h-12 rounded-xl bg-surface-2" />}
                    <span className="flex-1 min-w-0"><span className="block font-bold text-ink truncate">{st.name}</span><span className="block text-xs text-muted truncate">{svcName(st.serviceKey)}{st.aliases && st.aliases.length ? ` · also ${st.aliases.slice(0, 2).join(", ")}` : ""}</span></span>
                  </button>))
              : <p className="text-sm text-muted">No styles match.</p>)}
          </div>
        )}
      </div>

      {layer && (layer.type === "work" || layer.type === "pro") && (
        <ContextPanel selection={layer.type === "work" ? { type: "work", item: layer.item } : { type: "pro", shop: layer.shop }}
          onClose={close} onSelect={(sel) => setLayer(sel.type === "work" ? { type: "work", item: sel.item } : { type: "pro", shop: sel.shop })} likedIds={liked} onLike={onLike} />
      )}
      {layer && layer.type === "inspiration" && styles[layer.styleKey] && (
        <InspirationSheet styleKey={layer.styleKey} style={styles[layer.styleKey]} shops={withDistance} currency={info.currency} where={where} onClose={close}
          onShowInFeed={() => { const k = layer.styleKey; close(); setService(styles[k].serviceKey); setQuery(styles[k].name); setTab("looks"); }} />
      )}
      {layer && layer.type === "filters" && (
        <FiltersSheet local={local} budgets={budgets} budget={budget} setBudget={setBudget} currency={info.currency} where={where}
          service={service === "all" ? null : service} style={null} label={service !== "all" ? svcName(service) : null}
          onClose={close} onClear={() => { setBudget("any"); setVoiceMax(null); close(); }} />
      )}
    </div>
  );
}
