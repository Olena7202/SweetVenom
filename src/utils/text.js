export function normalizeDashes(value) {
  return typeof value === "string" ? value.replace(/[\u2010-\u2015\u2212]/g, "-") : value;
}
