"use client";
import { useEffect, useState } from "react";

// Three choices, one tap to move through them:
//   Auto (follows the phone's own setting) → Light → Dark → Auto …
const NEXT = { system: "light", light: "dark", dark: "system" };
const LABEL = { system: "Auto", light: "Light", dark: "Dark" };
const ICON = { system: "◐", light: "☀", dark: "☾" };

function apply(choice) {
  const dark = choice === "dark" || (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

export default function ThemeToggle() {
  const [choice, setChoice] = useState(null); // unknown until the browser is ready

  useEffect(() => {
    let saved = "system";
    try { saved = localStorage.getItem("sheeba:theme") || "system"; } catch (e) { /* private mode */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the saved choice after load
    setChoice(saved);
  }, []);

  // In Auto, follow the phone live (e.g. when it switches to dark at sunset).
  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  const cycle = () => {
    const next = NEXT[choice || "system"];
    try { localStorage.setItem("sheeba:theme", next); } catch (e) { /* private mode */ }
    apply(next);
    setChoice(next);
  };

  if (!choice) return <span className="inline-block w-[4.5rem]" aria-hidden />; // keeps the header from jumping
  return (
    <button type="button" onClick={cycle}
      aria-label={`Colour theme: ${LABEL[choice]}. Tap to change.`} title={`Theme: ${LABEL[choice]}`}
      className="px-3 py-2 rounded-full border border-line bg-card text-sm font-bold text-plum whitespace-nowrap">
      <span aria-hidden>{ICON[choice]}</span> {LABEL[choice]}
    </button>
  );
}
