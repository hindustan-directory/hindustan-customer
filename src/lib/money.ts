export function formatPriceRange(min: string | null, max: string | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `₹${min} – ₹${max}`;
  if (min != null) return `From ₹${min}`;
  return `Up to ₹${max}`;
}
