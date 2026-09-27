"use client";
import { useEffect, useState } from "react";
import { detectCountry, saveCountry } from "./countries";

// Small per-phone preferences, changed in one place (Settings or the top bar)
// and heard everywhere else instantly through a browser event.
const LOCATION_KEY = "sheeba:use-location";

export function setUseLocation(on) {
  try { localStorage.setItem(LOCATION_KEY, on ? "1" : "0"); } catch (e) { /* private mode */ }
  window.dispatchEvent(new CustomEvent("sheeba:location", { detail: on }));
}
export function useLocationPref() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a saved choice only exists in the browser
    try { setOn(localStorage.getItem(LOCATION_KEY) === "1"); } catch (e) { /* private mode */ }
    const h = (e) => setOn(!!e.detail);
    window.addEventListener("sheeba:location", h);
    return () => window.removeEventListener("sheeba:location", h);
  }, []);
  return on;
}

export function setCountryPref(code) {
  saveCountry(code);
  window.dispatchEvent(new CustomEvent("sheeba:country", { detail: code }));
}
export function useCountryPref() {
  const [country, setCountry] = useState(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- detected from the device, which only exists in the browser
    setCountry(detectCountry());
    const h = (e) => setCountry(e.detail);
    window.addEventListener("sheeba:country", h);
    return () => window.removeEventListener("sheeba:country", h);
  }, []);
  return country;
}

// Where to join the community.
export const COMMUNITY = {
  telegram: "https://t.me/+se1zShHTSWUzMzNk",
  whatsapp: "https://chat.whatsapp.com/Ezq7E8OO1dZ3Za2ymcJB13",
};
