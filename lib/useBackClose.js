"use client";
import { useEffect, useRef } from "react";

// Makes the phone's Back button close an open panel instead of leaving the
// page (as people expect from Instagram). Only one layer is open at a time:
// opening another replaces it rather than stacking history entries.
export function useBackClose(layer, onBack) {
  const cb = useRef(onBack);
  useEffect(() => { cb.current = onBack; }, [onBack]);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (layer && !wasOpen.current) window.history.pushState({ sheebaLayer: true }, "");
    wasOpen.current = !!layer;
  }, [layer]);
  useEffect(() => {
    const onPop = () => { if (wasOpen.current) { wasOpen.current = false; cb.current(); } };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
}
// Closing from the screen (✕, tapping outside): step back through history so
// the Back button and the ✕ always agree.
export function closeLayer(fallback) {
  if (typeof window !== "undefined" && window.history.state && window.history.state.sheebaLayer) window.history.back();
  else fallback();
}
