"use client";
// Where someone first came from, remembered on their phone for 30 days and
// sent with their sign-up and bookings: a professional's marketing link
// (?ref=), an invite (/u/CODE), a shared "Book this look" card (?look=), a
// shop's own link (/shop/…), or arriving on their own. First touch wins.
const KEY = "sheeba:source";
const WINDOW = 30 * 24 * 3600 * 1000;
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };

export function captureSource() {
  try {
    const old = read();
    if (old && Date.now() - old.at < WINDOW) return;
    const url = new URL(window.location.href);
    const shop = url.pathname.match(/^\/shop\/([A-Za-z0-9]{12,40})/);
    const invite = url.pathname.match(/^\/u\/([A-Za-z0-9-]{3,40})/);
    const ref = url.searchParams.get("ref"), look = url.searchParams.get("look");
    let host = null;
    try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : null; } catch (e) { /* none */ }
    if (host === window.location.hostname) host = null;
    const s = ref ? { type: "link", code: ref, shopId: shop && shop[1] }
      : invite ? { type: "invite", code: invite[1] }
      : look && shop ? { type: "look", shopId: shop[1] }
      : shop ? { type: "shop", shopId: shop[1] }
      : { type: "direct" };
    localStorage.setItem(KEY, JSON.stringify({ ...s, referrerHost: host, at: Date.now() }));
  } catch (e) { /* private mode: nothing remembered */ }
}
export const currentSource = () => { const s = read(); return s && Date.now() - s.at < WINDOW ? s : undefined; };
