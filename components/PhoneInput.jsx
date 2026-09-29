"use client";
import { countryInfo } from "../lib/countries";
import CountryPicker from "./CountryPicker";

// Phone number the international way, like WhatsApp or Instagram: a
// country-code button (+233, opens a simple country list), then the number. The form turns it into one
// stored form with toE164 (lib/countries.js), which the server mirrors.
export default function PhoneInput({ country, onCountryChange, value, onChange, autoComplete = "tel-national" }) {
  const info = countryInfo(country);
  return (
    <div className="flex gap-2">
      <CountryPicker value={country} onChange={onCountryChange} withDial compact />
      <input type="tel" inputMode="tel" autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={info.phoneExample ? `e.g. ${info.phoneExample}` : "Phone number"} aria-label="Phone number"
        className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-line" />
    </div>
  );
}
