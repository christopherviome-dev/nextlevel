"use client";
import { setUseLocation, useLocationPref } from "../lib/prefs";

// The top-bar location pin: on = show what's near me. Like a phone's toggle.
export default function LocationToggle() {
  const on = useLocationPref();
  return (
    <button type="button" onClick={() => setUseLocation(!on)} aria-pressed={on}
      aria-label={on ? "Stop using my location" : "Use my location to show what's near me"} title={on ? "Location on" : "Location off"}
      className={"w-10 h-10 rounded-full border flex items-center justify-center " + (on ? "bg-hibiscus text-white border-hibiscus" : "bg-card text-plum border-line")}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.5" fill={on ? "var(--color-hibiscus)" : "none"} />
      </svg>
    </button>
  );
}
