// A link that leads nowhere gets a friendly page, not a technical one.
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <div className="max-w-sm text-center space-y-4">
        <div className="text-5xl" aria-hidden>🔎</div>
        <h1 className="text-2xl font-display font-extrabold text-ink">Page not found</h1>
        <p className="text-muted-strong">This link may be old or mistyped. Discover has everything on Mepluge.</p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="inline-block px-5 py-2.5 rounded-full bg-hibiscus text-white font-bold">Go to Discover</a>
      </div>
    </div>
  );
}
