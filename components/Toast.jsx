"use client";
import { useEffect, useRef, useState } from "react";

// A small pop-up that slides in, stays briefly, then fades away on its own.
// Tapping it dismisses it early. Reusable for any short confirmation.
export default function Toast({ message, onDone, duration = 4000 }) {
  const [visible, setVisible] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 20);
    const hide = setTimeout(() => setVisible(false), duration);
    const done = setTimeout(() => onDoneRef.current && onDoneRef.current(), duration + 350);
    return () => { clearTimeout(show); clearTimeout(hide); clearTimeout(done); };
  }, [duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => setVisible(false)}
      className={
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] px-5 py-3 rounded-full bg-emerald-700 text-white text-sm font-semibold shadow-lg cursor-pointer transition-all duration-300 " +
        (visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none")
      }
    >
      {message}
    </div>
  );
}
