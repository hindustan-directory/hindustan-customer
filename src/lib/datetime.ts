const PLAIN_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Wall-clock booking time — plain "HH:mm" or UTC-anchored ISO instant. */
export function formatSlotTime(value: string): string {
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  if (value.includes("T")) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toISOString().slice(11, 16);
  }
  return "—";
}

export function formatBookingDate(value: string): string {
  if (PLAIN_DATE_RE.test(value)) {
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  if (value.includes("T")) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return "—";
}

/** Real UTC instant → local calendar date for enquiry/review rows. */
export function formatCreatedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function formatSessionWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export function todayUtcMidnight(): number {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

export function isUpcomingBooking(bookingDate: string, todayUtc: number): boolean {
  const bookingDay = new Date(bookingDate).getTime();
  return !Number.isNaN(bookingDay) && bookingDay >= todayUtc;
}

/** Local wall-clock greeting: morning until noon, afternoon until 4 PM, then evening. */
export function timeGreeting(forHour = new Date().getHours()): string {
  if (forHour < 12) return "Good morning";
  if (forHour < 16) return "Good afternoon";
  return "Good evening";
}
