"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import { fitImage } from "../../lib/image";

const FULL = { maxDim: 1000, maxChars: 290 * 1024 }, THUMB = { maxDim: 360, maxChars: 55 * 1024 };
const STATUS = { PENDING: ["Waiting for review", "bg-warn-bg text-warn-fg border-warn-line"], APPROVED: ["✓ Approved", "bg-ok-bg text-ok-fg border-ok-line"], SENT_BACK: ["Sent back", "bg-bad-bg text-bad-fg border-bad-line"] };

// An apprentice posting photos of their work for their supervisor to review.
export default function MyWorks({ skills = [], canPost = true }) {
  const [list, setList] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [caption, setCaption] = useState("");
  const [skillId, setSkillId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const load = useCallback(() => { apiFetch("/training/me/works").then(setList).catch(() => setList([])); }, []);
  useEffect(() => { load(); }, [load]);
  const choose = async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    setError(null);
    try { const [a, b] = await Promise.all([fitImage(f, FULL), fitImage(f, THUMB)]); setPhoto(a); setThumb(b); } catch (err) { setError(err.message); }
  };
  const post = async () => {
    setBusy(true); setError(null);
    try {
      await apiFetch("/training/me/works", { method: "POST", body: JSON.stringify({ photo, thumb, caption, skillId: skillId || undefined }) });
      setPhoto(null); setThumb(null); setCaption(""); setSkillId(""); load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const remove = async (w) => { if (!window.confirm("Delete this photo?")) return; await apiFetch(`/training/me/works/${w._id}`, { method: "DELETE" }); load(); };

  return (
    <div>
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">My work</div>
      {canPost && (
        <div className="bg-card border border-line rounded-2xl p-3 space-y-2 mb-3">
          <div className="text-sm text-muted-strong">Show your supervisor what you've done. Only post photos your client agreed to share.</div>
          <input type="file" accept="image/*" onChange={choose} className="block text-sm" />
          {photo && <img src={photo} alt="Your work" className="w-32 h-32 object-cover rounded-xl border border-line" />}
          <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} placeholder="What is it? e.g. my first full head of knotless"
            className="w-full px-3 py-2 rounded-xl border border-line bg-card text-sm" />
          {skills.length > 0 && (
            <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-line bg-card text-sm">
              <option value="">Which skill does it show? (optional)</option>
              {skills.filter((s) => s.status !== "SIGNED_OFF").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {error && <p className="text-sm text-bad-fg">{error}</p>}
          <button onClick={post} disabled={busy || !photo} className="px-4 py-2 rounded-full bg-hibiscus text-white text-sm font-bold disabled:opacity-40">{busy ? "Posting…" : "Send to my supervisor"}</button>
        </div>
      )}
      {list && list.length === 0 && <p className="text-sm text-muted">Nothing posted yet.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {list && list.map((w) => {
          const [label, cls] = STATUS[w.status];
          return (
            <div key={w._id} className="bg-card border border-line rounded-xl overflow-hidden">
              <img src={w.thumb || w.photo} alt={w.caption || "Training work"} className="w-full aspect-square object-cover" />
              <div className="p-2 space-y-1">
                <span className={"inline-block text-[11px] px-2 py-0.5 rounded-full border " + cls}>{label}{w.showOnShop ? " · on shop page" : ""}</span>
                {w.caption && <div className="text-xs text-ink line-clamp-2">{w.caption}</div>}
                {w.skillName && <div className="text-[11px] text-muted">{w.skillName}</div>}
                {w.supervisorComment && <div className="text-[11px] text-muted-strong italic">"{w.supervisorComment}"</div>}
                <button onClick={() => remove(w)} className="text-[11px] text-bad-fg underline">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
