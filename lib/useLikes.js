"use client";
import { useState } from "react";
import { apiFetch } from "./api";
import { getClientId, likedSet, saveLiked, likeKey } from "./clientId";
import { learn } from "./interests";

// Likes, shared by Discover and Search: instant on screen, confirmed by the
// server, undone if the server says no. Remembered on this phone.
export function useLikes(setShops) {
  const [liked, setLiked] = useState(() => (typeof window === "undefined" ? new Set() : likedSet()));
  const bump = (item, delta, exact) => setShops((prev) => prev.map((s) => s._id !== item.shop._id ? s : {
    ...s, work: s.work.map((w) => w.id !== item.id ? w : { ...w, likeCount: exact ?? Math.max(0, (w.likeCount || 0) + delta) }),
  }));
  const onLike = async (item) => {
    const clientId = getClientId();
    if (!clientId) return;
    const key = likeKey(item), was = liked.has(key);
    const next = new Set(liked); if (was) next.delete(key); else next.add(key);
    setLiked(next); saveLiked(next); bump(item, was ? -1 : 1);
    if (!was) learn("heart", { styleKey: item.styleKey, serviceKey: item.serviceKey });
    try {
      const r = await apiFetch(`/stylists/${item.shop._id}/styles/${item.id}/like?lean=1`, { method: "POST", body: JSON.stringify({ clientId }) });
      const fixed = new Set(next); if (r.liked) fixed.add(key); else fixed.delete(key);
      setLiked(fixed); saveLiked(fixed); bump(item, 0, r.likeCount);
    } catch (e) { setLiked(liked); saveLiked(liked); bump(item, was ? 1 : -1); }
  };
  return { liked, onLike };
}
