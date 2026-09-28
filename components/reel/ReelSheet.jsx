"use client";
import { useEffect, useState } from "react";
import Sheet from "../discover/Sheet";
import ReelPlayer from "./ReelPlayer";
import ShareLookButton from "../ShareLookButton";
import { canMakeVideo, shareReelVideo } from "../../lib/reelVideo";

// Watch a Look Reel, book it, or share it (as a video where the phone can
// make one; otherwise as a Fresh Look card).
export default function ReelSheet({ title, byline, place, price, link, load, onClose, bookLabel = "Book this look" }) {
  const [frames, setFrames] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [video] = useState(() => canMakeVideo());
  useEffect(() => { load().then((r) => setFrames(r.frames)).catch((e) => setError(e.message)); }, [load]);
  const shareVideo = async () => {
    setBusy(true); setMsg("Making your video…");
    try { const r = await shareReelVideo({ frames, title, byline, link }); setMsg(r === "saved" ? "Video saved: post it on your Status." : null); }
    catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };
  return (
    <Sheet title={title} onClose={onClose}>
      {error && <p className="text-sm text-bad-fg">{error}</p>}
      {!frames && !error && <div className="w-full aspect-[4/5] rounded-2xl bg-surface-2 animate-pulse" />}
      {frames && <ReelPlayer frames={frames} alt={title} />}
      <div className="mt-3 text-sm text-muted-strong">{[byline && `by ${byline}`, place, price].filter(Boolean).join(" · ")}</div>
      <div className="flex flex-wrap gap-2 mt-4">
        {/* A plain link on purpose: shop pages load through the Netlify redirect rule. */}
        {link && <a href={link} className="flex-1 text-center py-3 rounded-full bg-hibiscus text-white font-bold">{bookLabel}</a>}
        {frames && video && <button type="button" onClick={shareVideo} disabled={busy} className="px-4 py-3 rounded-full border border-line font-bold text-plum">✦ Share as video</button>}
        {frames && !video && <ShareLookButton photo={frames[0]} title={title} byline={byline} place={place} price={price} link={link} className="px-4 py-3 rounded-full border border-line font-bold text-plum" />}
      </div>
      {msg && <p className="text-xs text-muted mt-2">{msg}</p>}
    </Sheet>
  );
}
