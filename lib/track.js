"use client";
import { API_BASE } from "./api";

// Anonymous trend signals for the admin's "demand" view: which style was
// searched for or opened. No account, phone or identity is sent; each style
// counts once per visit, so refreshing doesn't inflate anything.
export function track(kind, key) {
  if (typeof window === "undefined" || !key) return;
  const k = `sheeba:tracked:${kind}:${key}`;
  try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch (e) { /* private mode: still send once */ }
  try {
    fetch(`${API_BASE}/analytics/event`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, key }), keepalive: true }).catch(() => {});
  } catch (e) { /* never let tracking break the page */ }
}
