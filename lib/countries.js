// Twin of the backend's lib/countries.js: keep the two in step when adding a country.
export const COUNTRIES = {
  GH: { name: "Ghana", flag: "🇬🇭", currency: "GHS", dial: "233", trunk: "0", nsnLength: 9, distance: "km",
    phoneExample: "024 123 4567", budgets: [100, 200, 500],
    idDocuments: [["GHANA_CARD", "Ghana Card"]] },
  GB: { name: "United Kingdom", flag: "🇬🇧", currency: "GBP", dial: "44", trunk: "0", nsnLength: 10, distance: "mi",
    phoneExample: "07700 900123", budgets: [20, 50, 100],
    idDocuments: [["PASSPORT", "Passport"], ["DRIVING_LICENCE", "Driving licence"], ["BRP", "Biometric residence permit"]] },
};
export const DEFAULT_COUNTRY = "GH";
export const countryInfo = (code) => COUNTRIES[code] || COUNTRIES[DEFAULT_COUNTRY];

// Best guess at where someone is, used only as a starting point they can change:
// their earlier choice, then their device's time zone, then its language region.
export function detectCountry() {
  try {
    const saved = localStorage.getItem("sheeba:country");
    if (COUNTRIES[saved]) return saved;
  } catch (e) { /* private mode */ }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz === "Europe/London") return "GB";
    if (tz === "Africa/Accra") return "GH";
  } catch (e) { /* very old browser */ }
  const region = (typeof navigator !== "undefined" && (navigator.language || "").split("-")[1] || "").toUpperCase();
  return COUNTRIES[region] ? region : DEFAULT_COUNTRY;
}
export function saveCountry(code) { try { localStorage.setItem("sheeba:country", code); } catch (e) { /* private mode */ } }
