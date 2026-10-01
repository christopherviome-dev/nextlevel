"use client";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../../lib/api";

// Errors people's apps hit: most recent first, with how often and where.
export default function ClientErrors() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => apiFetch("/client-errors").then(setList).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const clear = async () => { if (window.confirm("Clear the error log? Do this once the errors are fixed.")) { await apiFetch("/client-errors", { method: "DELETE" }); load(); } };
  if (error) return <p className="text-bad-fg">{error}</p>;
  if (!list) return <p className="text-muted">Loading…</p>;
  if (!list.length) return <p className="text-muted">No errors reported. 🎉 When someone's app hits a problem, it shows here, with the page and how many times.</p>;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center"><p className="text-sm text-muted">{list.length} kind{list.length === 1 ? "" : "s"} of error, most recent first.</p><button onClick={clear} className="px-4 py-2 rounded-full border border-line text-sm font-bold text-plum">Clear log</button></div>
      <div className="bg-card border border-line rounded-2xl divide-y divide-line">
        {list.map((e) => (
          <details key={e.key} className="p-4">
            <summary className="cursor-pointer list-none">
              <div className="flex justify-between gap-3"><span className="font-bold text-ink break-words">{e.message}</span><span className="shrink-0 text-sm font-bold text-bad-fg">×{e.count}</span></div>
              <div className="text-xs text-muted mt-1">{e.page || "?"} · last {new Date(e.lastAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
            </summary>
            {e.stack && <pre className="mt-2 text-xs whitespace-pre-wrap break-words text-muted-strong bg-surface rounded-lg p-2">{e.stack}</pre>}
            {e.browser && <p className="text-xs text-muted mt-2">{e.browser}</p>}
          </details>
        ))}
      </div>
    </div>
  );
}
