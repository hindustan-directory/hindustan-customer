export {};

type Envelope<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: { fieldErrors?: Record<string, string[]> };
      };
    };

function readData<T>(envelope: Envelope<T>): T {
  if (typeof envelope.success !== "boolean") {
    throw new Error("invalid envelope");
  }
  if (!envelope.success) {
    const err = new Error(envelope.error.message) as Error & {
      fieldErrors: Record<string, string[]>;
      code: string;
    };
    err.code = envelope.error.code;
    err.fieldErrors = envelope.error.details?.fieldErrors ?? {};
    throw err;
  }
  return envelope.data;
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const ok = readData({ success: true as const, data: { id: "1" } });
assert(ok.id === "1", "id mismatch");

let threw = false;
try {
  readData({
    success: false as const,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: { fieldErrors: { email: ["A valid email is required"] } },
    },
  });
} catch (e) {
  threw = true;
  const err = e as Error & { fieldErrors: Record<string, string[]> };
  assert(err.fieldErrors.email?.[0] === "A valid email is required", "fieldErrors");
}
assert(threw, "expected throw");

console.log("client.selfcheck: ok");
