"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

// Growth & capacity: how full things are, what to do next, how, and where.
const GUIDES = {
  database: ["Upgrade the database (and get daily backups)", [
    "Open MongoDB Atlas (link below) and sign in.",
    "Open Cluster0 and choose Upgrade. Pick the smallest paid tier (Flex or M10); keep the region in Europe.",
    "Confirm. Paid tiers include automatic daily backups. Your data stays where it is.",
    "In Render, open mepluge-api → Environment, add DB_LIMIT_MB (the new size in MB, e.g. 5120) and DB_BACKUPS = on. This page will then measure against the new size.",
  ]],
  server: ["Upgrade the server", [
    "Open Render (link below) → mepluge-api → Settings → Instance Type.",
    "Choose the next size up (Standard, 2 GB) and save. It restarts in about a minute, with no downtime (the health check waits for it).",
    "In Environment, set SERVER_MEMORY_MB to the new memory (e.g. 2048) so this page measures correctly.",
    "Before adding MORE than one server, ask Claude first: a few things (like anti-spam limits) need a small change.",
  ]],
  photos: ["Move photos to cloud storage", [
    "Create a free Cloudflare account (link below) and open R2 (storage).",
    "Ask Claude to set it up: Claude builds the move and tells you exactly which keys to add in Render.",
    "Photos then load faster from servers near people, and the database stays small.",
  ]],
  uptime: ["Get an alert if Mepluge goes down", [
    "Create a free UptimeRobot account (link below).",
    "Add a monitor: type HTTPS, address https://mepluge-api.onrender.com/api/health, every 5 minutes.",
    "Add your phone (app), email or Telegram as the alert contact.",
  ]],
  domain: ["Use your own address (mepluge.com)", [
    "Buy mepluge.com (Cloudflare or Porkbun).",
    "In Netlify: Domain management → Add domain → mepluge.com, and follow its DNS steps.",
    "In Render: mepluge-api → Settings → Custom Domains → api.mepluge.com, and add the DNS record it shows.",
    "Tell Claude: it switches the app to the new addresses (one line each) and updates link previews and Google sign-in.",
  ]],
};
const LINKS = [
  ["Render (servers)", "https://dashboard.render.com"], ["MongoDB Atlas (database)", "https://cloud.mongodb.com"], ["Netlify (website)", "https://app.netlify.com"],
  ["GitHub (code)", "https://github.com/christopherviome-dev"], ["Cloudflare (domain, photo storage)", "https://dash.cloudflare.com"], ["UptimeRobot (monitoring)", "https://uptimerobot.com"],
  ["Google Cloud (Google sign-in)", "https://console.cloud.google.com"], ["Anthropic (assistant AI)", "https://console.anthropic.com"], ["Telegram BotFather (bot)", "https://t.me/BotFather"],
];
const LEVEL = { now: ["Do now", "bg-bad-bg border-bad-line text-bad-fg"], soon: ["Plan soon", "bg-warn-bg border-warn-line text-warn-fg"], ok: ["Fine", "bg-ok-bg border-ok-line text-ok-fg"] };

function Meter({ label, used, total, unit = "MB" }) {
  const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct >= 75 ? "bg-bad-fg" : pct >= 50 ? "bg-amber-500" : "bg-emerald-600";
  return (
    <div className="bg-card border border-line rounded-2xl p-4">
      <div className="flex justify-between text-sm"><b className="text-ink">{label}</b><span className="text-muted-strong">{used} of {total} {unit} · {pct}%</span></div>
      <div className="h-2.5 rounded-full bg-surface-2 mt-2 overflow-hidden"><div className={"h-full rounded-full " + color} style={{ width: pct + "%" }} /></div>
    </div>
  );
}

export default function Capacity() {
  const [c, setC] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { apiFetch("/analytics/capacity").then(setC).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="text-bad-fg">{error}</p>;
  if (!c) return <p className="text-muted">Measuring…</p>;
  const order = { now: 0, soon: 1, ok: 2 };
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-3">
        {c.db && <Meter label="Database" used={c.db.usedMB} total={c.limits.dbMB} />}
        <Meter label="Server memory" used={c.server.memoryMB} total={c.limits.serverMB} />
      </div>
      <p className="text-xs text-muted -mt-2">Shop photos use {c.photosMB ?? "?"} MB of the database. Other databases on the same Atlas cluster (like demo data) also count toward its limit.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[[c.counts.professionals, "professionals"], [c.counts.customers, "customers"], [c.counts.bookings30, "bookings, last 30 days"], [c.counts.phones, "phones with alerts"]].map(([n, l]) => (
          <div key={l} className="bg-card border border-line rounded-2xl p-3"><div className="text-2xl font-extrabold text-ink">{n}</div><div className="text-xs text-muted-strong">{l}</div></div>
        ))}
      </div>
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">What to do next</div>
        <div className="space-y-2">
          {[...c.advice].sort((a, b) => order[a.level] - order[b.level]).map((a, i) => (
            <div key={i} className={"rounded-xl border p-3 text-sm " + LEVEL[a.level][1]}>
              <b>{LEVEL[a.level][0]} · {a.area}:</b> <span className="text-ink">{a.text}</span>
              {a.guide && <a href={"#guide-" + a.guide} className="ml-1 underline font-bold">How →</a>}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Guides</div>
        <div className="bg-card border border-line rounded-2xl divide-y divide-line">
          {Object.entries(GUIDES).map(([k, [title, steps]]) => (
            <details key={k} id={"guide-" + k} className="p-4" style={{ scrollMarginTop: "6rem" }}>
              <summary className="cursor-pointer font-bold text-ink">{title}</summary>
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm text-muted-strong">{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </details>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Your tools</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {LINKS.map(([l, u]) => <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="bg-card border border-line rounded-xl px-4 py-3 text-sm font-bold text-plum hover:border-violet">{l} ↗</a>)}
        </div>
      </div>
    </div>
  );
}
