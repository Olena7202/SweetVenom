const KYIV_ZONE = "Europe/Kyiv";
export function studioDayKey(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("sv-SE", { timeZone: KYIV_ZONE, year:"numeric", month:"2-digit", day:"2-digit" }).format(date);
}
export function isClosedStudioOrder(order) {
  return ["delivered", "cancelled", "canceled", "виконані", "виконано", "скасовано"].includes(String(order.status || "").trim().toLowerCase());
}
export function studioTodayOrders(orders, now) {
  const today = studioDayKey(now);
  return orders.filter(order => !isClosedStudioOrder(order) && studioDayKey(order.deliveryDate) === today);
}
