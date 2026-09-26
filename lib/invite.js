// Remembers who invited this visitor (a scanned QR code or a shared link), so
// if they create an account, the inviter is credited. Stored as
// { code, name, country }: the name only for live shops (customers' names
// stay private), and the country so signup can start on the right country.
const KEY = "sheeba:invite";
export function savePendingInvite(info) {
  try { localStorage.setItem(KEY, JSON.stringify(typeof info === "string" ? { code: info } : info)); } catch (e) { /* private mode */ }
}
export function pendingInviteInfo() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    if (!raw.startsWith("{")) return { code: raw }; // saved by an older version
    return JSON.parse(raw);
  } catch (e) { return null; }
}
export const pendingInvite = () => (pendingInviteInfo() || {}).code || "";
export function clearPendingInvite() { try { localStorage.removeItem(KEY); } catch (e) { /* private mode */ } }
