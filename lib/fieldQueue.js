"use client";
import { apiFetch } from "./api";

// Field stops are saved on the phone first and uploaded when there's network,
// so a weak signal on the road never loses a stop. Each stop has its own key,
// so the server counts it once however many times it's sent.
const KEY = "sheeba:field-queue";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } };
const write = (q) => { try { localStorage.setItem(KEY, JSON.stringify(q)); } catch (e) { /* storage full */ } window.dispatchEvent(new Event("sheeba:field-queue")); };
export const newKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const pending = () => read();

export function queueStop(tripId, stop) { write([...read(), { tripId, stop }]); return flush(); }

let flushing = null;
export function flush() {
  if (flushing) return flushing;
  flushing = (async () => {
    const results = { sent: 0, waiting: 0, errors: [] };
    for (const item of read()) {
      try {
        await apiFetch(`/field/trips/${item.tripId}/visits`, { method: "POST", body: JSON.stringify(item.stop) });
        write(read().filter((x) => x.stop.clientKey !== item.stop.clientKey)); results.sent++;
      } catch (e) {
        const offline = (typeof navigator !== "undefined" && navigator.onLine === false) || e.name === "TypeError" || /fetch|network/i.test(e.message);
        if (offline) { results.waiting++; continue; }
        // The server refused it (e.g. a missing name): drop it and say why, rather than retrying forever.
        write(read().filter((x) => x.stop.clientKey !== item.stop.clientKey)); results.errors.push(`${item.stop.placeName || "A stop"}: ${e.message}`);
      }
    }
    return results;
  })().finally(() => { flushing = null; });
  return flushing;
}
if (typeof window !== "undefined") window.addEventListener("online", () => { flush(); });
