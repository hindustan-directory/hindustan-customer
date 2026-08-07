# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# TypeScript

Sole project config: `tsconfig.json` in this repo. Do **not** add a parent `tsconfig.json`.

- Always lint-check before stopping (`ReadLints` / `tsc --noEmit` / eslint as available); fix issues from your edits.

# Panel

This app is the **customer** panel for Hindustan Directory.

Sibling vendor app: `../Hindustan` (`role: "vendor"`).

# Backend API (contract — must integrate)

**Always read** [`docs/API_INTEGRATION_GUIDE.md`](docs/API_INTEGRATION_GUIDE.md) before implementing any API call, auth, or screen that talks to the backend.

Rules for this mobile app:
- Treat Request/Response blocks as ground truth — **do not invent fields**.
- Base URL: `EXPO_PUBLIC_API_BASE_URL` (dev default `http://192.168.1.76:4000/api/v1` for physical devices on LAN).
- Envelope: `{ success, data }` / `{ success: false, error }` — always read `data`.
- Auth: Bearer access token; refresh tokens **rotate** — serialize refresh; store refresh in secure storage (key `hd_customer_refresh_token`).
- Login is panel-scoped: hardcode `role: "customer"`.
- Public directory endpoints (`/directory/*`) need **no auth**.
- Do not build against gaps in §18 (notifications read API, push, accounts, support) until those endpoints exist.
- Do not call vendor-only routes (`/vendors/me`, `/inventory`, `/leads`, vendor booking management).
