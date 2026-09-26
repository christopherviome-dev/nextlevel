"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { savePendingInvite } from "../../lib/invite";
import Nav from "../../components/Nav";
import { useAuth } from "../../context/AuthContext";

// Where a scanned QR code or a sheeba.online/u/CODE link lands (via the
// Netlify redirect rule). A live professional's code goes straight to their
// shop; anyone else's shows an invitation. Either way the code is remembered,
// so if the visitor creates an account, the person who invited them is credited.
export default function CodeView() {
  const [state, setState] = useState({ status: "loading" });
  const { authToken, hydrated } = useAuth();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hydrated) return; // wait until we know whether a professional is logged in
    const m = window.location.pathname.match(/^\/u\/([^/]+)\/?$/);
    const code = m ? decodeURIComponent(m[1]) : null;
    if (!code) { setState({ status: "invalid" }); return; } // eslint-disable-line react-hooks/set-state-in-effect -- the code only exists in the browser address
    apiFetch(`/u/${encodeURIComponent(code)}`)
      .then(async (r) => {
        if (r.type === "professional") { if (!authToken) savePendingInvite(r.code); window.location.replace(`/shop/${r.id}`); return; }
        if (authToken) {
          // A professional scanned a customer's code: offer check-in, but only
          // reveal anything if they already have an appointment together.
          try {
            const c = await apiFetch(`/checkin/${encodeURIComponent(r.code)}`);
            setState(c.found ? { status: "checkin", code: r.code, ...c } : { status: "no-appointment" });
          } catch (e) { setState({ status: "no-appointment" }); }
          return;
        }
        savePendingInvite(r.code);
        setState({ status: "member" });
      })
      .catch(() => setState({ status: "invalid" }));
  }, [hydrated, authToken]);

  const checkIn = async (id) => {
    setBusyId(id); setError(null);
    try {
      const r = await apiFetch(`/checkin/${id}`, { method: "POST", body: JSON.stringify({ code: state.code }) });
      setState((s) => ({ ...s, appointments: s.appointments.map((a) => (String(a._id) === String(id) ? { ...a, checkedInAt: r.checkedInAt } : a)) }));
    } catch (e) { setError(e.message); } finally { setBusyId(null); }
  };
  const time = (t) => new Date(t).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });

  return (
    <div>
      <Nav />
      <div className="max-w-md mx-auto px-5 pt-10 text-center">
        {state.status === "loading" && <p className="text-muted">Opening…</p>}
        {state.status === "checkin" && (
          <div className="bg-card border border-line rounded-2xl p-6 text-left">
            <div className="font-display font-extrabold text-xl text-ink text-center">Check in {state.firstName}</div>
            <p className="text-sm text-muted text-center mt-1">Their appointments with you:</p>
            <div className="mt-4 space-y-2">
              {state.appointments.map((a) => (
                <div key={a._id} className="bg-surface rounded-xl p-3">
                  <div className="font-bold text-ink">{a.service}</div>
                  <div className="text-sm text-muted">{a.preferredAt ? time(a.preferredAt) : a.date || "No date set"} · {a.status === "accepted" ? "Confirmed" : "Not accepted yet"}</div>
                  {a.checkedInAt
                    ? <div className="text-sm font-bold text-ok-fg mt-2">✓ Checked in {new Date(a.checkedInAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</div>
                    : a.status === "accepted"
                      ? <button onClick={() => checkIn(a._id)} disabled={busyId === a._id} className="mt-2 px-5 py-2 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">{busyId === a._id ? "Checking in…" : "Check in"}</button>
                      : <Link href="/dashboard" className="inline-block mt-2 text-sm font-bold text-hibiscus-deep underline">Accept it in My Shop first</Link>}
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-bad-fg mt-3">{error}</p>}
            <Link href="/dashboard" className="block text-center text-sm text-hibiscus-deep font-semibold mt-4">Back to My Shop</Link>
          </div>
        )}
        {state.status === "no-appointment" && (
          <div className="bg-card border border-line rounded-2xl p-6">
            <div className="font-bold text-ink">No appointment with this customer</div>
            <p className="text-sm text-muted mt-1">You can only check in customers who have an appointment with you. Ask them to send a request from your shop page first.</p>
            <Link href="/dashboard" className="inline-block mt-4 px-5 py-2.5 rounded-full bg-hibiscus text-white font-bold">Back to My Shop</Link>
          </div>
        )}
        {state.status === "invalid" && (
          <div className="bg-card border border-line rounded-2xl p-6">
            <div className="font-bold text-ink">This code didn't work</div>
            <p className="text-sm text-muted mt-1">Check the code and try again, or explore Sheeba anyway.</p>
            <Link href="/" className="inline-block mt-4 px-5 py-2.5 rounded-full bg-hibiscus text-white font-bold">Explore Sheeba</Link>
          </div>
        )}
        {state.status === "member" && (
          <div className="bg-card border border-line rounded-2xl p-6">
            <div className="font-display font-extrabold text-xl text-ink">You've been invited to Sheeba</div>
            <p className="text-sm text-muted-strong mt-2">Find trusted beauty professionals near you, or grow your own beauty business.</p>
            <div className="flex flex-col gap-2 mt-5">
              <Link href="/requests" className="px-5 py-3 rounded-full bg-hibiscus text-white font-bold">Join as a customer</Link>
              <Link href="/login?mode=register" className="px-5 py-3 rounded-full border border-line bg-card text-plum font-bold">Join as a professional</Link>
              <Link href="/" className="text-sm text-hibiscus-deep font-semibold mt-1">Just browse for now</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
