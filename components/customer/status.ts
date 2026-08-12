import type { BookingStatus, EnquiryStatus } from "../../src/api/types";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
  rescheduled: "Rescheduled",
};

export const BOOKING_STATUS_TONE: Record<BookingStatus, string> = {
  requested: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-ink-100 text-ink-600 border-ink-200",
  no_show: "bg-ink-100 text-ink-600 border-ink-200",
  rescheduled: "bg-ink-100 text-ink-600 border-ink-200",
};

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  responded: "Responded",
  closed: "Closed",
};

export const ENQUIRY_STATUS_TONE: Record<EnquiryStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  responded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-ink-100 text-ink-600 border-ink-200",
};
