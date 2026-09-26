"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import RequestForm from "../../components/RequestForm";
import ThemeToggle from "../../components/ThemeToggle";
import { workModeLabel } from "../../lib/shop";
import { getClientId } from "../../lib/clientId";
import { formatMoney } from "../../lib/money";

export default function ShopView() {
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
    if (clientId) apiFetch(`/stylists/${id}/visit`, { method: "POST", body: JSON.stringify({ clientId }) }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4 bg-card border-b border-line">
        <div className="font-display font-extrabold text-lg text-hibiscus-deep">SHEE<span className="text-violet">BA</span></div>
        {/* Deliberately a plain link, not next/link: this page is served through a Netlify rewrite,
            and Next.js navigation from here breaks (the bug fixed in commit ad6f851). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <div className="flex items-center gap-2"><ThemeToggle /><a href="/" className="px-4 py-2 rounded-full border border-line text-sm font-bold">Explore more shops →</a></div>
      </div>
      <div className="max-w-xl mx-auto px-5 pt-6">
        {error && <div className="text-muted py-6">This shop isn't currently available.</div>}
        {!error && !shop && <div className="text-muted py-6">Loading…</div>}
        {shop && (
          <div className="bg-card border border-line rounded-2xl overflow-hidden">
            {shop.coverPhoto && <img src={shop.coverPhoto} alt="" className="w-full max-h-52 object-cover" />}
            <div className="p-5">
              <div className="flex items-center gap-3">
                {shop.profilePhoto && <img src={shop.profilePhoto} alt="" className="w-16 h-16 rounded-full object-cover border border-line shrink-0" />}
                <div className="min-w-0">
                  <b className="text-lg">{shop.salonName || shop.name}</b>{" "}
                  {shop.verified && <span className="text-xs font-bold text-hibiscus-deep">✓ Verified</span>}
                  <div className="text-sm text-muted-strong mt-0.5">{[shop.category, shop.area].filter(Boolean).join(" · ")}</div>
                </div>
              </div>
              {shop.availability !== "UNAVAILABLE" && shop.availability !== "AWAY" ? (
                <a href="#request" className="block text-center mt-4 py-3 rounded-full bg-hibiscus text-white font-bold">Book with {shop.salonName || shop.name}</a>
              ) : (
                <p className="mt-4 text-sm text-muted">{shop.salonName || shop.name} isn't taking bookings right now.</p>
              )}
              {(shop.workModes || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {shop.workModes.map((m) => <span key={m} className="text-xs px-3 py-1 rounded-full bg-surface-2 text-plum font-semibold">{workModeLabel(m)}</span>)}
                </div>
              )}
              {shop.bio && <p className="mt-3 text-sm whitespace-pre-line">{shop.bio}</p>}
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
              <div id="request" className="scroll-mt-24"><RequestForm shop={shop} /></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
