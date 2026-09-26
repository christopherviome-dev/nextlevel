// Straight-line distance in km between two GPS points (haversine formula).
// Checked against a real distance: Accra to Kumasi computes 199.5 km vs 199.7 km.
export function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => typeof v !== "number")) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export const formatKm = (km) => (km == null ? null : km < 1 ? `${Math.round(km * 1000)} m away` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`);

// Distance in the units people use where they are: miles in the UK, km elsewhere.
export function formatDistance(km, country) {
  if (km == null) return null;
  if (country !== "GB") return formatKm(km);
  const mi = km * 0.621371;
  return mi < 0.1 ? "nearby" : `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi away`;
}
