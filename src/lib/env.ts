export function isDevBuild() {
  if (typeof __DEV__ !== "undefined") return __DEV__;
  return process.env.NODE_ENV !== "production";
}
