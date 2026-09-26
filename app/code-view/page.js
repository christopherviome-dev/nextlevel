"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { savePendingInvite } from "../../lib/invite";
import Nav from "../../components/Nav";

// Where a scanned QR code or a sheeba.online/u/CODE link lands (via the
// Netlify redirect rule). A live professional's code goes straight to their
// shop; anyone else's shows an invitation. Either way the code is remembered,
// so if the visitor creates an account, the person who invited them is credited.
export default function CodeView() {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    const m = window.location.pathname.match(/^\/u\/([^/]+)\/?$/);
    const code = m ? decodeURIComponent(m[1]) : null;
    if (!code) { setState({ status: "invalid" }); return; } // eslint-disable-line react-hooks/set-state-in-effect -- the code only exists in the browser address
    apiFetch(`/u/${encodeURIComponent(code)}`)
      .then((r) => {
        savePendingInvite(r.code);
        if (r.type === "professional") window.location.replace(`/shop/${r.id}`);
        else setState({ status: "member" });
      })
      .catch(() => setState({ status: "invalid" }));
  }, []);

  return (
    <div>
      <Nav />
      <div className="max-w-md mx-auto px-5 pt-10 text-center">
        {state.status === "loading" && <p className="text-muted">Opening…</p>}
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
