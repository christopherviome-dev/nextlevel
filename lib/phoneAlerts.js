"use client";
// Phone alerts (Web Push) in plain steps: can this phone do it, turn on, turn off, test.
import { apiFetch } from "./api";
const b64ToBytes = (b64) => { const p = "=".repeat((4 - (b64.length % 4)) % 4); const s = atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...s].map((c) => c.charCodeAt(0))); };
export const isIPhone = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
export const isInstalled = () => typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);
export const supported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export async function registration() { return supported() ? navigator.serviceWorker.register("/sw.js") : null; }
export async function currentSubscription() { const reg = await registration(); return reg ? reg.pushManager.getSubscription() : null; }

// as: "customer" | null (professional); alerts go to whoever is logged in on this phone.
export async function turnOn(as) {
  if (!supported()) throw new Error("This phone or browser can't show Mepluge alerts.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Alerts are blocked. Allow notifications for this site in your browser settings, then try again.");
  const reg = await registration();
  const { key } = await apiFetch("/push/public-key");
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
  await apiFetch("/push/subscribe", { method: "POST", body: JSON.stringify({ subscription: sub.toJSON() }) }, as);
  return true;
}
export async function turnOff(as) {
  const sub = await currentSubscription();
  if (!sub) return;
  try { await apiFetch("/push/unsubscribe", { method: "POST", body: JSON.stringify({ endpoint: sub.endpoint }) }, as); } catch (e) { /* still stop on the phone */ }
  await sub.unsubscribe();
}
export const sendTest = (as) => apiFetch("/push/test", { method: "POST" }, as);
