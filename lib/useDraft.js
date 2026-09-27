"use client";
import { useState, useEffect, useRef } from "react";

// Like useState, but the value survives a page reload (e.g. an accidental
// refresh halfway through a form). Kept only for this browser tab, and
// cleared by calling the returned `clear` once the form is submitted.
// NEVER use this for passwords.
export function useDraft(key, initial) {
  const storageKey = `sheeba:draft:${key}`;
  const [value, setValue] = useState(initial);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a saved draft only exists in the browser
      if (saved !== null) setValue(JSON.parse(saved));
    } catch (e) { /* private mode or bad data: start fresh */ }
    loaded.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!loaded.current) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(value)); } catch (e) { /* storage full or private mode */ }
  }, [storageKey, value]);

  const clear = () => { try { sessionStorage.removeItem(storageKey); } catch (e) { /* ignore */ } };
  return [value, setValue, clear];
}
