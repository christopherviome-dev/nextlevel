"use client";
import { titleOf } from "../../lib/titles";
import { ringStyle } from "../../lib/founding";
import IdCheckedBadge from "../../components/IdCheckedBadge";
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import RequestForm from "../../components/RequestForm";
import ThemeToggle from "../../components/ThemeToggle";
import { workModeLabel } from "../../lib/shop";
import { getClientId } from "../../lib/clientId";
import { formatMoney } from "../../lib/money";
import SaveShopButton from "../../components/customer/SaveShopButton";
import ReportForm from "../../components/ReportForm";
import MessageButton from "../../components/customer/MessageButton";
import ApprenticeWorkGallery from "../../components/ApprenticeWorkGallery";
import { useAuth } from "../../context/AuthContext";
import { useCatalog } from "../../lib/catalog";

export default function ShopView() {
  const catalog = useCatalog();
  const { customerToken } = useAuth();
  const [shop, setShop] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // This page is reached via a Netlify rewrite (see _redirects): the
    // browser's real address bar still shows /shop/<id>, so we read the
    // real id directly from window.location rather than from Next.js's own
    // route params, which don't know about this URL at build time.
    const match = window.location.pathname.match(/^\/shop\/([^/]+)\/?$/);
    const id = match ? match[1] : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the shop id only exists in the browser URL
    if (!id) { setError("No shop specified."); return; }
    apiFetch(`/stylists/${id}`).then(setShop).catch((e) => setError(e.message));
    // Count this visit (anonymously; the server counts one per browser per 30 minutes).
    // It's what makes "Popular this week" on Discover real. Failure is harmless.
    const clientId = getClientId();
    // The visit carries a marketing-link code (?ref=) when there is one, so the professional's link gets credit.
    const ref = new URLSearchParams(window.location.search).get("ref") || undefined;
    if (clientId) apiFetch(`/stylists/${id}/visit`, { method: "POST", body: JSON.stringify({ clientId, ref }) }).catch(() => {});
  }, []);

  return (
    <div className="pb-24 sm:pb-0">
      <div className="flex items-center justify-between px-5 py-4 bg-card border-b border-line">
        <div className="font-display font-extrabold text-lg text-hibiscus-deep">ME<span className="text-violet">PLUGE</span></div>
        {/* Deliberately a plain link, not next/link: this page is served through a Netlify rewrite,
            and Next.js navigation from here breaks (the bug fixed in commit ad6f851). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <div className="flex items-center gap-2"><ThemeToggle /><a href="/" className="hidden sm:inline-block px-4 py-2 rounded-full bg-violet text-white text-sm font-bold">✨ Explore Mepluge</a></div>
      </div>
      <div className="max-w-xl lg:max-w-5xl mx-auto px-5 pt-6">
        {error && <div className="text-muted py-6">This shop isn't currently available.</div>}
        {!error && !shop && <div className="text-muted py-6">Loading…</div>}
        {shop && (
          <div className="bg-card border border-line rounded-2xl overflow-hidden">
            {shop.coverPhoto && <img src={shop.coverPhoto} alt="" className="w-full max-h-52 lg:max-h-80 object-cover" />}
            <div className="p-5">
              <div className="flex items-center gap-3">
                {shop.profilePhoto && <img src={shop.profilePhoto} alt="" style={ringStyle(shop)} className="w-16 h-16 rounded-full object-cover border border-line shrink-0" />}
                <div className="min-w-0">
                  <b className="text-lg">{shop.salonName || shop.name}</b>{" "}
                  {shop.verified && <IdCheckedBadge label />}
                  <div className="text-sm text-muted-strong mt-0.5">{[(shop.services && shop.services.length ? titleOf(shop.services, catalog) : shop.category), [shop.area, shop.city].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</div>
                </div>
              </div>
              {shop.availability !== "UNAVAILABLE" && shop.availability !== "AWAY" ? (
                <a href="#request" className="block text-center mt-4 py-3 rounded-full bg-hibiscus text-white font-bold">Book with {shop.salonName || shop.name}</a>
              ) : (
                <p className="mt-4 text-sm text-muted">{shop.salonName || shop.name} isn't taking bookings right now.</p>
              )}
              <div className="flex justify-end gap-2 mt-3"><MessageButton stylistId={shop._id} /><SaveShopButton shopId={shop._id} services={shop.services} /></div>
              {shop.stats && (shop.stats.loves > 0 || shop.stats.completedJobs > 0) && (
                <div className="text-sm text-muted-strong mt-2">
                  {shop.stats.rating && <span className="text-amber-600 font-bold">★ {shop.stats.rating.average} <span className="font-normal text-muted">({shop.stats.rating.count} ratings)</span></span>}
                  {shop.stats.loves > 0 && <span>♥ {shop.stats.loves} {shop.stats.loves === 1 ? "like" : "likes"}</span>}
                  {shop.stats.loves > 0 && shop.stats.completedJobs > 0 && " · "}
                  {shop.stats.completedJobs > 0 && <span>{shop.stats.completedJobs} {shop.stats.completedJobs === 1 ? "job" : "jobs"} done on Mepluge</span>}
                </div>
              )}
              {(shop.pendingServices || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {shop.pendingServices.map((p) => { const n = typeof p === "string" ? p : p.name; return <span key={n} className="text-xs px-3 py-1 rounded-full bg-surface-2 text-plum font-semibold">{n}</span>; })}
                </div>
              )}
              {(shop.workModes || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {shop.workModes.map((m) => <span key={m} className="text-xs px-3 py-1 rounded-full bg-surface-2 text-plum font-semibold">{workModeLabel(m)}</span>)}
                </div>
              )}
              {shop.bio && <p className="mt-3 text-sm whitespace-pre-line">{shop.bio}</p>}
              <div className="lg:grid lg:grid-cols-[1fr_24rem] lg:gap-8 lg:items-start">
              <div>
              <div className="text-xs font-extrabold tracking-wide text-plum uppercase mt-5 mb-2">Services</div>
              {(shop.styles || []).filter((s) => s.active !== false).map((s) => (
                <div key={s.id} className="border border-line rounded-xl p-3 mb-2 flex gap-3">
                  {s.photo && <img src={s.photo} alt={s.name} className="w-20 h-20 rounded-lg object-cover border border-line shrink-0" />}
                  <div className="min-w-0">
                    <b>{s.name}</b>
                    <div className="text-sm text-muted-strong">{formatMoney(s.price, shop.currency)}{s.duration ? ` · ${s.duration}` : ""}</div>
                    {s.desc && <div className="text-sm text-muted mt-1">{s.desc}</div>}
                  </div>
                </div>
              ))}
              <ApprenticeWorkGallery shopId={shop._id} shopName={shop.salonName || shop.name} />
              </div>
              <div id="request" className="scroll-mt-24 lg:sticky lg:top-24 lg:mt-5"><RequestForm shop={shop} /></div>
              </div>
              <ReportForm stylistId={shop._id} name={shop.salonName || shop.name} country={shop.country} actor={customerToken ? "customer" : null} />
            </div>
          </div>
        )}
      </div>
      {/* Someone who arrives from a shared link has no menu here, so on phones two big
          buttons stay within thumb reach: book, or explore more looks (stupidly simple). */}
      {shop && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-line px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex gap-3">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="flex-1 text-center px-4 py-3 rounded-full border-2 border-violet text-violet font-bold">✨ Explore looks</a>
          <a href="#request" className="flex-1 text-center px-4 py-3 rounded-full bg-hibiscus text-white font-bold">Book</a>
        </div>
      )}
    </div>
  );
}
