export const bakery = {
  city: "Львів",
  phone: "068 351 12 75",
  phoneHref: "tel:+380683511275",
  leadDays: 2,
  timeZone: "Europe/Kyiv",
};
export const CHECKOUT_DRAFT_KEY = "sweet_venom_checkout_draft";
export function earliestOrderDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: bakery.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type) => Number(parts.find((p) => p.type === type).value);
  const date = new Date(Date.UTC(value("year"), value("month") - 1, value("day") + bakery.leadDays));
  return date.toISOString().slice(0, 10);
}
export function weightInKg(value, fallback = 1) {
  const match = String(value ?? "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  const number = match ? Number(match[0]) : NaN;
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return /(?:^|\s)г(?:\s|$)/i.test(String(value)) ? number / 1000 : number;
}
export function calculateCakePrice(cake, weight, quantity = 1, extras = 0) {
  const baseWeight = weightInKg(cake?.weight, 1);
  const unit = Math.round(Number(cake?.basePrice ?? cake?.price ?? 0) * Number(weight) / baseWeight) + Number(extras);
  return { unit, total: unit * Number(quantity) };
}
export function normalizePhone(value) {
  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) digits = `38${digits}`;
  return /^380\d{9}$/.test(digits) ? `+${digits}` : "";
}
export function readCheckoutDraft() {
  try { return JSON.parse(sessionStorage.getItem(CHECKOUT_DRAFT_KEY) || "null"); } catch { return null; }
}
export function money(value) { return new Intl.NumberFormat("uk-UA", { style:"currency", currency:"UAH", maximumFractionDigits:0 }).format(Number(value) || 0); }
