"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import Nav from "../../components/Nav";
import CustomerGate from "../../components/customer/CustomerGate";
import { useCatalog, photosFor } from "../../lib/catalog";

export default function WelcomePage() {
  return <CustomerGate title="Welcome to Sheeba"><Welcome /></CustomerGate>;
}

const SHOW_FOR = [["MEN", "Men's grooming"], ["WOMEN", "Women's styles"], ["BOTH", "Both"], [null, "Prefer not to say"]];

// Two quick, skippable questions that shape the feed. Never shown to professionals.
function Welcome() {
  const router = useRouter();
  const catalog = useCatalog();
  const [step, setStep] = useState(1);
  const [feedFor, setFeedFor] = useState(undefined);
  const [favs, setFavs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Editing later from My Sheeba: start from their current choices.
  useEffect(() => {
    apiFetch("/customers/me", {}, "customer").then((me) => {
      if (me.onboardedAt) { setFeedFor(me.feedFor === undefined ? null : me.feedFor); setFavs(me.favourites || []); }
    }).catch(() => {});
  }, []);

  const want = feedFor === "MEN" ? "men" : feedFor === "WOMEN" ? "women" : null;
  const all = catalog.flatMap((s) => (s.styles || []).map((st) => ({ ...st, serviceKey: s.key })));
  const shown = all.filter((st) => !want || st.for === want || st.for === "all");
  const withPhotos = shown.filter((st) => photosFor(st.key).length);
  const withoutPhotos = shown.filter((st) => !photosFor(st.key).length);
  const toggle = (k) => setFavs(favs.includes(k) ? favs.filter((x) => x !== k) : favs.length >= 3 ? favs : [...favs, k]);

  const save = async (body) => {
    setBusy(true); setError(null);
    try { await apiFetch("/customers/me/preferences", { method: "PUT", body: JSON.stringify(body) }, "customer"); router.push("/"); }
    catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <div>
      <Nav />
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-16">
        <div className="text-xs font-bold text-muted uppercase">Step {step} of 2</div>
        {step === 1 && (
          <>
            <h1 className="font-display font-extrabold text-2xl text-ink mt-1">What should we show you first?</h1>
            <p className="text-sm text-muted mt-1">You'll still be able to see everything. This just puts what you like first.</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              {SHOW_FOR.map(([k, label]) => (
                <button key={label} onClick={() => { setFeedFor(k); setStep(2); }}
                  className={"py-5 rounded-2xl border font-bold " + (feedFor === k ? "bg-violet text-white border-violet" : "bg-card border-line text-plum")}>{label}</button>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="font-display font-extrabold text-2xl text-ink mt-1">Pick up to 3 favourites</h1>
            <p className="text-sm text-muted mt-1">{favs.length}/3 chosen. Photos are inspiration, not a Sheeba professional's work.</p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {withPhotos.map((st) => (
                <button key={st.key} onClick={() => toggle(st.key)} aria-pressed={favs.includes(st.key)}
                  className={"relative rounded-2xl overflow-hidden border-2 " + (favs.includes(st.key) ? "border-hibiscus" : "border-transparent")}>
                  <img src={photosFor(st.key)[0].src} alt="" className="w-full aspect-square object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-xs font-bold p-1 truncate">{favs.includes(st.key) ? "✓ " : ""}{st.name}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {withoutPhotos.map((st) => (
                <button key={st.key} onClick={() => toggle(st.key)} aria-pressed={favs.includes(st.key)}
                  className={"px-3 py-2 rounded-full border text-sm font-semibold " + (favs.includes(st.key) ? "bg-hibiscus text-white border-hibiscus" : "bg-card border-line text-plum")}>
                  {favs.includes(st.key) ? "✓ " : ""}{st.name}
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-bad-fg mt-3">{error}</p>}
            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(1)} className="px-5 py-3 rounded-full border border-line font-bold">Back</button>
              <button onClick={() => save({ feedFor: feedFor === undefined ? null : feedFor, favourites: favs })} disabled={busy}
                className="flex-1 py-3 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">{busy ? "Saving…" : "Show me my feed"}</button>
            </div>
          </>
        )}
        <button onClick={() => save({})} disabled={busy} className="block mx-auto mt-6 text-sm text-muted underline">Skip for now</button>
      </div>
    </div>
  );
}
