"use client";
import CountryPicker from "./CountryPicker";

// Country choice (names only, search, likely countries first). See CountryPicker.
export default function CountrySelect({ value, onChange }) {
  return <CountryPicker value={value} onChange={onChange} />;
}
