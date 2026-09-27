"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

// On a shop's page: approved work by its apprentices (18+ only), clearly
// labelled as apprentice work, showing the shop trains the next generation.
export default function ApprenticeWorkGallery({ shopId, shopName }) {
  const [list, setList] = useState([]);
  useEffect(() => { apiFetch(`/training/shop/${shopId}/works`).then(setList).catch(() => setList([])); }, [shopId]);
  if (!list.length) return null;
  return (
    <div className="mt-6">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase">Our apprentices' work</div>
      <p className="text-xs text-muted mb-2">{shopName} trains new professionals. This is their approved practice work.</p>
      <div className="grid grid-cols-3 gap-2">
        {list.map((w) => (
          <div key={w._id} className="relative rounded-xl overflow-hidden border border-line">
            <img src={w.thumb} alt={w.caption || `Apprentice work by ${w.apprentice}`} loading="lazy" className="w-full aspect-square object-cover" />
            <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full bg-black/60 text-white">Apprentice · {w.apprentice}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
