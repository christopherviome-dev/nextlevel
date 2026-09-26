"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

// The app shell's navigation. One component, used on every signed-in-style
// page, so moving around works the same everywhere:
//  - phones: a bottom tab bar within thumb reach, plus a slim top bar
//  - larger screens: the same tabs in the top bar
// Kept short on purpose: not every feature becomes a tab.

const Icon = {
  discover: <path d="M11 4a7 7 0 1 0 4.4 12.4l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />,
  requests: <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h10V5H7Zm2 3h6v2H9V8Zm0 4h6v2H9v-2Z" />,
  shop: <path d="M4 4h16l1 5a3 3 0 0 1-2 2.8V20H5v-8.2A3 3 0 0 1 3 9l1-5Zm1.6 2-.6 3a1 1 0 0 0 2 .2L7.4 6H5.6Zm3.8 0L9 9.2a1 1 0 0 0 2 .1V6H9.4Zm3.6 0v3.3a1 1 0 0 0 2-.1L14.6 6H13Zm3.6 0 .4 3.2a1 1 0 0 0 2-.2l-.6-3h-1.8ZM7 12v6h10v-6a3 3 0 0 1-2-.8 3 3 0 0 1-3 .8 3 3 0 0 1-3-.8 3 3 0 0 1-2 .8Z" />,
  me: <path d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 10c4.4 0 8 2.2 8 5v3H4v-3c0-2.8 3.6-5 8-5Zm0 2c-3.5 0-6 1.6-6 3v1h12v-1c0-1.4-2.5-3-6-3Z" />,
  saved: <path d="M12 21 10.6 19.7C5.4 15 2 12 2 8.3 2 5.3 4.4 3 7.4 3c1.7 0 3.4.8 4.6 2.1C13.2 3.8 14.9 3 16.6 3 19.6 3 22 5.3 22 8.3c0 3.7-3.4 6.7-8.6 11.4L12 21Zm0-2.7c4.7-4.3 8-7.1 8-10 0-1.9-1.5-3.3-3.4-3.3-1.4 0-2.8.9-3.3 2.2h-2.6C10.2 5.9 8.8 5 7.4 5 5.5 5 4 6.4 4 8.3c0 2.9 3.3 5.7 8 10Z" />,
  admin: <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 2.2 6 2.2V11c0 4-2.6 7.8-6 8.9-3.4-1.1-6-4.9-6-8.9V6.4l6-2.2Zm-1 11.3-3-3 1.4-1.4 1.6 1.6 4.6-4.6L17 9.5l-6 6Z" />,
};

// Role-aware and short: customers get their workspace, visitors get a way in,
// professionals and admins get theirs. Phones never get more than five tabs.
function tabsFor({ isAdmin, isCustomer }) {
  const tabs = [{ href: "/", label: "Discover", icon: Icon.discover }];
  if (isCustomer) {
    tabs.push(
      { href: "/requests", label: "Appointments", short: "Bookings", icon: Icon.requests },
      { href: "/my-sheeba", label: "My Sheeba", icon: Icon.me },
      { href: "/saved", label: "Saved", icon: Icon.saved },
    );
  } else {
    tabs.push({ href: "/requests", label: "Sign in", icon: Icon.me });
  }
  tabs.push({ href: "/dashboard", label: "My Shop", icon: Icon.shop });
  if (isAdmin) tabs.push({ href: "/admin", label: "Admin", icon: Icon.admin });
  // Saved is also reachable from My Sheeba, so it's the one to fold away.
  return tabs.length > 5 ? tabs.filter((t) => t.href !== "/saved") : tabs;
}

export default function Nav() {
  const pathname = usePathname();
  const { authToken, myAccount, isAdmin, logout, customerToken } = useAuth();
  const tabs = tabsFor({ isAdmin, isCustomer: !!customerToken });
  const active = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <nav className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-line bg-card sticky top-0 z-20">
        <Link href="/" className="font-display font-extrabold text-lg text-hibiscus-deep shrink-0">
          SHEE<span className="text-violet">BA</span>
        </Link>

        {/* Larger screens: tabs in the top bar */}
        <div className="hidden sm:flex gap-2 flex-wrap justify-center">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} aria-current={active(t.href) ? "page" : undefined}
              className={"px-4 py-2 rounded-full text-sm font-bold border transition-colors " +
                (active(t.href) ? "bg-hibiscus text-white border-hibiscus" : "bg-card text-plum border-line hover:border-hibiscus")}>
              {t.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {authToken && myAccount && (
            <span className="hidden lg:inline text-xs text-muted">Signed in as <b className="text-plum">{myAccount.name}</b></span>
          )}
          <ThemeToggle />
          {authToken && (
            <button onClick={logout} className="px-3 py-2 rounded-full text-sm font-bold border border-line bg-card text-plum">Log out</button>
          )}
        </div>
      </nav>

      {/* Phones: bottom tab bar, within thumb reach */}
      <nav aria-label="Main" className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-line pb-[env(safe-area-inset-bottom)]">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} aria-current={active(t.href) ? "page" : undefined}
              className={"flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold " + (active(t.href) ? "text-hibiscus-deep" : "text-muted")}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>{t.icon}</svg>
              {t.short || t.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
