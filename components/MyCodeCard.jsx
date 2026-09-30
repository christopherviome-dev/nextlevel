"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { apiFetch } from "../lib/api";
import { formatMinor } from "../lib/money";

const STATUS = {
  JOINED: ["Joined, waiting for their first job", "bg-surface-2 text-muted-strong border-line"],
  CHECKING: ["First job done: being checked", "bg-warn-bg text-warn-fg border-warn-line"],
  UNDER_REVIEW: ["Being reviewed", "bg-warn-bg text-warn-fg border-warn-line"],
  VALIDATED: ["Confirmed", "bg-ok-bg text-ok-fg border-ok-line"],
  VOID: ["Not eligible", "bg-bad-bg text-bad-fg border-bad-line"],
};

// Your code, its link and QR, and the invites you've earned from.
// `actor` = "customer" for customer accounts, null for professionals.
export default function MyCodeCard({ actor = null, shareName }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [qr, setQr] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch("/invites/me", {}, actor).then(setData).catch((e) => setError(e.message));
  }, [actor]);

  const link = data ? `${window.location.origin}/u/${data.code}` : "";
  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { width: 480, margin: 1, errorCorrectionLevel: "M" }).then(setQr).catch(() => setQr(null));
  }, [link]);

  if (error) return <p className="text-sm text-bad-fg">{error}</p>;
  if (!data) return <p className="text-sm text-muted">Loading your code…</p>;

  const message = shareName ? `Book with ${shareName} on Mepluge: ${link}` : `Join me on Mepluge: ${link}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) { /* older phones */ }
  };
  // The phone's own share menu: WhatsApp, Instagram, TikTok, Facebook, SMS,
  // email… whatever is installed. (Computers without it keep the buttons.)
  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  const share = async () => {
    try { await navigator.share({ title: shareName ? `Book with ${shareName} on Mepluge` : "Join me on Mepluge", text: message, url: link }); }
    catch (e) { /* they closed the menu: nothing to do */ }
  };
  const reward = formatMinor(data.reward.amountMinor, data.reward.currency);
  const approx = (local) => (local ? ` (≈ ${formatMinor(local.amountMinor, local.currency)} today)` : "");
  // Friendly codes read as name + number (AKUA 0042); older 6-character codes as two halves.
  const m = /^([A-Z]+)(\d{4,})$/.exec(data.code);
  const shown = m ? `${m[1]} ${m[2]}` : `${data.code.slice(0, 3)} ${data.code.slice(3)}`;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-line rounded-2xl p-5 text-center print-area">
        {data.memberNumber && (
          <div className={"inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 " + (data.founding ? "bg-warn-bg text-warn-fg border border-warn-line" : "bg-surface-2 text-muted-strong")}>
            {data.founding ? `⭐ Founding member #${data.memberNumber}` : `Member #${data.memberNumber}`}
          </div>
        )}
        <div className="text-xs font-extrabold tracking-wide text-plum uppercase">Your code</div>
        <div className="font-mono text-3xl font-bold tracking-[0.2em] text-ink mt-1">{shown}</div>
        {qr && <img src={qr} alt={`QR code for ${link}`} className="w-48 h-48 mx-auto mt-3 rounded-lg bg-white p-2" />}
        {shareName && <div className="text-sm font-bold text-ink mt-2 print-only">Scan to book with {shareName}</div>}
        <div className="text-sm text-muted mt-2 break-all">{link}</div>
        <div className="flex flex-wrap justify-center gap-2 mt-4 no-print">
          {canShare && (
            <button onClick={share} className="px-5 py-2 rounded-full bg-hibiscus text-white text-sm font-bold">Share…</button>
          )}
          <button onClick={copy} className="px-4 py-2 rounded-full border border-line bg-card text-sm font-bold text-plum">{copied ? "✓ Copied" : "Copy link"}</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-bold">Share on WhatsApp</a>
          {qr && <a href={qr} download={`sheeba-${data.code}.png`} className="px-4 py-2 rounded-full border border-line bg-card text-sm font-bold text-plum">Download QR</a>}
          <button onClick={() => window.print()} className="px-4 py-2 rounded-full border border-line bg-card text-sm font-bold text-plum">Print</button>
        </div>
        {shareName && <p className="text-xs text-muted mt-3 no-print">Print it for your salon mirror or stall. Customers scan it to open your shop.</p>}
      </div>

      <div className="bg-card border border-line rounded-2xl p-4 no-print">
        <div className="font-bold text-ink">Invite people: each is worth {reward}{approx(data.rewardLocal)}</div>
        <p className="text-sm text-muted-strong mt-1">
          It counts when someone joins with your code and completes a genuine first job. Each one is checked for about a week, then confirmed.
          Confirmed rewards build up here and become a coupon for a free or discounted service once Mepluge starts taking payments.
        </p>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-surface rounded-xl p-2"><div className="text-xl font-bold text-ink">{data.counts.joined}</div><div className="text-xs text-muted">joined</div></div>
          <div className="bg-surface rounded-xl p-2"><div className="text-xl font-bold text-ink">{formatMinor(data.totals.validatedMinor, data.reward.currency)}</div><div className="text-xs text-muted">confirmed</div></div>
          <div className="bg-surface rounded-xl p-2"><div className="text-xl font-bold text-ink">{data.counts.checking + data.counts.underReview}</div><div className="text-xs text-muted">being checked</div></div>
        </div>
        {data.validatedLocal && data.totals.validatedMinor > 0 && <p className="text-xs text-muted mt-2">Confirmed so far: {formatMinor(data.totals.validatedMinor, "GHS")}{approx(data.validatedLocal)}</p>}
        {(data.rewardLocal || data.validatedLocal) && (
          <p className="text-[11px] text-muted mt-2"><a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline">Rates By Exchange Rate API</a></p>
        )}
        {data.invites.length > 0 && (
          <div className="mt-3 space-y-1">
            {data.invites.map((i, n) => {
              const [label, cls] = STATUS[i.status] || STATUS.JOINED;
              return (
                <div key={n} className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-line last:border-0">
                  <span className="text-ink">{i.name} <span className="text-muted">· joined as a {i.joinedAs === "stylist" ? "professional" : "customer"}</span></span>
                  <span className={"text-xs px-2 py-0.5 rounded-full border whitespace-nowrap " + cls}>{label}{i.status === "VALIDATED" ? ` ${formatMinor(i.amountMinor, i.currency)}` : ""}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
