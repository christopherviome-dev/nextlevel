// An anonymous, random ID for this browser, so likes and shop visits can be
// counted without an account. It identifies a browser, never a person.
export function getClientId() {
  try {
    let id = localStorage.getItem("sheeba:client-id");
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));
      localStorage.setItem("sheeba:client-id", id);
    }
    return id;
  } catch (e) { return null; } // private browsing: no likes/visits recorded, nothing breaks
}

// Which work this browser has liked, so hearts show correctly between visits.
export function likedSet() {
  try { return new Set(JSON.parse(localStorage.getItem("sheeba:liked") || "[]")); } catch (e) { return new Set(); }
}
export function saveLiked(set) {
  try { localStorage.setItem("sheeba:liked", JSON.stringify([...set])); } catch (e) { /* private mode */ }
}

// Service IDs are only unique within a shop, so likes are keyed by both.
export const likeKey = (item) => `${item.shop._id}:${item.id}`;
