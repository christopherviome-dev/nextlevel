"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { RankList } from "./Charts";

const TYPE = { link: "A professional's marketing link", invite: "An invite code", look: 'A shared "Book this look" card', shop: "A shop's own link", direct: "Came on their own", rebook: '"Book again"', unknown: "Before sources were recorded" };
const CHANNEL = { WHATSAPP: "WhatsApp", INSTAGRAM: "Instagram", TIKTOK: "TikTok", FACEBOOK: "Facebook", BUSINESS_CARD: "Business card", QR_POSTER: "Flyer or poster", DIRECT_LINK: "Direct message", OTHER: "Other" };
const named = (list, map) => (list || []).map((x) => ({ ...x, name: map[x.key] || x.key }));
const Card = ({ title, children }) => <div className="bg-card border border-line rounded-2xl p-4"><div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-3">{title}</div>{children}</div>;

// Where sign-ups and bookings come from, to see what's working.
export default function AdminSources({ days }) {
  const [o, setO] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { apiFetch(`/analytics/sources?days=${days}`).then(setO).catch((e) => setError(e.message)); }, [days]);
  if (error) return <p className="text-bad-fg">{error}</p>;
  if (!o) return <p className="text-muted">Adding it up…</p>;
  const su = o.signups;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[[su.professionals.total, "professionals joined"], [su.customers.total, "customers joined"], [su.inPersonFieldWork, "signed up in person (field work)"], [o.bookings.total, "bookings"]].map(([n, l]) => (
          <div key={l} className="bg-card border border-line rounded-2xl p-4"><div className="text-3xl font-extrabold text-ink">{n}</div><div className="text-sm text-muted-strong">{l}</div></div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Where professionals came from"><RankList items={named(su.professionals.byType, TYPE)} />{su.professionals.linkChannels.length > 0 && <div className="mt-4"><div className="text-xs font-bold text-plum mb-2">Through links, by channel</div><RankList items={named(su.professionals.linkChannels, CHANNEL)} /></div>}</Card>
        <Card title="Where customers came from"><RankList items={named(su.customers.byType, TYPE)} />{su.customers.linkChannels.length > 0 && <div className="mt-4"><div className="text-xs font-bold text-plum mb-2">Through links, by channel</div><RankList items={named(su.customers.linkChannels, CHANNEL)} /></div>}</Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Where bookings came from"><RankList items={named(o.bookings.byType, TYPE)} />{o.bookings.linkChannels.length > 0 && <div className="mt-4"><div className="text-xs font-bold text-plum mb-2">Through links, by channel</div><RankList items={named(o.bookings.linkChannels, CHANNEL)} /></div>}</Card>
        <Card title="Websites that sent people"><RankList items={su.referrerSites} empty="None recorded yet. (WhatsApp usually doesn't say, so those show as shared links or 'came on their own'.)" /></Card>
      </div>
      <Card title="Marketing links that work best">
        {o.marketingLinks.length === 0 ? <p className="text-sm text-muted">No link activity in this period.</p> : o.marketingLinks.map((l) => (
          <div key={l.key} className="flex justify-between gap-2 text-sm py-1.5 border-b border-line last:border-0">
            <span className="text-ink truncate">{l.label} <span className="text-muted">· {CHANNEL[l.channel] || l.channel}{l.shop ? ` · ${l.shop}` : ""}</span></span>
            <span className="whitespace-nowrap"><b>{l.visits}</b> visits · <b className="text-ok-fg">{l.bookings}</b> bookings</span>
          </div>
        ))}
      </Card>
      <Card title="Shops whose shared links bring bookings"><RankList items={o.shopsBringingBookings} format={(n) => `${n} booking${n === 1 ? "" : "s"}`} empty="None in this period." /></Card>
    </div>
  );
}
