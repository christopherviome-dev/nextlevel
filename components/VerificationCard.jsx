"use client";
import { useState } from "react";
import { apiFetch } from "../lib/api";
import { normalizeGhanaCard, normalizeIdNumber, cleanLegalName, maskCard, maskId } from "../lib/identity";
import { readAndResizeImage } from "../lib/image";
import { countryInfo } from "../lib/countries";

function statusOf(a) {
  if (a.verified) return "VERIFIED";
  if (a.pendingReview) return "PENDING";
  if (a.verificationRejectedReason) return "REJECTED";
  return "NOT_SUBMITTED";
}
// What to photograph for each document.
const PHOTO_OF = { GHANA_CARD: "the front of your Ghana Card", PASSPORT: "your passport's photo page", DRIVING_LICENCE: "the front of your driving licence", BRP: "the front of your residence permit" };

export default function VerificationCard({ account, onUpdated }) {
  const status = statusOf(account);
  const country = countryInfo(account.country);
  const docs = country.idDocuments;
  const [editing, setEditing] = useState(false);
  const [legalName, setLegalName] = useState(account.legalFullName || "");
  const [idType, setIdType] = useState(account.idType || (docs.length === 1 ? docs[0][0] : ""));
  const [number, setNumber] = useState(account.ghanaCardNum || account.idNumber || "");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const isCard = idType === "GHANA_CARD";
  const docName = (docs.find(([k]) => k === idType) || [null, "ID document"])[1];
  const numberOk = isCard ? normalizeGhanaCard(number) : normalizeIdNumber(number);
  const nameResult = cleanLegalName(legalName);
  const shownPhoto = photo || account.verifyPhoto;
  const canSubmit = idType && nameResult.ok && numberOk && shownPhoto && !busy;
  const submittedNumber = account.ghanaCardNum ? maskCard(account.ghanaCardNum) : maskId(account.idNumber);

  const choosePhoto = async (e) => {
    setError(null);
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try { setPhoto(await readAndResizeImage(file)); } catch (err) { setError(err.message); }
  };

  const submit = async () => {
    setBusy(true); setError(null);
    const body = { legalFullName: legalName, idType, verifyPhoto: photo || undefined };
    if (isCard) body.ghanaCardNum = number; else body.idNumber = number;
    try {
      await apiFetch("/stylists/me/verify", { method: "POST", body: JSON.stringify(body) });
      setEditing(false); setPhoto(null);
      await onUpdated();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  if (status === "VERIFIED") {
    return (
      <div className="bg-card border border-ok-line rounded-2xl p-4 mt-4">
        <div className="font-bold text-ok-fg">✓ Identity verified</div>
        <div className="text-sm text-muted-strong mt-1">{account.legalFullName} · {submittedNumber}</div>
        <div className="text-xs text-muted mt-2">Customers see a Verified badge on your shop. Your legal name and document number stay private.</div>
      </div>
    );
  }

  const showForm = status === "NOT_SUBMITTED" || status === "REJECTED" || editing;

  return (
    <div className="bg-card border border-line rounded-2xl p-4 mt-4">
      <div className="text-xs font-extrabold tracking-wide text-plum uppercase mb-2">Verify your identity</div>

      {status === "PENDING" && !editing && (
        <div className="bg-warn-bg border border-warn-line rounded-xl p-3 text-sm text-warn-fg">
          <b>Under review.</b> We'll notify you as soon as it's checked.
          <div className="text-muted-strong mt-1">{account.legalFullName} · {submittedNumber}</div>
          <button className="mt-2 text-sm font-bold text-hibiscus-deep underline" onClick={() => setEditing(true)}>Correct my details</button>
        </div>
      )}
      {status === "REJECTED" && (
        <div className="bg-bad-bg border border-bad-line rounded-xl p-3 text-sm text-bad-fg mb-3">
          <b>Please fix and resubmit:</b> {account.verificationRejectedReason}
        </div>
      )}
      {status === "NOT_SUBMITTED" && (
        <p className="text-sm text-muted-strong mb-3">
          Customers are trusting a stranger when they book. A Verified badge shows them you're who you say you are.
          Only Sheeba's review team sees your ID details.
        </p>
      )}

      {showForm && (
        <div className="space-y-3">
          {docs.length > 1 && (
            <div>
              <label className="block text-sm font-bold mb-1">Which document?</label>
              <select value={idType} onChange={(e) => { setIdType(e.target.value); setNumber(""); }} className="w-full px-4 py-3 rounded-xl border border-line bg-card">
                <option value="">Choose…</option>
                {docs.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
              <p className="text-xs text-muted mt-1">Documents accepted in {country.name}.</p>
            </div>
          )}
          {idType && (
            <>
              <div>
                <label className="block text-sm font-bold mb-1">Full legal name</label>
                <input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder={`Exactly as printed on your ${docName}`}
                  className="w-full px-4 py-3 rounded-xl border border-line" />
                {legalName && !nameResult.ok && <p className="text-xs text-hibiscus-deep mt-1">{nameResult.error}</p>}
                <p className="text-xs text-muted mt-1">Every name, in the same order and spelling as your {docName}. We compare it with your photo.</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">{docName} number</label>
                <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={isCard ? "GHA-123456789-0" : "As printed on the document"}
                  className="w-full px-4 py-3 rounded-xl border border-line uppercase" />
                {number && (numberOk
                  ? <p className="text-xs text-ok-fg mt-1">✓ {numberOk}</p>
                  : <p className="text-xs text-hibiscus-deep mt-1">{isCard ? "Should look like GHA-123456789-0" : "5 to 20 letters and numbers, exactly as printed"}</p>)}
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Photo of {PHOTO_OF[idType] || "your document"}</label>
                {/* Shown BEFORE the upload button, in red, so it's read before a photo is chosen. */}
                <div className="border border-bad-line bg-bad-bg rounded-xl p-3 mb-2 text-sm text-bad-fg">
                  <div className="font-bold mb-1">📸 Before you upload, make sure:</div>
                  <ul className="list-disc pl-5 space-y-0.5 font-semibold">
                    <li>It's <b>{PHOTO_OF[idType]}</b></li>
                    <li>The <b>whole document</b> is in the photo, all four corners</li>
                    <li>Your <b>name and document number</b> are sharp and easy to read</li>
                    <li>Good light: no glare, no shadow, nothing covering it</li>
                  </ul>
                  <div className="mt-1">Unclear photos will be sent back and you'll need to upload again.</div>
                </div>
                <input type="file" accept="image/*" onChange={choosePhoto} className="block text-sm" />
                {shownPhoto && <img src={shownPhoto} alt={`Your ${docName}`} className="mt-2 max-h-48 rounded-lg border border-line" />}
              </div>
            </>
          )}
          {error && <p className="text-sm text-hibiscus-deep">{error}</p>}
          <div className="flex gap-2">
            <button onClick={submit} disabled={!canSubmit} className="px-5 py-3 rounded-full bg-hibiscus text-white font-bold disabled:opacity-40">
              {busy ? "Submitting…" : status === "REJECTED" || editing ? "Resubmit" : "Submit for review"}
            </button>
            {editing && <button onClick={() => setEditing(false)} className="px-5 py-3 rounded-full border border-line font-bold">Cancel</button>}
          </div>
        </div>
      )}
    </div>
  );
}
