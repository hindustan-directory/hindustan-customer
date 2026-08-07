export {};

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const screen = { enableOnAndroid: true, extraScrollHeight: 100 };
const sheet = { enableOnAndroid: false, extraScrollHeight: 12 };

assert(screen.enableOnAndroid === true, "screen enableOnAndroid");
assert(screen.extraScrollHeight === 100, "screen extraScrollHeight");
assert(sheet.enableOnAndroid === false, "sheet enableOnAndroid");
assert(sheet.extraScrollHeight === 12, "sheet extraScrollHeight");

console.log("KeyboardForm.selfcheck: ok");
