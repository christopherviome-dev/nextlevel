// "ID checked": the professional's identity was confirmed by Sheeba. A safety
// signal, never something bought (a future paid tier gets a different badge).
export default function IdCheckedBadge({ label = false, className = "" }) {
  const shield = (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden className="inline -mt-0.5">
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" fill="currentColor" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return label
    ? <span className={"inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-ok-bg text-ok-fg border border-ok-line " + className} title="Sheeba checked this professional's ID">{shield} ID checked</span>
    : <span className={"text-emerald-600 " + className} title="ID checked by Sheeba" aria-label="ID checked">{shield}</span>;
}
