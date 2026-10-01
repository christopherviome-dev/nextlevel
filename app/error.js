"use client";
import { useEffect } from "react";
import { reportError } from "../lib/errorReport";

// If a page breaks, people see this instead of a blank screen (and the admin is told).
export default function Error({ error, reset }) {
  useEffect(() => { reportError(error); }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <div className="max-w-sm text-center space-y-4">
        <div className="text-5xl" aria-hidden>🙈</div>
        <h1 className="text-2xl font-display font-extrabold text-ink">Something went wrong</h1>
        <p className="text-muted-strong">Sorry about that. We've been told, and it's usually fixed by trying again.</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => reset()} className="px-5 py-2.5 rounded-full bg-hibiscus text-white font-bold">Try again</button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="px-5 py-2.5 rounded-full border border-line font-bold text-plum">Go to Discover</a>
        </div>
      </div>
    </div>
  );
}
