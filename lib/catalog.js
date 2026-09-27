import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import INSPIRATION from "./inspiration.json";

// Services and styles (the server's lib/catalog.js), plus admin-approved ones.
// FALLBACK keeps the chips working for a moment if the catalog can't load.
export const FALLBACK = [
  { key: "hair", name: "Hair styling", styles: [] }, { key: "barbering", name: "Barbering", styles: [] },
  { key: "makeup", name: "Makeup", styles: [] }, { key: "nails", name: "Nails", styles: [] },
  { key: "lashes", name: "Lashes & brows", styles: [] }, { key: "skin", name: "Skin & spa", styles: [] },
];
let cached = null;
export function loadCatalog() {
  if (!cached) cached = apiFetch("/catalog").then((r) => r.services).catch(() => { cached = null; return FALLBACK; });
  return cached;
}
export function useCatalog() {
  const [catalog, setCatalog] = useState(FALLBACK);
  useEffect(() => {
    let live = true;
    loadCatalog().then((c) => { if (live) setCatalog(c); });
    return () => { live = false; };
  }, []);
  return catalog;
}
// styleKey → { name, aliases, serviceKey, for }
export function styleIndex(catalog) {
  const m = {};
  for (const s of catalog) for (const st of s.styles || []) m[st.key] = { ...st, serviceKey: s.key };
  return m;
}
export const serviceName = (catalog, key) => (catalog.find((s) => s.key === key) || {}).name || key;

// Inspiration photos (Pexels, credited), served from Sheeba itself (scripts/fetch-inspiration.mjs).
export const photosFor = (styleKey) => (INSPIRATION[styleKey] || []).map((p) => ({ ...p, src: `/inspiration/${p.id}.jpg` }));
export const INSPIRATION_STYLES = Object.keys(INSPIRATION);
