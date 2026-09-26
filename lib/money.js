// Money shown the way each currency is normally written: GH₵1.00, £1.00.
const LOCALE = { GHS: "en-GH", GBP: "en-GB" };
export function formatMoney(amount, currency = "GHS") {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
  try { return new Intl.NumberFormat(LOCALE[currency] || "en", { style: "currency", currency }).format(amount); }
  catch (e) { return `${currency} ${amount.toFixed(2)}`; }
}
// Amounts stored in minor units (pesewas, pence) to avoid rounding errors.
export const formatMinor = (minor, currency = "GHS") => formatMoney((minor || 0) / 100, currency);
