// A feed that learns, privately: what someone views, hearts, saves, searches
// for and books nudges their Discover feed. Kept ONLY on this phone (never
// sent to Mepluge), fades over time (older interests count less), and can be
// cleared any time from the Mepluge page.
const KEY = "sheeba:interests";
const DAY = 24 * 3600 * 1000;
const WEIGHT = { view: 1, search: 2, heart: 3, save: 3, book: 5 };
const empty = () => ({ styles: {}, services: {}, at: Date.now() });

export function interests() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!d || !d.styles) return empty();
    const fade = Math.pow(0.97, Math.max(0, (Date.now() - d.at) / DAY)); // about half after 3 weeks
    for (const m of [d.styles, d.services]) for (const k of Object.keys(m)) { m[k] *= fade; if (m[k] < 0.05) delete m[k]; }
    d.at = Date.now();
    return d;
  } catch (e) { return empty(); }
}

export function learn(signal, { styleKey, serviceKey, services } = {}) {
  const w = WEIGHT[signal] || 1;
  const d = interests();
  if (styleKey) d.styles[styleKey] = (d.styles[styleKey] || 0) + w;
  for (const s of [serviceKey, ...(services || [])].filter(Boolean)) d.services[s] = (d.services[s] || 0) + w / 2;
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* private mode: no learning, nothing breaks */ }
}

export function hasLearned() { const d = interests(); return Object.keys(d.styles).length + Object.keys(d.services).length > 0; }
export function forgetInterests() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
