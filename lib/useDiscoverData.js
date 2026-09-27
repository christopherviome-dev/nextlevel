"use client";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";
import { useCountryPref, useLocationPref, setUseLocation } from "./prefs";
import { countryInfo } from "./countries";
import { distanceKm } from "./geo";
import { useCatalog, styleIndex } from "./catalog";

// The shops for the chosen country, with distances when location is on.
// Shared by Discover and Search so both always agree.
export function useDiscoverData() {
  const country = useCountryPref();
  const useLoc = useLocationPref();
  const catalog = useCatalog();
  const styles = useMemo(() => styleIndex(catalog), [catalog]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [myLocation, setMyLocation] = useState(null);
  const [locError, setLocError] = useState(null);

  useEffect(() => {
    if (!country) return;
    let live = true;
    apiFetch(`/stylists/discover?country=${country}`)
      .then((list) => { if (live) { setShops(list); setError(null); } })
      .catch((e) => { if (live) setError(e.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [country, reloadKey]);

  useEffect(() => {
    if (!useLoc) { setMyLocation(null); return; } // eslint-disable-line react-hooks/set-state-in-effect -- follows the location pin
    if (!navigator.geolocation) { setLocError("This device can't share its location."); return; } // eslint-disable-line react-hooks/set-state-in-effect -- same
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocError(null); },
      () => { setLocError("Couldn't get your location. Check that location access is allowed for this site."); setUseLocation(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [useLoc]);

  const info = countryInfo(country);
  const withDistance = useMemo(() => shops.map((s) => ({
    ...s, _distanceKm: myLocation && s.location ? distanceKm(myLocation.lat, myLocation.lng, s.location.lat, s.location.lng) : null,
  })), [shops, myLocation]);

  return {
    country, info, catalog, styles, shops, setShops, withDistance, loading, error, locError, myLocation,
    where: myLocation ? "near you" : `in ${info.name}`,
    retry: () => { setError(null); setLoading(true); setReloadKey((k) => k + 1); },
  };
}
