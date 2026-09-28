"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// Simple line icons for the menu (24×24, drawn with the current text colour).
const I = {
  home: "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0",
  requests: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
  messages: "M4 5h16v11H8l-4 4V5Z",
  customers: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0a3 3 0 1 0 0-6M3 20a6 6 0 0 1 12 0M15 14a6 6 0 0 1 6 6",
  earnings: "M4 19V9M10 19V5M16 19v-7M22 19H2",
  shop: "M4 9h16l-1-5H5L4 9Zm0 0v11h16V9M9 20v-6h6v6",
  services: "M6 3v6a3 3 0 0 0 6 0V3M9 12v9M17 3c-2 2-2 6 0 8v10",
  share: "M12 3v12M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6",
  training: "M3 9l9-5 9 5-9 5-9-5Zm4 3v5c3 2 7 2 10 0v-5",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
};
const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

export function Avatar({ account, size = 40 }) {
  const name = account.salonName || account.name || "?";
  return account.profilePhoto
    ? <img src={account.profilePhoto} alt="" style={{ width: size, height: size }} className="rounded-full object-cover border border-line" />
    : <span style={{ width: size, height: size }} className="rounded-full bg-violet text-white font-bold flex items-center justify-center">{name.slice(0, 1).toUpperCase()}</span>;
}

// The menu: what a professional reaches for, each with a badge when it needs attention.
function menuFor(account, counts) {
  const apprentice = account.role === "APPRENTICE";
  const inTraining = account.supervisorStatus === "APPROVED" || account.supervisorStatus === "GRADUATED";
  return [
    ["home", "Home", I.home, 0],
    ["profile", "Profile", I.profile, 0],
    ...(inTraining ? [["training", account.supervisorStatus === "GRADUATED" ? "Training record" : "My Training", I.training, 0]] : []),
    ["requests", "Requests", I.requests, counts.pendingRequests],
    ["messages", "Messages", I.messages, counts.unreadMessages],
    ["customers", "Customers", I.customers, 0],
    ["earnings", "Earnings", I.earnings, 0],
    ["shop", "Shop page", I.shop, 0],
    ["services", "Services", I.services, 0],
    ["share", "Share & earn", I.share, 0],
    ...(!apprentice ? [["team", "Team", I.customers, counts.apprenticeRequests + counts.workToReview]] : []),
  ];
}

function Menu({ account, counts, section, go }) {
  const name = account.salonName || account.name;
  return (
    <nav aria-label="My Shop menu" className="flex flex-col h-full">
      <button onClick={() => go("profile")} className="flex items-center gap-3 p-4 text-left">
        <Avatar account={account} size={48} />
        <span className="min-w-0">
          <span className="block font-bold text-ink truncate">{name} {account.verified && <span className="text-hibiscus-deep text-xs">✓</span>}</span>
          <span className="block text-xs text-muted truncate">{account.memberNumber && account.memberNumber <= 1000 ? `⭐ Founding member #${account.memberNumber}` : "View your profile"}</span>
        </span>
      </button>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {menuFor(account, counts).map(([key, label, icon, badge]) => (
          <button key={key} onClick={() => go(key)} aria-current={section === key ? "page" : undefined}
            className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left " + (section === key ? "bg-violet text-white" : "text-ink hover:bg-surface")}>
            <Icon d={icon} /> <span className="flex-1">{label}</span>
            {badge > 0 && <span className={"min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-bold flex items-center justify-center " + (section === key ? "bg-white text-violet" : "bg-hibiscus text-white")}>{badge}</span>}
          </button>
        ))}
        <div className="border-t border-line my-2" />
        {/* Plain links on purpose: shop pages load through the Netlify redirect rule. */}
        <a href={`/shop/${account._id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink hover:bg-surface"><Icon d={I.eye} /> View my public page</a>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink hover:bg-surface"><Icon d={I.settings} /> Settings</Link>
      </div>
    </nav>
  );
}

// My Shop's frame: a clean main area, with everything else in the menu.
export default function ProShell({ account, counts, section, setSection, title, children }) {
  const [open, setOpen] = useState(false);
  const go = (key) => { setSection(key); setOpen(false); window.scrollTo({ top: 0 }); };
  const total = counts.pendingRequests + counts.unreadMessages + counts.workToReview + counts.apprenticeRequests;
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  return (
    <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[16rem_1fr] lg:gap-6 lg:px-5">
      {/* Larger screens: the menu is always there */}
      <aside className="hidden lg:block sticky top-20 self-start h-[calc(100vh-6rem)] bg-card border border-line rounded-2xl mt-6 overflow-hidden">
        <Menu account={account} counts={counts} section={section} go={go} />
      </aside>
      <div className="min-w-0 px-5 lg:px-0 pt-4 lg:pt-6 pb-16">
        {/* Phones: tap your picture for the menu (like X) */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setOpen(true)} aria-label={`Open menu${total ? ` (${total} need attention)` : ""}`} className="relative lg:hidden">
            <Avatar account={account} size={40} />
            {total > 0 && <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-hibiscus text-white text-[11px] font-bold flex items-center justify-center">{total}</span>}
          </button>
          <h1 className="font-display font-extrabold text-xl text-ink truncate">{title}</h1>
        </div>
        {children}
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="My Shop menu" className="absolute inset-y-0 left-0 w-[82%] max-w-xs bg-card shadow-xl pt-[env(safe-area-inset-top)]">
            <Menu account={account} counts={counts} section={section} go={go} />
          </div>
        </div>
      )}
    </div>
  );
}
