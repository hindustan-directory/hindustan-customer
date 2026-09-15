# Push Notifications — Setup Guide (Android via EAS)

Status: **client-side registration is implemented** in both apps
(`src/push/pushNotifications.ts`, wired into `src/auth/AuthProvider.tsx`;
backend endpoints `POST`/`DELETE /notifications/devices`, PR #245).

Delivery is **not live yet** — the steps below turn it on.

---

## How push works here (the key mental model)

The app fetches an **Expo push token** (`getExpoPushTokenAsync`). Delivery path:

```
your backend  →  Expo Push Service  →  FCM (Android) / APNs (iOS)  →  device
```

**Implication:** the FCM credentials live in **EAS/Expo**, *not* on your backend.
The backend just POSTs the Expo token to Expo's API.

## ⚠️ Expo Go does not support remote push (SDK 53+)

- `expo-notifications` remote push was removed from Expo Go; even *importing* it
  crashes in Expo Go. Our code guards against this — `registerPushTokenAsync()`
  bails **before** touching `expo-notifications` when running in Expo Go (and
  when there's no EAS `projectId`), so the app runs fine in Expo Go and push
  simply no-ops.
- To actually get a token + receive notifications you need a **development or
  standalone build** (an APK), not Expo Go.

## App package names

| App | Android package |
|-----|-----------------|
| Vendor (`Hindustan`) | `com.hindustandirectory.vendor` |
| Customer (`Hindustan-Customer`) | `com.hindustan.directory.customer` |

Do the steps below **per app**.

---

## Prereqs

```bash
npm i -g eas-cli
eas login          # free Expo account
```

## Step 1 — EAS project id (fixes the "no projectId" no-op)

Run inside each app directory:

```bash
eas init
```

Writes `extra.eas.projectId` into the config — exactly what
`registerPushTokenAsync()` needs to stop skipping.

## Step 2 — Firebase project + `google-services.json`

1. https://console.firebase.google.com → create (or reuse) a project.
2. **Add app → Android**, enter the package name (e.g. `com.hindustandirectory.vendor`).
3. Download **`google-services.json`** into the app root.
4. Point the build at it — in `app.config.ts` under `android`:
   ```ts
   android: {
     package: "com.hindustandirectory.vendor",
     googleServicesFile: "./google-services.json",
     // …existing keys…
   },
   ```
   This lets the device obtain an FCM token at runtime (so Expo can mint the push token).

## Step 3 — Upload the FCM **V1** service-account key to EAS

Legacy FCM server keys are deprecated; Expo needs the FCM **V1** service-account JSON:

1. Firebase → **Project settings → Service accounts → Generate new private key** → downloads a JSON.
2. Upload it to Expo:
   ```bash
   eas credentials -p android
   # → Push Notifications: Manage your FCM V1 service account key → upload the JSON
   ```
   Now Expo's servers can authenticate to *your* FCM project to deliver.

## Step 4 — Build a real Android app (not Expo Go)

```bash
eas build --profile development --platform android   # dev-client APK, or:
eas build --profile preview --platform android       # standalone APK to sideload
```

Install the APK on a physical device, sign in → `registerPushTokenAsync()` gets a
token and calls `POST /notifications/devices`.

---

## Step 5 (backend) — wire the sender (backend team)

Because the app stores **Expo** tokens, the backend sends through Expo's API —
**no FCM key on the backend needed**:

```ts
import { Expo } from "expo-server-sdk";
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN }); // optional but recommended

// When a Notification row is created for a user, fan out to their device_tokens:
const messages = tokens
  .filter((t) => Expo.isExpoPushToken(t.token))
  .map((t) => ({ to: t.token, title, body, data: { type, referenceType, referenceId } }));

for (const chunk of expo.chunkPushNotificationMessages(messages)) {
  const receipts = await expo.sendPushNotificationsAsync(chunk);
  // later: poll expo.getPushNotificationReceiptsAsync(ids)
  // on "DeviceNotRegistered" → delete that device_tokens row
}
```

Hook this into `services/notifications.ts` (where `in_app` rows are already
written), keep it non-blocking, and clean up dead tokens on `DeviceNotRegistered`.
`EXPO_ACCESS_TOKEN` comes from expo.dev → Account → Access Tokens.

---

## 🔒 Security — don't commit the secrets

Both downloaded files are sensitive. Add to `.gitignore`:

```
google-services.json
*service-account*.json
```

The FCM V1 service-account JSON is a **private key** — it is only ever uploaded
to EAS via `eas credentials`, never committed.

---

## TL;DR order for Android

1. `eas init` (each app) → projectId
2. Firebase → `google-services.json` → add `android.googleServicesFile` to `app.config.ts`
3. FCM V1 service-account JSON → `eas credentials -p android`
4. `eas build -p android --profile preview` → install APK → sign in → token registers
5. Backend: `expo-server-sdk` sender + receipt cleanup

## iOS (later)

Needs an Apple Developer account; upload an **APNs key** via `eas credentials -p ios`.
Everything else (token fetch, `/notifications/devices`, the Expo sender) is identical.
