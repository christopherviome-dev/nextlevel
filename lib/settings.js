import { apiFetch } from "./api";
// Admin switches that change what signup forms show (see the backend's routes/settings.js).
let cached = null;
export async function getPublicSettings() {
  if (!cached) cached = apiFetch("/settings").catch(() => ({ ageCheck: false }));
  return cached;
}
