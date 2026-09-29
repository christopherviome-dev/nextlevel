"use client";
import { useState } from "react";
import { apiFetch } from "../../lib/api";

// One tap after a finished service: "How was it?" (once per visit).
export default function RateVisit({ r }) {
  const [rating, setRating] = useState(r.rating || null);
  const [error, setError] = useState(null);
  const rate = async (n) => {
    setError(null);
    try { await apiFetch(`/requests/${r._id}/rate`, { method: "PUT", body: JSON.stringify({ rating: n }) }, "customer"); setRating(n); }
    catch (e) { setError(e.message); }
  };
  if (rating) return <div className="text-sm text-muted-strong mt-3">You rated this visit <span className="text-amber-500" aria-label={`${rating} out of 5`}>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span></div>;
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-ink">How was it?</span>
        <span className="flex" role="group" aria-label="Rate this visit">
          {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" onClick={() => rate(n)} aria-label={`${n} star${n === 1 ? "" : "s"}`} className="text-2xl leading-none px-0.5 text-amber-400 hover:scale-110">☆</button>)}
        </span>
      </div>
      {error && <p className="text-xs text-bad-fg mt-1">{error}</p>}
    </div>
  );
}
