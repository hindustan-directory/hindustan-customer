export {};

import type {
  AppNotification,
  ApiEnvelope,
  Paginated,
} from "./types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

/** Envelope-unwrap identical to apiRequest — validates the shapes compile + parse. */
function readData<T>(envelope: ApiEnvelope<T>): T {
  assert(typeof envelope.success === "boolean", "invalid envelope");
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

// GET /notifications → paginated AppNotification list (same shape as favourites/enquiries).
const listEnvelope: ApiEnvelope<Paginated<AppNotification>> = {
  success: true,
  data: {
    items: [
      {
        id: "n1",
        userId: "u1",
        type: "booking_reminder",
        channel: "in_app",
        title: "Booking reminder",
        body: "Your appointment is tomorrow.",
        isRead: false,
        sentAt: "2026-09-15T10:00:00.000Z",
        deliveryStatus: "sent",
        deliveryAttempts: 1,
        referenceType: "booking",
        referenceId: "b1",
        createdAt: "2026-09-15T10:00:00.000Z",
        updatedAt: "2026-09-15T10:00:00.000Z",
      },
    ],
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
  },
};

const list = readData(listEnvelope);
assert(list.items.length === 1, "notifications items");
assert(list.items[0]!.channel === "in_app", "channel in_app");
assert(list.items[0]!.isRead === false, "unread flag");
assert(list.total === 1 && list.totalPages === 1, "pagination fields");

// GET /notifications/unread-count → { count }
const countEnvelope: ApiEnvelope<{ count: number }> = {
  success: true,
  data: { count: 3 },
};
assert(readData(countEnvelope).count === 3, "unread count");

// PATCH /notifications/:id/read → updated AppNotification
const readEnvelope: ApiEnvelope<AppNotification> = {
  success: true,
  data: { ...listEnvelope.data.items[0]!, isRead: true },
};
assert(readData(readEnvelope).isRead === true, "marked read");

// PATCH /notifications/read-all → { count }
const readAllEnvelope: ApiEnvelope<{ count: number }> = {
  success: true,
  data: { count: 3 },
};
assert(readData(readAllEnvelope).count === 3, "read-all count");

console.log("notifications.selfcheck: ok");
