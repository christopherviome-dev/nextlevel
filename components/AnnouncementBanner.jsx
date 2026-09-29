"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
// The admin's announcement, shown at the top of every page. Closing it hides
// that message on this phone; a new message shows again.
const KEY = "sheeba:announcement-closed";
export default function AnnouncementBanner() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    apiFetch("/settings").then((s) => {
      const m = (s && s.announcement) || "";
      let closed = null; try { closed = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
      if (m && closed !== m) setMsg(m);
    }).catch(() => {});
  }, []);
  if (!msg) return null;
  const close = () => { try { localStorage.setItem(KEY, msg); } catch (e) { /* ignore */ } setMsg(""); };
  return (
    <div role="status" className="bg-violet text-white text-sm px-4 py-2 flex items-center justify-center gap-3" style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top, 0px))" }}>
      <span className="text-center">{msg}</span>
      <button onClick={close} aria-label="Close announcement" className="shrink-0 w-7 h-7 rounded-full bg-white/20 font-bold">×</button>
    </div>
  );
}
