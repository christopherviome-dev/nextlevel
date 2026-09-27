import Nav from "./Nav";

// Shared layout for the Terms and Privacy pages: plain, readable, one column.
export default function LegalPage({ title, updated, children }) {
  return (
    <div>
      <Nav />
      <article className="max-w-2xl mx-auto px-5 pt-6 pb-16 text-ink">
        <h1 className="font-display font-extrabold text-2xl">{title}</h1>
        <p className="text-sm text-muted mt-1">Last updated {updated}</p>
        <div className="mt-6 space-y-5 leading-relaxed [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-hibiscus-deep [&_a]:underline">
          {children}
        </div>
      </article>
    </div>
  );
}
