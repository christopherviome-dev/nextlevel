// Browser-side copy of the backend's identity rules (lib/identity.js on the
// server), used only for instant feedback while typing. The server re-checks
// everything and has the final say, so this can never be used to bypass it.

const CARD_PATTERN = /^([A-Z]{3})-?(\d{8,9})-?([0-9A-Z])$/;

export function normalizeGhanaCard(raw) {
  if (typeof raw !== "string") return null;
  const compact = raw.toUpperCase().replace(/[\u2010-\u2015]/g, "-").replace(/\s+/g, "");
  const m = compact.match(CARD_PATTERN);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

const NAME_PATTERN = /^[\p{L}][\p{L}'’.\- ]*[\p{L}.]$/u;

export function cleanLegalName(raw) {
  const name = String(raw || "").replace(/\s+/g, " ").trim();
  if (name.length < 5 || name.length > 100) return { ok: false, error: "Enter your full name as it appears on your Ghana Card." };
  if (!NAME_PATTERN.test(name)) return { ok: false, error: "Use letters only (spaces, hyphens and apostrophes are fine)." };
  const parts = name.split(/[\s\-'’.]+/).filter((t) => t.length >= 2);
  if (parts.length < 2) return { ok: false, error: "Enter at least your first name and surname, exactly as on the card." };
  return { ok: true, name };
}

// Shows only the last 4 digits of the card number, e.g. GHA-*****6789-0
export function maskCard(card) {
  const m = String(card || "").match(/^([A-Z]{3})-(\d+)-(.)$/);
  if (!m) return "••••";
  return `${m[1]}-${"*".repeat(Math.max(0, m[2].length - 4))}${m[2].slice(-4)}-${m[3]}`;
}
