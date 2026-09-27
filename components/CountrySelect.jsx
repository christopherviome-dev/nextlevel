"use client";
import { ALL_COUNTRIES } from "../lib/countries";

// Every country, alphabetical, with its flag. (Typing a letter jumps to it.)
export default function CountrySelect({ value, onChange }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)} aria-label="Country"
      className="w-full px-4 py-3 rounded-xl border border-line bg-card">
      {ALL_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
    </select>
  );
}
