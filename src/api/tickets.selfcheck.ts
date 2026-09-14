export {};

import type {
  ApiEnvelope,
  Paginated,
  Ticket,
  TicketNote,
} from "./types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function readData<T>(envelope: ApiEnvelope<T>): T {
  assert(typeof envelope.success === "boolean", "invalid envelope");
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

const sampleTicket: Ticket = {
  id: "t1",
  ticketNo: 42,
  raisedById: "u1",
  vendorId: null,
  subject: "Cannot see my booking",
  description: "My booking disappeared after payment.",
  priority: "high",
  status: "open",
  assignedToId: null,
  resolvedAt: null,
  createdAt: "2026-09-15T10:00:00.000Z",
  updatedAt: "2026-09-15T10:00:00.000Z",
  raisedBy: { id: "u1", fullName: "Asha Rao", role: "customer" },
  assignedTo: null,
  vendor: null,
};

// POST /tickets → 201 Ticket
const createEnvelope: ApiEnvelope<Ticket> = { success: true, data: sampleTicket };
const created = readData(createEnvelope);
assert(created.ticketNo === 42, "ticketNo");
assert(created.status === "open", "status open");
assert(created.priority === "high", "priority high");

// GET /tickets/my → paginated Ticket[]
const listEnvelope: ApiEnvelope<Paginated<Ticket>> = {
  success: true,
  data: { items: [sampleTicket], page: 1, pageSize: 10, total: 1, totalPages: 1 },
};
const list = readData(listEnvelope);
assert(list.items.length === 1 && list.totalPages === 1, "tickets pagination");

// GET /tickets/:id/notes → paginated TicketNote[], oldest-first
const note: TicketNote = {
  id: "tn1",
  ticketId: "t1",
  authorId: "u1",
  note: "Any update?",
  isInternal: false,
  createdAt: "2026-09-15T11:00:00.000Z",
  updatedAt: "2026-09-15T11:00:00.000Z",
  author: { id: "u1", fullName: "Asha Rao", role: "customer" },
};
const notesEnvelope: ApiEnvelope<Paginated<TicketNote>> = {
  success: true,
  data: { items: [note], page: 1, pageSize: 50, total: 1, totalPages: 1 },
};
const notes = readData(notesEnvelope);
assert(notes.items[0]!.isInternal === false, "note isInternal");
assert(notes.items[0]!.ticketId === "t1", "note ticketId");

// POST /tickets/:id/notes → 201 TicketNote
const addNoteEnvelope: ApiEnvelope<TicketNote> = { success: true, data: note };
assert(readData(addNoteEnvelope).note === "Any update?", "added note");

console.log("tickets.selfcheck: ok");
