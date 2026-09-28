"use client";

// Small, dependency-free charts drawn in SVG.
export function DailyBars({ data, keys, colors, labels }) {
  const max = Math.max(1, ...data.map((d) => keys.reduce((t, k) => t + d[k], 0)));
  const w = 100 / data.length;
  return (
    <div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-32" role="img"
        aria-label={`Daily signups: ${data.reduce((t, d) => t + keys.reduce((u, k) => u + d[k], 0), 0)} in total`}>
        {data.map((d, i) => {
          let y = 40;
          return keys.map((k, j) => {
            const h = (d[k] / max) * 38;
            y -= h;
            return h > 0 ? <rect key={`${i}-${k}`} x={i * w + w * 0.15} y={y} width={w * 0.7} height={h} fill={colors[j]} rx="0.4"><title>{`${d.day}: ${d[k]} ${labels[j]}`}</title></rect> : null;
          });
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-muted mt-1"><span>{data[0] && data[0].day}</span><span>{data.length && data[data.length - 1].day}</span></div>
      <div className="flex gap-4 text-xs text-muted-strong mt-1">
        {keys.map((k, j) => <span key={k} className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: colors[j] }} />{labels[j]}</span>)}
      </div>
    </div>
  );
}

// A ranked list with a bar for each item.
export function RankList({ items, empty = "Nothing yet.", format = (n) => n, sub }) {
  if (!items || !items.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(1, ...items.map((x) => x.count));
  return (
    <div className="space-y-2">
      {items.map((x) => (
        <div key={x.key}>
          <div className="flex justify-between gap-2 text-sm">
            <span className="text-ink truncate">{x.name || x.key}{sub && sub(x) ? <span className="text-muted"> · {sub(x)}</span> : null}</span>
            <span className="font-bold text-ink whitespace-nowrap">{format(x.count)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2 mt-1"><div className="h-full rounded-full bg-violet" style={{ width: `${(x.count / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
