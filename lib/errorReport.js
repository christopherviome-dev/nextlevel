"use client";
// Sends errors people's apps hit to the admin's error log: no personal details,
// at most 10 per visit, never the same one twice.
import { apiFetch } from "./api";
const sent = new Set();
export function reportError(err, extra = {}) {
  try {
    const message = String((err && (err.message || err.reason && err.reason.message)) || err || "Unknown error").slice(0, 300);
    const page = typeof window !== "undefined" ? window.location.pathname : null;
    const key = message + "|" + page;
    if (sent.has(key) || sent.size >= 10) return;
    sent.add(key);
    apiFetch("/client-errors", { method: "POST", body: JSON.stringify({ message, page, stack: String((err && err.stack) || "").slice(0, 800), browser: navigator.userAgent.slice(0, 150), ...extra }) }).catch(() => {});
  } catch (e) { /* reporting must never cause trouble itself */ }
}
let installed = false;
export function installErrorReporting() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (e) => { if (e && e.error) reportError(e.error); });
  window.addEventListener("unhandledrejection", (e) => reportError(e && e.reason ? e.reason : "Unhandled promise rejection"));
}
