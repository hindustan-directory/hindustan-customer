# Hindustan Directory — Customer

Expo 57 customer app for browsing businesses, favourites, enquiries, and bookings.

Vendor panel: sibling folder [`../Hindustan`](../Hindustan).

**New agent?** Read [`docs/CODEBASE.md`](docs/CODEBASE.md) first (features, code map, patterns).

Recent refactors: [`CHANGES_SUMMARY.md`](CHANGES_SUMMARY.md).

## Setup

```bash
npm install
cp .env.example .env   # live HTTPS API by default; override for local backend
npm start
```

### Local backend (HTTP, dev only)

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.76:4000/api/v1
EXPO_PUBLIC_ALLOW_CLEARTEXT=true
```

Release builds **must** use an HTTPS API URL.

## Panel auth

Login always sends `role: "customer"`. `AuthProvider` rejects vendor tokens.

Refresh token key: `hd_customer_refresh_token` (secure storage).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run selfcheck` | Runtime checks (API client, base URL) |
| `./node_modules/.bin/tsc --noEmit` | Typecheck |

## Android release builds

1. Copy `.env.example` → `.env` and set release signing vars.
2. Place `hindustan-customer-release-key.keystore` in the project root (gitignored).
3. Run:

```bash
chmod +x build-apk.sh build-production.sh   # first time only
./build-apk.sh          # signed release APK → ~/Desktop
./build-production.sh   # signed release AAB → ~/Desktop (Google Play)
```

Or via npm:

```bash
npm run build:apk
npm run build:aab
```

Each script runs `expo prebuild`, injects signing config, then Gradle `assembleRelease` / `bundleRelease`. Output: `HindustanCustomer-v{version}-Release.apk` or `…-PlayStore.aab` on the Desktop.

Requires Android SDK (`ANDROID_HOME` or `~/Library/Android/sdk`). Set `EXPO_PUBLIC_API_BASE_URL_PROD` in `.env` for release API URL override.

## Project layout (high level)

```
app/                    Expo Router screens
components/
  customer/business/    BusinessHeader, TabBar, ProductRow, ReviewRow
  customer/BrandIcons.tsx   Social + WhatsApp icons, label helpers
  customer/FilterList.tsx   FormSelectSheet, SelectSheet (filter/forms)
  customer/SheetModal.tsx   Shared bottom sheet (enquiry, review, report)
  Shimmer.tsx           Loading placeholders (accent / business / detail variants)
  SignInGate.tsx        Reusable sign-in placeholder
src/
  api/                  client, endpoints, types, baseUrl
  lib/                  datetime (timeGreeting), money, phone, safeLinking, env
  stores/               businessDetailStore (Zustand)
app.config.ts           Native config (no arbitrary iOS loads; cleartext gated)
eas.json                EAS build profiles
scripts/                android-release-build.sh, inject-android-signing.mjs
```

## UI notes

- Lists: **FlashList** on home, search, business products/reviews tabs.
- Business detail: tabbed **About / Products / Reviews** via `businessDetailStore`.
- Business profile contact: **Call** and **WhatsApp** labeled buttons with brand icon.
- **Sheets:** `SheetModal` — full-screen dim, white panel to bottom (enquiry, review, report).
- **Forms:** `FormSelectSheet` available in `customer/FilterList.tsx` for 4+ option pickers.
- Home tab: **`timeGreeting()`** (morning / afternoon / evening).
- Loading: **`ShimmerBusinessDetail`** matches hero + tab bar + contact button layout.
