import type {
  BookingStatus,
  EnquiryStatus,
  TicketPriority,
  TicketStatus,
} from "../../src/api/types";

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

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_on_customer: "Awaiting you",
  resolved: "Resolved",
  closed: "Closed",
};

export const TICKET_STATUS_TONE: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  waiting_on_customer: "bg-violet-50 text-violet-700 border-violet-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-ink-100 text-ink-600 border-ink-200",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const TICKET_PRIORITY_TONE: Record<TicketPriority, string> = {
  low: "bg-ink-100 text-ink-600 border-ink-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-rose-50 text-rose-700 border-rose-200",
};
