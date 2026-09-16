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

## Android APK (share with colleagues — same as vendor app)

Same flow as `../Hindustan`: `./build-apk.sh` → `assembleRelease` → Desktop. No release keystore needed (Expo debug signing for sideload).

```bash
# For http:// staging API, also add to .env:
EXPO_PUBLIC_ALLOW_CLEARTEXT=true

chmod +x build-apk.sh   # first time only
./build-apk.sh           # or: npm run build:apk
```

Output: `~/Desktop/HindustanCustomer-v{version}-Release.apk`

Gradle deprecation warnings from `node_modules` (reanimated, expo, etc.) are normal — **BUILD SUCCESSFUL** is what matters.

## Play Store AAB (production signing)

Requires release keystore + signing env vars in `.env`:

```bash
./build-production.sh   # or: npm run build:aab
```

Output: `~/Desktop/HindustanCustomer-v{version}-PlayStore.aab`

## Android debug APK (optional)

Faster debug-signed build if release sideload has issues:

```bash
./build-debug-apk.sh    # or: npm run build:debug
```

Output: `~/Desktop/HindustanCustomer-v{version}-Debug.apk`

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
