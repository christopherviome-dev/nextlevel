"use client";
import { useEffect, useRef, useState } from "react";
import { googleClientId, loadGoogle } from "../lib/google";

// Google's own button (required by Google). Renders nothing until Google sign-in is set up.
export default function GoogleButton({ onCredential, text = "continue_with", divider = true }) {
  const box = useRef(null);
  const cb = useRef(onCredential);
  const [on, setOn] = useState(false);
  useEffect(() => { cb.current = onCredential; }, [onCredential]);
  useEffect(() => {
    let live = true;
    (async () => {
      const id = await googleClientId();
      if (!id || !live) return;
      const g = await loadGoogle().catch(() => null);
      if (!g || !live || !box.current) return;
      g.accounts.id.initialize({ client_id: id, callback: (r) => cb.current(r.credential), ux_mode: "popup" });
      g.accounts.id.renderButton(box.current, { theme: "outline", size: "large", shape: "pill", text, width: 300 });
      setOn(true);
    })();
    return () => { live = false; };
  }, [text]);
  return (
    <div className={on ? "space-y-3" : "hidden"}>
      <div ref={box} className="flex justify-center min-h-10" />
      {divider && <div className="flex items-center gap-3 text-xs text-muted"><span className="flex-1 h-px bg-line" />or use your phone number<span className="flex-1 h-px bg-line" /></div>}
    </div>
  );
}
