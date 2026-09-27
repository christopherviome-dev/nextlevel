// Orders the Discover feed for one person, from:
//  - their onboarding choices (favourites; men's or women's styles), and
//  - what they've shown interest in on this phone (lib/interests.js).
// It only REORDERS: nothing is ever hidden, so everyone can still find anything.
const FOR = { MEN: "men", WOMEN: "women" };

export function scoreWork(item, { prefs, learned, styles }) {
  let s = 0;
  const favs = (prefs && prefs.favourites) || [];
  const st = item.styleKey ? styles[item.styleKey] : null;
  if (favs.includes(item.styleKey)) s += 3;
  const want = prefs && FOR[prefs.feedFor];
  if (want && st) {
    if (st.for === want) s += 1;
    else if (st.for !== "all" && !favs.includes(item.styleKey)) s -= 1.5; // e.g. women's styles for someone who chose men's grooming…
  }
  // …and men who chose men's grooming see barbering first, unless their favourites say otherwise
  if (want === "men" && (item.serviceKey === "barbering" || (!item.serviceKey && ((item.shop && item.shop.services) || []).includes("barbering")))) s += 1;
  if (learned) {
    s += Math.min(3, ((learned.styles || {})[item.styleKey] || 0) * 0.3);
    s += Math.min(1.5, ((learned.services || {})[item.serviceKey] || 0) * 0.1);
  }
  return s;
}

export const scoreShop = (shop, ctx) => Math.max(0, ...shop.work.map((w) => scoreWork({ ...w, shop }, ctx)));

// Stable: equal scores keep their original order (e.g. distance, freshness).
export function personalize(list, score) {
  return list.map((x, i) => [x, score(x), i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map(([x]) => x);
}
