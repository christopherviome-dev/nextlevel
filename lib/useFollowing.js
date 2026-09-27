"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import { useAuth } from "../context/AuthContext";
import { learn } from "./interests";

// Following shops, like TikTok: a customer taps "+" to follow; visitors are
// asked to sign in first (the server checks it's really them).
export function useFollowing() {
  const { customerToken } = useAuth();
  const [me, setMe] = useState(null);
  const [following, setFollowing] = useState(() => new Set());
  useEffect(() => {
    if (!customerToken) return;
    Promise.all([apiFetch("/customers/me", {}, "customer"), apiFetch("/customers/me/following", {}, "customer")])
      .then(([m, list]) => { setMe(m); setFollowing(new Set(list.map((s) => String(s._id)))); })
      .catch(() => {});
  }, [customerToken]);

  const toggle = async (shop) => {
    if (!customerToken || !me) { window.location.href = "/requests"; return; } // sign in to follow
    const id = String(shop._id), was = following.has(id);
    const next = new Set(following); if (was) next.delete(id); else next.add(id);
    setFollowing(next);
    try {
      const r = await apiFetch(`/stylists/${id}/follow?lean=1`, { method: "POST", body: JSON.stringify({ clientId: me._id }) }, "customer");
      const fixed = new Set(next); if (r.following) fixed.add(id); else fixed.delete(id);
      setFollowing(fixed);
      if (r.following) learn("save", { services: shop.services });
    } catch (e) { setFollowing(following); }
  };
  return { following, toggle, signedIn: !!customerToken };
}
