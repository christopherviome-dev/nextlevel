"use client";
import { useState } from "react";
import { fitImage } from "../../lib/image";
import ReelPlayer from "./ReelPlayer";

const FRAME = { maxDim: 900, maxChars: 95 * 1024 }; // sharp on a phone, light to load
const MIN = 3, MAX = 8;

// Make a Look Reel: pick 3 to 8 photos (front, sides, back, even a "before"),
// see it play, remove any you don't want, save.
export default function ReelMaker({ onSave, onCancel, onRemove, hasReel }) {
  const [frames, setFrames] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const add = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX - frames.length); e.target.value = "";
    if (!files.length) return;
    setBusy(true); setError(null);
    try { const out = []; for (const f of files) out.push(await fitImage(f, FRAME)); setFrames((x) => [...x, ...out].slice(0, MAX)); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const save = async () => {
    setBusy(true); setError(null);
    try { await onSave(frames); } catch (err) { setError(err.message); setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-strong">Pick {MIN} to {MAX} photos of the same look. Start with the front, then the sides and back, and a "before" if you have one. They'll play like a short video.</p>
      {frames.length >= 2 && <ReelPlayer frames={frames} alt="Your reel" />}
      <div className="flex flex-wrap gap-2">
        {frames.map((f, k) => (
          <div key={k} className="relative">
            <img src={f} alt={`Angle ${k + 1}`} className="w-16 h-16 rounded-lg object-cover border border-line" />
            <button type="button" onClick={() => setFrames(frames.filter((_, j) => j !== k))} aria-label={`Remove angle ${k + 1}`}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs">✕</button>
          </div>
        ))}
        {frames.length < MAX && (
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-line flex items-center justify-center text-2xl text-muted cursor-pointer" aria-label="Add photos">
            <input type="file" accept="image/*" multiple onChange={add} className="sr-only" disabled={busy} />+
          </label>
        )}
      </div>
      <div className="text-xs text-muted">{frames.length} of {MAX} photos{frames.length < MIN ? ` (at least ${MIN})` : ""}</div>
      {error && <p className="text-sm text-bad-fg">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={busy || frames.length < MIN} className="px-5 py-2.5 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">{busy ? "Saving…" : "Save the reel"}</button>
        {onCancel && <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-full border border-line font-bold">Cancel</button>}
        {hasReel && onRemove && <button type="button" onClick={onRemove} className="px-4 py-2.5 text-sm font-bold text-bad-fg underline">Remove the current reel</button>}
      </div>
    </div>
  );
}
