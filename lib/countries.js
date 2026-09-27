// Twin of the backend's lib/countries.js: keep the two in step when adding a country.
import { WORLD } from "./worldCountries";
export const COUNTRIES = {
  GH: { name: "Ghana", flag: "🇬🇭", currency: "GHS", dial: "233", trunk: "0", nsnLength: 9, distance: "km",
    phoneExample: "024 123 4567", budgets: [100, 200, 500],
    idDocuments: [["GHANA_CARD", "Ghana Card"]] },
  GB: { name: "United Kingdom", flag: "🇬🇧", currency: "GBP", dial: "44", trunk: "0", nsnLength: 10, distance: "mi",
    phoneExample: "07700 900123", budgets: [20, 50, 100],
    idDocuments: [["PASSPORT", "Passport"], ["DRIVING_LICENCE", "Driving licence"], ["BRP", "Biometric residence permit"]] },
};
export const DEFAULT_COUNTRY = "GH";

// A country's flag emoji, built from its two-letter code (GH → 🇬🇭).
export const flagOf = (code) => String(code || "").toUpperCase().replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));

// Every other country gets general support (mirrors the server's getCountry).
const GENERIC_ID = [["PASSPORT", "Passport"], ["NATIONAL_ID", "National ID card"], ["DRIVING_LICENCE", "Driving licence"]];
const MILES = new Set(["GB", "US", "LR", "MM"]);
export function countryInfo(code) {
  if (COUNTRIES[code]) return COUNTRIES[code];
  const w = WORLD[code];
  if (!w) return COUNTRIES[DEFAULT_COUNTRY];
  return { name: w[0], flag: flagOf(code), currency: w[2], dial: w[1], trunk: null, nsnLength: null,
    distance: MILES.has(code) ? "mi" : "km", phoneExample: "", budgets: null, idDocuments: GENERIC_ID, generic: true };
}
// All countries, alphabetical, for pickers.
export const ALL_COUNTRIES = Object.entries(WORLD).map(([code, [name, dial]]) => ({ code, name, dial, flag: flagOf(code) }));
// Short label for small buttons: flag + code, with "UK" as people say it.
export const shortLabel = (code) => `${flagOf(code)} ${code === "GB" ? "UK" : code}`;

// Best guess at where someone is, only a starting point they can change:
// their earlier choice, then their device's time zone, then its language region.
const TZ = { "Europe/London": "GB", "Africa/Accra": "GH", "Africa/Lagos": "NG", "Africa/Lome": "TG", "Africa/Abidjan": "CI",
  "America/New_York": "US", "America/Chicago": "US", "America/Los_Angeles": "US", "America/Toronto": "CA", "Europe/Paris": "FR", "Africa/Johannesburg": "ZA" };
export function detectCountry() {
  try {
    const saved = localStorage.getItem("sheeba:country");
    if (WORLD[saved]) return saved;
  } catch (e) { /* private mode */ }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (TZ[tz]) return TZ[tz];
  } catch (e) { /* very old browser */ }
  const region = (typeof navigator !== "undefined" && (navigator.language || "").split("-")[1] || "").toUpperCase();
  return WORLD[region] ? region : DEFAULT_COUNTRY;
}
export function saveCountry(code) { try { localStorage.setItem("sheeba:country", code); } catch (e) { /* private mode */ } }

// Mirrors the server's toE164: "+" + country code + number, the way WhatsApp
// and Instagram store numbers. Returns { ok, value } or { ok: false, error }.
export function toE164(raw, countryCode) {
  const typed = String(raw || "").trim();
  const digits = typed.replace(/\D/g, "");
  if (!digits) return { ok: false, error: "Enter your phone number." };
  const c = COUNTRIES[countryCode] || (WORLD[countryCode] ? countryInfo(countryCode) : null);
  let full;
  if (typed.startsWith("+")) full = digits;
  else if (digits.startsWith("00")) full = digits.slice(2);
  else if (!c) return { ok: false, error: "Choose your country first." };
  else if (!digits.startsWith("0") && digits.startsWith(c.dial) && digits.length > c.dial.length + 6) full = digits;
  else full = c.dial + (digits.startsWith("0") ? digits.slice(1) : digits);
  if (full.length < 8 || full.length > 15) return { ok: false, error: "That phone number looks too short or too long." };
  if (c && c.nsnLength && full.startsWith(c.dial) && full.length !== c.dial.length + c.nsnLength) {
    return { ok: false, error: `A ${c.name} number has ${c.nsnLength} digits after the first 0.` };
  }
  return { ok: true, value: "+" + full };
}
