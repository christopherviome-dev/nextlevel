"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import RequestForm from "../../components/RequestForm";

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
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-line">
        <div className="font-display font-extrabold text-lg text-hibiscus-deep">SHEE<span className="text-violet">BA</span></div>
        {/* Deliberately a plain link, not next/link: this page is served through a Netlify rewrite,
            and Next.js navigation from here breaks (the bug fixed in commit ad6f851). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="px-4 py-2 rounded-full border border-line text-sm font-bold">Explore more shops →</a>
      </div>
      <div className="max-w-xl mx-auto px-5 pt-6">
        {error && <div className="text-plum/70 py-6">This shop isn't currently available.</div>}
        {!error && !shop && <div className="text-plum/70 py-6">Loading…</div>}
        {shop && (
          <div className="bg-white border border-line rounded-2xl p-5">
            <b className="text-lg">{shop.salonName || shop.name}</b>{" "}
            {shop.verified && <span className="text-xs font-bold text-hibiscus-deep">✓ Verified</span>}
            <div className="text-sm text-plum/80 mt-1">{shop.category} · {shop.area}</div>
            {shop.bio && <p className="mt-3 text-sm">{shop.bio}</p>}
            <div className="text-xs font-extrabold tracking-wide text-plum uppercase mt-5 mb-2">Services</div>
            {(shop.styles || []).filter((s) => s.active !== false).map((s) => (
              <div key={s.id} className="border border-line rounded-xl p-3 mb-2">
                <b>{s.name}</b> — GH₵{s.price} · {s.duration}
              </div>
            ))}
            <RequestForm shop={shop} />
          </div>
        )}
      </div>
    </div>
  );
}
