"use client";
import { ALL_COUNTRIES, countryInfo } from "../lib/countries";

// Phone number the international way, like WhatsApp or Instagram: a
// flag + country-code picker, then the number. The form turns it into one
// stored form with toE164 (lib/countries.js), which the server mirrors.
export default function PhoneInput({ country, onCountryChange, value, onChange, autoComplete = "tel-national" }) {
  const info = countryInfo(country);
  return (
    <div className="flex gap-2">
      <select value={country || ""} onChange={(e) => onCountryChange(e.target.value)} aria-label="Phone country code"
        className="w-[7.5rem] shrink-0 px-2 py-3 rounded-xl border border-line bg-card text-sm">
        {ALL_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} +{c.dial} {c.name}</option>)}
      </select>
      <input type="tel" inputMode="tel" autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={info.phoneExample ? `e.g. ${info.phoneExample}` : "Phone number"} aria-label="Phone number"
        className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-line" />
    </div>
  );
}
