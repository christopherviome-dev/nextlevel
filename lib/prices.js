// Twin of the server's lib/prices.js, run on the Discover feed already loaded
// (no extra download): one figure per shop, a range only with 3+ shops.
export const MIN_SHOPS = 3;

export function percentile(sorted, p) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return Math.round((sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo)) * 100) / 100;
}

// One number per shop: the median of its matching priced items.
// Works on Discover cards (shop.work) and on full shops (shop.styles).
export function shopPrice(shop, service, style) {
  const own = shop.services || [];
  const prices = (shop.work || shop.styles || [])
    .filter((x) => x.active !== false && typeof x.price === "number" && Number.isFinite(x.price))
    .filter((x) => !service || x.serviceKey === service || (!x.serviceKey && own.includes(service)))
    .filter((x) => !style || x.styleKey === style)
    .map((x) => x.price).sort((a, b) => a - b);
  return prices.length ? percentile(prices, 0.5) : null;
}

export function summarise(shops, { service, style } = {}) {
  const perShop = shops.map((s) => shopPrice(s, service, style)).filter((v) => v !== null).sort((a, b) => a - b);
  if (perShop.length < MIN_SHOPS) return { enough: false, shops: perShop.length };
  return { enough: true, shops: perShop.length, low: percentile(perShop, 0.25), median: percentile(perShop, 0.5), high: percentile(perShop, 0.75) };
}
