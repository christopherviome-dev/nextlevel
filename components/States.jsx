"use client";
import Link from "next/link";

// Shared loading / empty / error states, so every page behaves the same way
// and always tells the person what they can do next.

export function LoadingState({ label = "Loading…", cards = 3 }) {
  return (
    <div role="status" aria-busy="true" className="space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="bg-card border border-line rounded-2xl p-4 motion-safe:animate-pulse">
          <div className="h-4 w-1/2 bg-surface-2 rounded" />
          <div className="h-3 w-1/3 bg-surface-2 rounded mt-2" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint, actionLabel, onAction, actionHref }) {
  return (
    <div className="bg-card border border-line rounded-2xl p-6 text-center">
      <div className="font-bold text-ink">{title}</div>
      {hint && <p className="text-sm text-muted mt-1">{hint}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-block mt-3 px-5 py-2 rounded-full bg-hibiscus text-white text-sm font-bold">{actionLabel}</Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button onClick={onAction} className="mt-3 px-5 py-2 rounded-full border border-line bg-card text-sm font-bold text-plum hover:border-hibiscus">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="bg-bad-bg border border-bad-line rounded-2xl p-4 text-bad-fg">
      <div className="font-bold">Something went wrong</div>
      <p className="text-sm mt-1">{message || "Please check your connection and try again."}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 px-5 py-2 rounded-full bg-hibiscus text-white text-sm font-bold">Try again</button>
      )}
    </div>
  );
}
