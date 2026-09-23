const API_BASE = "https://sheeba-mavio.onrender.com/api";

export async function apiFetch(path, opts = {}, actorOverride = null) {
  const headers = { "Content-Type": "application/json" };
  const authToken = typeof window !== "undefined" ? localStorage.getItem("sheeba:token") : null;
  const customerToken = typeof window !== "undefined" ? localStorage.getItem("sheeba:customer-token") : null;
  if (actorOverride === "customer") {
    if (customerToken) headers["Authorization"] = "Bearer " + customerToken;
  } else if (authToken) {
    headers["Authorization"] = "Bearer " + authToken;
  }
  const res = await fetch(API_BASE + path, { ...opts, headers });
  let data = {};
  try { data = await res.json(); } catch (e) { /* empty body */ }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export { API_BASE };
