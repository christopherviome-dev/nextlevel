"use client";
import { useRef, useState, useSyncExternalStore } from "react";

// Voice search the person CHOOSES to use: it listens only after the mic is
// tapped, stops by itself, and the browser shows its own microphone
// indicator. (Speech is turned into text by the phone or browser's own speech
// service.) Hidden on browsers that can't do it.
const Recognition = () => (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;
const noop = () => () => {};

export default function VoiceSearchButton({ onResult, lang = "en-GB" }) {
  const supported = useSyncExternalStore(noop, () => !!Recognition(), () => false);
  const [listening, setListening] = useState(false);
  const rec = useRef(null);
  if (!supported) return null;

  const start = () => {
    if (listening) { rec.current && rec.current.stop(); return; }
    const R = Recognition();
    const r = new R();
    r.lang = lang; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const text = e.results[0] && e.results[0][0] ? e.results[0][0].transcript : ""; if (text) onResult(text); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };
  return (
    <button type="button" onClick={start} aria-pressed={listening} aria-label={listening ? "Stop listening" : "Search by voice"} title="Search by voice"
      className={"w-12 h-12 shrink-0 rounded-full border flex items-center justify-center " + (listening ? "bg-hibiscus text-white border-hibiscus motion-safe:animate-pulse" : "bg-card text-plum border-line")}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
  );
}

// "knotless braids near Kasoa under 200 cedis" → { text: "knotless braids near Kasoa", max: 200, nearMe: false }
export function parseVoice(said) {
  let text = ` ${said.toLowerCase()} `;
  let max = null;
  const m = text.match(/\b(?:under|below|less than|at most|max(?:imum)?|not more than)\s*(?:gh₵|ghs|gh|£|\$|€)?\s*(\d[\d,]*)\s*(?:cedis?|pounds?|dollars?|euros?)?/);
  if (m) { max = Number(m[1].replace(/,/g, "")); text = text.replace(m[0], " "); }
  const nearMe = /\bnear me\b|\bclose to me\b|\baround me\b/.test(text);
  text = text.replace(/\bnear me\b|\bclose to me\b|\baround me\b/g, " ").replace(/\b(?:i want|i need|show me|find me|looking for|please|a|an|the|some)\b/g, " ");
  return { text: text.replace(/\s+/g, " ").trim(), max: Number.isFinite(max) && max > 0 ? max : null, nearMe };
}
