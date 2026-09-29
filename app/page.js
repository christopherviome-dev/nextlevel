"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";
import Nav from "../components/Nav";
import SiteFooter from "../components/SiteFooter";
import { LoadingState, EmptyState, ErrorState } from "../components/States";
import { INSPIRATION_STYLES } from "../lib/catalog";
import { personalize, scoreWork } from "../lib/personalize";
import { interests, learn } from "../lib/interests";
import { useAuth } from "../context/AuthContext";
import { likeKey } from "../lib/clientId";
import { useLikes } from "../lib/useLikes";
import { useDiscoverData } from "../lib/useDiscoverData";
import { useFollowing } from "../lib/useFollowing";
import { useBackClose, closeLayer } from "../lib/useBackClose";
import { track } from "../lib/track";
import ServiceRoller from "../components/discover/ServiceRoller";
import ServicesSheet from "../components/discover/ServicesSheet";
import FeedPost from "../components/discover/FeedPost";
import InspirationPost from "../components/discover/InspirationPost";
import InspirationSheet from "../components/discover/InspirationSheet";
import ContextPanel from "../components/discover/ContextPanel";
import ReelSheet from "../components/reel/ReelSheet";
import { formatMoney } from "../lib/money";

const PAGE = 12;          // posts shown at first, and added each time you reach the end
const INSPIRE_EVERY = 5;  // an inspiration post after every 5 work posts

// Spread work across professionals so one busy shop can't fill the feed.
function interleave(shops) {
  const queues = shops.map((s) => s.work.filter((w) => w.thumb).map((w) => ({ ...w, shop: s })));
  const out = [];
  for (let added = true; added;) { added = false; for (const q of queues) if (q.length) { out.push(q.shift()); added = true; } }
  return out;
}

// Discover: one vertical feed, like Instagram and TikTok. Services roll across
// the top; everything else (search, budgets) lives behind the Search button.
export default function Discover() {
  const router = useRouter();
  const { customerToken } = useAuth();
  const d = useDiscoverData();
  const { styles, catalog, withDistance, info, where, myLocation } = d;
  const { following, toggle: toggleFollow } = useFollowing();
  const [service, setService] = useState("all");
  const [style, setStyle] = useState(null);
  const [layer, setLayer] = useState(null);
  const [shown, setShown] = useState(PAGE);
  const [prefs, setPrefs] = useState(null);
  const [learned] = useState(() => (typeof window === "undefined" ? null : interests())); // read once per visit: no reshuffling mid-browse
  const { liked, onLike } = useLikes(d.setShops);
  const sentinel = useRef(null);
  const [now] = useState(() => Date.now()); // for "New" badges

  useEffect(() => {
    if (!customerToken) return;
    apiFetch("/customers/me", {}, "customer").then((me) => setPrefs({ feedFor: me.feedFor || null, favourites: me.favourites || [] })).catch(() => {});
  }, [customerToken]);

  // Tapping Discover again returns to the start of the feed.
  const goHome = useCallback(() => { setLayer(null); setService("all"); setStyle(null); setShown(PAGE); }, []);
  useEffect(() => {
    window.addEventListener("sheeba:discover-home", goHome);
    return () => window.removeEventListener("sheeba:discover-home", goHome);
  }, [goHome]);
  useBackClose(layer, () => setLayer(null));
  const close = () => closeLayer(() => setLayer(null));

  const ctx = useMemo(() => ({ prefs, learned, styles }), [prefs, learned, styles]);
  const work = useMemo(() => {
    const list = interleave(withDistance).filter((w) =>
      (service === "all" || w.serviceKey === service || (!w.serviceKey && (w.shop.services || []).includes(service))) && (!style || w.styleKey === style));
    return myLocation ? [...list].sort((a, b) => (a.shop._distanceKm ?? Infinity) - (b.shop._distanceKm ?? Infinity)) : personalize(list, (x) => scoreWork(x, ctx));
  }, [withDistance, service, style, myLocation, ctx]);
  const inspiration = useMemo(() => INSPIRATION_STYLES.filter((k) => styles[k] && (service === "all" || styles[k].serviceKey === service) && (!style || k === style)), [styles, service, style]);
  const feed = useMemo(() => {
    const out = [];
    let ins = 0;
    work.forEach((w, i) => {
      out.push({ kind: "work", key: likeKey(w), item: w });
      if ((i + 1) % INSPIRE_EVERY === 0 && inspiration.length) out.push({ kind: "inspire", key: `i-${i}`, styleKey: inspiration[ins++ % inspiration.length] });
    });
    if (!work.length) inspiration.forEach((k) => out.push({ kind: "inspire", key: `i-${k}`, styleKey: k }));
    return out;
  }, [work, inspiration]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setShown((n) => n + PAGE); }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [feed.length]);

  const onMessage = async (shop) => {
    if (!customerToken) { router.push("/requests"); return; } // sign in to message
    try { const conv = await apiFetch("/conversations", { method: "POST", body: JSON.stringify({ stylistId: shop._id }) }, "customer"); router.push(`/messages?c=${conv._id}`); }
    catch (e) { /* e.g. too many new conversations today: stay put */ }
  };
  const openWork = (item) => { learn("view", { styleKey: item.styleKey, serviceKey: item.serviceKey }); setLayer({ type: "work", item }); };
  // Newest professionals first (last 60 days), as "Shop name · Area" for the moving strip.
  const newPros = d.shops.filter((x) => x.joinedAt && x.joinedAt > (now || 0) - 60 * 86400000)
    .sort((a, b) => b.joinedAt - a.joinedAt).slice(0, 12)
    .map((x) => ({ key: String(x._id), name: [x.salonName || x.name, x.area || x.city].filter(Boolean).join(" · ") }));
  const openPro = (shop) => { learn("view", { services: shop.services }); setLayer({ type: "pro", shop }); };
  const services = catalog.map((c) => ({ key: c.key, name: c.name }));
  const chosen = catalog.find((c) => c.key === service);

  return (
    <div>
      <Nav />
      <div className="max-w-xl md:max-w-4xl xl:max-w-6xl mx-auto sm:px-4 pt-3 pb-4">
        <div className="px-4 sm:px-0 space-y-3 mb-3">
          {/* Stupidly simple: one button opens every service; the moving strip shows who just joined. */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLayer({ type: "services" })} className="shrink-0 px-4 py-2 rounded-full bg-violet text-white text-sm font-bold">☰ All services</button>
            {chosen && <button type="button" onClick={() => { setService("all"); setStyle(null); setShown(PAGE); }} aria-label={`Showing ${chosen.name}. Tap to show everything`} className="shrink-0 px-4 py-2 rounded-full border border-violet text-violet text-sm font-bold">{chosen.name} ✕</button>}
          </div>
          {newPros.length > 0 && (
            <div>
              <div className="text-xs font-bold text-muted mb-1">New on Sheeba</div>
              <ServiceRoller services={newPros} selected={null} onSelect={(id) => { const shop = d.shops.find((x) => String(x._id) === id); if (shop) openPro(shop); }} />
            </div>
          )}
          {chosen && (chosen.styles || []).length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {chosen.styles.map((st) => (
                <button key={st.key} type="button" onClick={() => setStyle(style === st.key ? null : st.key)} aria-pressed={style === st.key}
                  className={"px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border " + (style === st.key ? "bg-hibiscus text-white border-hibiscus" : "bg-surface text-plum border-line")}>{st.name}</button>
              ))}
            </div>
          )}
          {d.locError && <p className="text-xs text-bad-fg">{d.locError}</p>}
        </div>

        {d.loading && <LoadingState label="Loading Discover" />}
        {d.error && <ErrorState message={`We couldn't load Discover right now. (${d.error})`} onRetry={d.retry} />}
        {!d.loading && !d.error && feed.length === 0 && (
          <div className="px-4"><EmptyState title={d.shops.length ? "Nothing here yet" : `No shops in ${info.name} yet`} hint={d.shops.length ? "Try another service." : "New professionals are joining. You can change your country in Settings."} actionLabel={d.shops.length ? "Show everything" : undefined} onAction={d.shops.length ? goHome : undefined} /></div>
        )}
        {/* Phones: one column. Tablets and laptops: a grid of 2, wide screens 3. */}
        <div className="md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-5 md:items-start">
        {!d.loading && !d.error && feed.slice(0, shown).map((f) => f.kind === "work"
          ? <FeedPost key={f.key} item={f.item} liked={liked.has(f.key)} onLike={onLike} onOpenWork={openWork} onOpenPro={openPro}
              following={following.has(String(f.item.shop._id))} onFollow={toggleFollow} onMessage={onMessage}
              onOpenReel={(item) => setLayer({ type: "reel", item })}
              styleName={f.item.styleKey && styles[f.item.styleKey] ? styles[f.item.styleKey].name : null} now={now} />
          : <InspirationPost key={f.key} styleKey={f.styleKey} style={styles[f.styleKey]} onOpen={() => { track("inspiration", f.styleKey); setLayer({ type: "inspiration", styleKey: f.styleKey }); }} />)}
        </div>
        {shown < feed.length && <div ref={sentinel} className="h-10" aria-hidden />}
        {!d.loading && feed.length > 0 && shown >= feed.length && <p className="text-center text-xs text-muted py-6">You're all caught up ✨</p>}
      </div>
      <SiteFooter />

      {layer && (layer.type === "work" || layer.type === "pro") && (
        <ContextPanel selection={layer.type === "work" ? { type: "work", item: layer.item } : { type: "pro", shop: layer.shop }}
          onClose={close} onSelect={(sel) => setLayer(sel.type === "work" ? { type: "work", item: sel.item } : { type: "pro", shop: sel.shop })} likedIds={liked} onLike={onLike} />
      )}
      {layer && layer.type === "reel" && (
        <ReelSheet title={layer.item.styleKey && styles[layer.item.styleKey] ? styles[layer.item.styleKey].name : layer.item.name}
          byline={layer.item.shop.salonName || layer.item.shop.name} place={layer.item.shop.area || layer.item.shop.city}
          price={typeof layer.item.price === "number" ? formatMoney(layer.item.price, layer.item.shop.currency) : null}
          link={`${window.location.origin}/shop/${layer.item.shop._id}?look=${encodeURIComponent(layer.item.id)}#request`}
          load={() => apiFetch(`/reels/service/${layer.item.shop._id}/${layer.item.id}`)} onClose={close} />
      )}
      {layer && layer.type === "services" && (
        <ServicesSheet services={catalog} shops={d.shops} selected={service} onClose={close}
          onPick={(k) => { setService(k); setStyle(null); setShown(PAGE); close(); }} />
      )}
      {layer && layer.type === "inspiration" && styles[layer.styleKey] && (
        <InspirationSheet styleKey={layer.styleKey} style={styles[layer.styleKey]} shops={withDistance} currency={info.currency} where={where} onClose={close}
          onShowInFeed={() => { const k = layer.styleKey; close(); setService(styles[k].serviceKey); setStyle(k); setShown(PAGE); window.scrollTo({ top: 0 }); }} />
      )}
    </div>
  );
}
