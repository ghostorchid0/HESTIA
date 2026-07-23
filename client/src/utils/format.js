export function formatCurrency(value, currency = '$') {
  return `${currency}${Number(value || 0).toFixed(2)}`
}
