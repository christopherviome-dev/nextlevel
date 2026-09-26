// Money shown the way each currency is normally written: GH₵300, £25.50.
// Whole amounts drop the ".00" (prices read cleaner); others keep two decimals.
const LOCALE = { GHS: "en-GH", GBP: "en-GB" };
export function formatMoney(amount, currency = "GHS") {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
  const whole = Number.isInteger(amount);
  try {
    return new Intl.NumberFormat(LOCALE[currency] || "en", {
      style: "currency", currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2,
    }).format(amount);
  } catch (e) { return `${currency} ${amount}`; }
}
// Amounts stored in minor units (pesewas, pence) to avoid rounding errors.
export const formatMinor = (minor, currency = "GHS") => formatMoney((minor || 0) / 100, currency);
// The symbol alone, for input labels: "GH₵", "£".
export function currencySymbol(currency = "GHS") {
  try {
    const part = new Intl.NumberFormat(LOCALE[currency] || "en", { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency");
    return part ? part.value : currency;
  } catch (e) { return currency; }
}
