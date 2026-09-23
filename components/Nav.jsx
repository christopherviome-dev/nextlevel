"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Nav() {
  const pathname = usePathname();
  const { authToken, isAdmin, logout } = useAuth();

  const linkClass = (path) =>
    "px-4 py-2 rounded-full text-sm font-bold border transition-colors " +
    (pathname === path
      ? "bg-hibiscus text-white border-hibiscus"
      : "bg-white text-plum border-line hover:border-hibiscus");

  return (
    <nav className="flex items-center justify-between px-5 py-4 border-b border-line bg-white sticky top-0 z-20 flex-wrap gap-2">
      <div className="font-display font-extrabold text-lg text-hibiscus-deep">
        SHEE<span className="text-violet">BA</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Link className={linkClass("/")} href="/">Discover</Link>
        <Link className={linkClass("/requests")} href="/requests">My Requests</Link>
        <Link className={linkClass("/dashboard")} href="/dashboard">My Shop</Link>
        {isAdmin && <Link className={linkClass("/admin")} href="/admin">Admin</Link>}
        {authToken && (
          <button className="px-4 py-2 rounded-full text-sm font-bold border border-line bg-white" onClick={logout}>
            Log Out
          </button>
        )}
      </div>
    </nav>
  );
}
