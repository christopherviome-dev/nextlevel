// Remembers the Sheeba code someone arrived through (a scanned QR or a
// shared link), so if they create an account later, whoever invited them is
// credited. Only ever used at signup; existing accounts are unaffected.
const KEY = "sheeba:invite";
export function savePendingInvite(code) { try { localStorage.setItem(KEY, code); } catch (e) { /* private mode */ } }
export function pendingInvite() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
export function clearPendingInvite() { try { localStorage.removeItem(KEY); } catch (e) { /* private mode */ } }
