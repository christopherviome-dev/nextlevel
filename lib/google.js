"use client";
// "Continue with Google": the button shows only when the server has a Google
// key (GOOGLE_CLIENT_ID on Render). Google's script loads only when needed.
import { apiFetch } from "./api";
let idPromise = null, scriptPromise = null;
export function googleClientId() {
  if (!idPromise) idPromise = apiFetch("/settings").then((s) => (s && s.googleClientId) || null).catch(() => { idPromise = null; return null; });
  return idPromise;
}
export function loadGoogle() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.accounts) { resolve(window.google); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = () => resolve(window.google);
    s.onerror = () => { scriptPromise = null; reject(new Error("Google could not load. Check your connection.")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}
