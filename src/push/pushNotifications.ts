import Constants from "expo-constants";
import { Platform } from "react-native";
import { notificationsApi } from "../api/endpoints";

/**
 * Push device-token registration (backend: POST/DELETE /notifications/devices, #245).
 *
 * IMPORTANT — Expo Go safety: `expo-notifications` remote-push was removed from
 * Expo Go in SDK 53, and merely IMPORTING it throws at module-load time there.
 * So this module must NOT statically import it. We bail on Expo Go (and other
 * unsupported environments) FIRST, then lazy-`import()` the native modules only
 * in a real dev/standalone build.
 *
 * Best-effort BY DESIGN: never throws; a failure here must never block auth or
 * app startup. It silently no-ops in Expo Go, on web/simulators, when the OS
 * permission is denied, or when no EAS `projectId` is configured yet.
 *
 * The push token is treated as a credential-ish value: it is NEVER written to a log.
 */

let lastRegisteredToken: string | null = null;

/** Dev-only diagnostics. Never logs the token. */
function devWarn(reason: string, err?: unknown): void {
  if (__DEV__) console.warn(`[push] ${reason}`, err instanceof Error ? err.message : "");
}

/** Expo Go can't do remote push (SDK 53+); importing expo-notifications there throws. */
function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

function resolveProjectId(): string | undefined {
  const fromConfig = Constants.expoConfig?.extra?.eas?.projectId;
  const fromEas = Constants.easConfig?.projectId;
  const id = fromConfig ?? fromEas;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

/**
 * Register this device's Expo push token with the backend. Idempotent server-side,
 * so it's safe to call on every sign-in and every launch with a live session.
 * Never throws.
 */
export async function registerPushTokenAsync(): Promise<void> {
  try {
    const platform = Platform.OS;
    if (platform !== "android" && platform !== "ios") return; // web / unsupported

    // Bail BEFORE importing expo-notifications — the import itself throws in Expo Go.
    if (isExpoGo()) {
      devWarn("skipped: Expo Go cannot register for remote push (needs a dev build)");
      return;
    }
    const projectId = resolveProjectId();
    if (!projectId) {
      devWarn("skipped: no EAS projectId (run `eas init`, set extra.eas.projectId)");
      return;
    }

    // Lazy-load native modules ONLY in a real build (never in Expo Go).
    const Notifications = await import("expo-notifications");
    const Device = await import("expo-device");

    if (!Device.isDevice) {
      devWarn("skipped: push tokens are unavailable on simulators/emulators");
      return;
    }

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted || existing.status === "granted";
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.granted || requested.status === "granted";
    }
    if (!granted) {
      devWarn("skipped: notification permission not granted");
      return;
    }

    if (platform === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) {
      devWarn("skipped: empty push token from Expo");
      return;
    }

    await notificationsApi.registerDevice({
      token,
      platform,
      deviceName: Device.deviceName ?? undefined,
    });
    lastRegisteredToken = token;
  } catch (err) {
    // Recover and continue: push is a non-critical enhancement — a failure here
    // must never block sign-in, sign-up, or session restore.
    devWarn("registration failed", err);
  }
}

/**
 * Unregister the token this device last registered (call on logout). Never throws;
 * server-side this only ever affects the caller's own rows.
 */
export async function unregisterPushTokenAsync(): Promise<void> {
  const token = lastRegisteredToken;
  if (!token) return;
  try {
    await notificationsApi.unregisterDevice(token);
  } catch (err) {
    devWarn("unregister failed", err);
  } finally {
    lastRegisteredToken = null;
  }
}
