const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-11" -> "Nov"; anything else is returned unchanged
export const monthLabel = value => {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || ''));
  return match ? MONTHS[Number(match[2]) - 1] || value : String(value || '');
};

// Short amount for chart bars: 813 -> "813", 4600 -> "4.6k", 45000 -> "45k", 1250000 -> "12.5L"
export const compactAmount = value => {
  const n = Number(value) || 0;
  if (n >= 100000) return `${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(Math.round(n));
};
