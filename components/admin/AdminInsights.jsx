"use client";
import { formatMoney } from "../../lib/money";
import { DailyBars, RankList } from "./Charts";

const Card = ({ title, children, className = "" }) => (
  <div className={"bg-card border border-line rounded-2xl p-4 " + className}>
    {title && <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-3">{title}</div>}
    {children}
  </div>
);
const Stat = ({ n, label, hint, tone }) => (
  <div className="bg-card border border-line rounded-2xl p-4">
    <div className={"text-3xl font-extrabold " + (tone === "bad" ? "text-bad-fg" : "text-ink")}>{n}</div>
    <div className="text-sm text-muted-strong">{label}</div>
    {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
  </div>
);
const money = (obj) => Object.entries(obj || {}).map(([c, v]) => formatMoney(v, c)).join(" + ") || formatMoney(0, "GHS");
const pct = (n) => (n == null ? "—" : `${n}%`);
const STATUS = { pending: "Waiting for reply", accepted: "Accepted", completed: "Completed", declined: "Declined", cancelled: "Cancelled", open: "Open to all" };

export function Overview({ o, go }) {
  const m = o.members, b = o.bookings, t = o.trust;
  const change = m.changePercent == null ? "first period" : `${m.changePercent >= 0 ? "▲" : "▼"} ${Math.abs(m.changePercent)}% vs the ${o.days} days before`;
  const f = m.founding;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat n={m.total} label="Members" hint={`${m.professionals} professionals · ${m.customers} customers`} />
        <Stat n={m.newInWindow} label={`New in ${o.days} days`} hint={change} />
        <Stat n={m.liveShops} label="Live shops" hint={`${m.verified} verified · ${m.awaitingApproval} waiting`} />
        <Stat n={b.inWindow} label={`Bookings in ${o.days} days`} hint={`${b.total} all time`} />
      </div>
      <Card title="Founding members">
        <div className="flex items-end justify-between gap-3 mb-2"><div className="text-2xl font-extrabold text-ink">{f.count} <span className="text-base text-muted">of {f.limit}</span></div><div className="text-xs text-muted">Latest member number: #{f.latestNumber}</div></div>
        <div className="h-3 rounded-full bg-surface-2 overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (f.count / f.limit) * 100)}%` }} /></div>
      </Card>
      <Card title={`Signups, last ${o.days} days`}>
        <DailyBars data={o.growth} keys={["professionals", "customers"]} colors={["var(--color-violet)", "var(--color-hibiscus)"]} labels={["professionals", "customers"]} />
      </Card>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Bookings">
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div><div className="text-2xl font-extrabold text-ink">{pct(b.acceptanceRate)}</div><div className="text-xs text-muted">accepted</div></div>
            <div><div className="text-2xl font-extrabold text-ink">{pct(b.completionRate)}</div><div className="text-xs text-muted">completed (all time)</div></div>
            <div><div className="text-2xl font-extrabold text-ink">{pct(b.completionRateWindow)}</div><div className="text-xs text-muted">completed ({o.days} days)</div></div>
          </div>
          <RankList items={Object.entries(b.byStatus).map(([key, count]) => ({ key, name: STATUS[key] || key, count }))} />
        </Card>
        <Card title="Recorded service value">
          <div className="text-2xl font-extrabold text-ink">{money(b.valueInWindow)}</div>
          <div className="text-xs text-muted mb-3">in the last {o.days} days · {money(b.valueAllTime)} all time. From prices recorded at booking; Sheeba takes no payments.</div>
          <div className="text-xs font-bold text-plum mb-2">Most requested this period</div>
          <RankList items={b.topServices} empty="No bookings in this period." />
        </Card>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Trust & safety">
          <button onClick={() => go("reports")} className="w-full flex justify-between text-sm py-1.5"><span>Open reports</span><b className={t.urgentOpen ? "text-bad-fg" : "text-ink"}>{t.openReports}{t.urgentOpen ? ` (${t.urgentOpen} urgent)` : ""}</b></button>
          <button onClick={() => go("ids")} className="w-full flex justify-between text-sm py-1.5"><span>IDs to check</span><b>{t.pendingVerifications}</b></button>
          <button onClick={() => go("passwords")} className="w-full flex justify-between text-sm py-1.5"><span>Password help</span><b>{t.passwordHelp}</b></button>
          <div className="flex justify-between text-sm py-1.5"><span>Restricted accounts</span><b>{m.restricted}</b></div>
        </Card>
        <Card title="Engagement">
          <div className="flex justify-between text-sm py-1.5"><span>Likes</span><b>{o.engagement.likes}</b></div>
          <div className="flex justify-between text-sm py-1.5"><span>Follows</span><b>{o.engagement.follows}</b></div>
          <div className="flex justify-between text-sm py-1.5"><span>Conversations</span><b>{o.engagement.conversations}</b></div>
          <button onClick={() => go("invites")} className="w-full flex justify-between text-sm py-1.5"><span>Invites confirmed</span><b>{o.invites.VALIDATED || 0}</b></button>
        </Card>
        <Card title="Training">
          <div className="flex justify-between text-sm py-1.5"><span>Apprentices training</span><b>{m.apprentices}</b></div>
          <div className="flex justify-between text-sm py-1.5"><span>Graduated</span><b>{m.graduates}</b></div>
          <div className="flex justify-between text-sm py-1.5"><span>Skills signed off</span><b>{o.training.skillsSignedOff}</b></div>
          <div className="flex justify-between text-sm py-1.5"><span>Work photos posted</span><b>{o.training.worksPosted}</b></div>
        </Card>
      </div>
    </div>
  );
}

export function Places({ o, go }) {
  const p = o.places;
  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Live shops by country"><RankList items={p.shopsByCountry} /></Card>
        <Card title="Customers by country"><RankList items={p.customersByCountry} /></Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Live shops by city">
          <RankList items={p.shopsByCity} sub={(x) => x.country} />
          {p.shopsWithoutCity > 0 && <p className="text-xs text-muted mt-3">{p.shopsWithoutCity} live shop{p.shopsWithoutCity === 1 ? " hasn't" : "s haven't"} set a city yet.</p>}
        </Card>
        <Card title="Live shops by area"><RankList items={p.shopsByArea} /></Card>
      </div>
      <button onClick={() => go("map")} className="w-full py-3 rounded-full bg-violet text-white font-bold">See them on the map</button>
    </div>
  );
}

export function Demand({ o }) {
  const d = o.demand;
  return (
    <div className="space-y-4">
      <Card title="Wanted but scarce" className="border-warn-line">
        <p className="text-xs text-muted mb-3">Styles people search for or open most, compared with how many live shops offer them. The top of this list is where to recruit professionals next.</p>
        <RankList items={d.wantedButScarce} format={(n) => `${n} interested`} sub={(x) => `${x.shops} shop${x.shops === 1 ? "" : "s"} offer it`} empty="Not enough searches yet. This fills in as people use Search." />
      </Card>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title={`Most searched (${o.days} days)`}><RankList items={d.topSearched} empty="No searches yet." /></Card>
        <Card title={`Most opened (${o.days} days)`}><RankList items={d.topOpened} empty="No styles opened yet." /></Card>
        <Card title="Most liked"><RankList items={d.topLoved} empty="No likes yet." /></Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Live shops offering each service"><RankList items={d.offeredByService} /></Card>
        <Card title="Styles most offered"><RankList items={d.mostOfferedStyles} empty="No styles tagged yet." /></Card>
      </div>
      <p className="text-xs text-muted">Searches and opened styles are counted anonymously: just the style and the day, never who.</p>
    </div>
  );
}
