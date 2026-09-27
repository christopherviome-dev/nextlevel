"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import Nav from "../../components/Nav";
import CustomerGate from "../../components/customer/CustomerGate";
import ProCard from "../../components/discover/ProCard";
import { EmptyState, LoadingState } from "../../components/States";

export default function SavedPage() {
  return <CustomerGate title="Following"><Saved /></CustomerGate>;
}

function Saved() {
  const [shops, setShops] = useState(null);
  const [me, setMe] = useState(null);
  const load = useCallback(() => {
    apiFetch("/customers/me/following", {}, "customer").then(setShops).catch(() => setShops([]));
    apiFetch("/customers/me", {}, "customer").then(setMe).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const unsave = async (shop) => {
    if (!me) return;
    await apiFetch(`/stylists/${shop._id}/follow?lean=1`, { method: "POST", body: JSON.stringify({ clientId: me._id }) }, "customer");
    load();
  };

  return (
    <div>
      <Nav />
      <div className="max-w-5xl mx-auto px-5 pt-6 pb-16">
        <h1 className="font-display font-extrabold text-xl text-ink mb-4">Following</h1>
        {!shops && <LoadingState label="Loading" />}
        {shops && shops.length === 0 && (
          <EmptyState title="You're not following anyone yet" hint={'Tap the "+" on any post, or "Follow" on a shop, and they\'ll be here.'} actionLabel="Browse Discover" actionHref="/" />
        )}
        {shops && shops.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {shops.map((s) => (
              <div key={s._id} className="relative">
                {/* Plain navigation: shop pages load through the Netlify redirect rule. */}
                <ProCard shop={{ ...s, _distanceKm: null }} wide onOpen={() => { window.location.href = `/shop/${s._id}`; }} />
                <button onClick={() => unsave(s)} className="absolute top-2 right-2 px-3 py-1 rounded-full bg-black/55 text-white text-xs font-bold">Unfollow</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
