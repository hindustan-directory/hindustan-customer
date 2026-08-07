# API Integration Guide — Hindustan Directory

**Audience:** Frontend (web) and Android/mobile developers integrating against the
live backend. **Purpose:** everything needed to call every endpoint correctly
without reading backend source. This file is generated from the actual code
(routes, zod schemas, Prisma models) as of PR #28 — it reflects all of
Milestone 1's backend (Auth, Vendor Management,
Public Directory, Customer Engagement, Inventory) plus Milestone 2 Steps 1–4
(CRM & Lead Management, Appointment/Booking & Slot Management, Calendar &
Tasks, Call Logs & Vendor Analytics) plus the
**complete** Vendor KYC Profile v2 expansion, Prompts 1, 3-7 (business
details, contact, address, location, timing, catalogue summary + SEO-keyword
search, verification documents incl. Aadhaar with private storage, media
rules, sales-executive assignment, source tracking, derived KYC status,
profile completion — plan/14-vendor-onboarding-v2.md,
plan/prompts-backend/milestone-1-step5b-prompts.md). OTP (Prompt 2) remains parked.
Registration now requires `agreeToTerms: true`. Franchise/District Admin,
vendor payout routing, and Trust Score are client-confirmed out of Phase 1
(2026-07-29) and are not implemented anywhere in this API.

> **Machine-readable note (for AI coding agents):** every endpoint below lists
> method, path, auth requirement, exact request body/query fields (with zod
> constraints), and exact response `data` shape. Treat the "Request" and
> "Response" blocks as ground truth — do not infer additional fields. When a
> field is `optional`, it may be omitted entirely from the JSON body.

---

## 1. Base setup

| | |
|---|---|
| Base URL (dev) | `http://localhost:4000/api/v1` |
| Base URL (prod/staging) | ask backend dev — set from `PUBLIC_BASE_URL` |
| Content-Type | `application/json` for all endpoints except file uploads (`multipart/form-data`) |
| Auth header | `Authorization: Bearer <accessToken>` on every authenticated request |
| Health check (unversioned) | `GET /health` → `{ status: "ok" }` |

### Response envelope (every endpoint, always)

```ts
// Success
{ "success": true, "data": T }

// Error
{
  "success": false,
  "error": { "code": "STRING_CODE", "message": "human readable", "details"?: unknown }
}
```

Always check `success` first. Never assume HTTP 2xx means the body is the data — read `data`, not the whole envelope.

### HTTP status codes used

| Status | Meaning | `error.code` |
|---|---|---|
| 200 | OK | — |
| 201 | Created | — |
| 400 | Bad request (business-rule rejection, e.g. bad category) | `BAD_REQUEST` |
| 401 | Not authenticated / invalid or expired token / wrong panel role at login | `UNAUTHENTICATED` |
| 403 | Authenticated but not permitted, or account deactivated | `UNAUTHORIZED` |
| 404 | Not found | `NOT_FOUND` |
| 409 | Conflict (duplicate email/phone, unique constraint) | `CONFLICT` |
| 422 | Validation failed (zod) | `VALIDATION_ERROR` |
| 429 | Rate limited | `RATE_LIMITED` |
| 500 | Unexpected server error | `INTERNAL` |

**422 validation error shape** — `error.details` is zod's `flatten()` output:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "formErrors": [],
      "fieldErrors": { "email": ["A valid email is required"] }
    }
  }
}
```
Map `fieldErrors` keys directly onto form fields for inline validation messages.

### Pagination

Any endpoint returning a list returns this `Paginated<T>` shape as `data`:
```ts
{ items: T[], page: number, pageSize: number, total: number, totalPages: number }
```
Query params: `page` (default 1), `pageSize` (default 20, max 100) — both optional, coerced from strings.

### Rate limits

- Global: 300 requests / 15 min per IP across the whole API.
- Credential endpoints (`/auth/register/*`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`): 50 / 15 min per IP. **Don't hammer login on typos in dev testing — you will get 429.**
- `429` responses include standard `RateLimit-*` headers.

---

## 2. Roles & panels

7 roles (exact string values — used in the `role` field everywhere):
`super_admin` · `admin` · `employee` · `vendor` · `customer` · `accounts` · `support`

**Login is panel-scoped** — the `role` you send in `POST /auth/login` must match the account's actual role, or you get a generic `401 Invalid email or password` (no role-leak). Build **one login screen per panel** and hardcode the `role` field per panel, e.g. the vendor app's login screen always sends `role: "vendor"`.

Only `customer` and `vendor` self-register (`/auth/register/*`). The other 5 roles are created by Super Admin/Admin via `/users` (see §4).

---

## 3. Auth Module (`/auth`)

### `POST /auth/register/customer`
No auth. Rate-limited.

**Request body:**
```ts
{
  fullName: string;      // 2–120 chars
  email: string;         // valid email, lowercased server-side
  phone: string;         // 7–20 chars, digits/+/-/space
  password: string;      // 8–72 chars, ≥1 letter, ≥1 digit
  agreeToTerms: true;    // REQUIRED — must literally be `true` or 422
  address?: string;      // max 300
  city?: string;         // max 80
}
```
**Response `data` (201):** `AuthResult` (see below).

### `POST /auth/register/vendor`
No auth. Rate-limited. Creates the user **and** the vendor profile in one transaction; vendor starts as `onboardingStatus: "pending"` (not publicly visible until an admin approves it — see §5).

**Request body:**
```ts
{
  // account
  fullName: string; email: string; phone: string; password: string;
  agreeToTerms: true;          // REQUIRED — must literally be `true` or 422
  referralCode?: string;       // max 40, capture-only (no reward logic yet)
  // business
  businessName: string;       // 2–160 chars
  categoryId: string;         // UUID — must be an existing, active BusinessCategory. GET /categories first.
  description?: string;       // max 2000
  businessPhone?: string;     // defaults to `phone` if omitted
  website?: string;           // must be a valid URL
  addressLine?: string;       // max 300
  city?: string;               // max 80
  state?: string;               // max 80
  pincode?: string;            // exactly 6 digits
}
```
**Response `data` (201):** `AuthResult`.

### `POST /auth/login`
No auth. Rate-limited.

**Request body:**
```ts
{ email: string; password: string; role: Role } // role = the panel's expected role
```
**Response `data` (200):** `AuthResult`.

**`AuthResult` shape (shared by register + login):**
```ts
{
  user: PublicUser;       // see §15 — password hash stripped
  accessToken: string;    // JWT, short-lived (~15 min) — send as Bearer on every request
  refreshToken: string;   // opaque string — store securely, use only against /auth/refresh
  expiresIn: number;      // access token lifetime in SECONDS
}
```
**Mobile/web token storage:** access token in memory; refresh token in secure storage (Keychain/Keystore on mobile, httpOnly-cookie-equivalent or secure storage on web — never `localStorage` in production if avoidable).

### `POST /auth/refresh`
No auth header needed — the refresh token IS the credential.

**Request:** `{ refreshToken: string }`
**Response `data`:** `{ accessToken: string; refreshToken: string; expiresIn: number }`

⚠️ **Refresh tokens rotate on every use** — the old one is invalidated immediately. Always replace your stored refresh token with the new one from the response. **Serialize your refresh calls** (don't fire two concurrent refreshes with the same stored token) — a race trips reuse-detection and revokes the session, forcing re-login. Recommended pattern: a single in-flight refresh promise that concurrent 401s await.

**Auto-refresh interceptor pattern:** on any `401` with `error.code === "UNAUTHENTICATED"` from an authenticated request, attempt one `/auth/refresh`, then retry the original request once. If refresh itself fails, force logout.

### `POST /auth/logout` — auth required
**Request:** `{ refreshToken?: string }` (optional — also revokes that specific token if given)
**Response `data`:** `{ loggedOut: true }`

### `POST /auth/change-password` — auth required
**Request:** `{ currentPassword: string; newPassword: string }`
**Response `data`:** `{ changed: true }`
Note: this **revokes every other active session** (logs out other devices), keeps the current one alive.

### `POST /auth/forgot-password` — no auth
**Request:** `{ email: string }`
**Response `data`:** `{ message: string }` — always the same generic message regardless of whether the email exists (no user enumeration). In dev only, response also includes `devResetToken` for testing without an email inbox.

### `POST /auth/reset-password` — no auth
**Request:** `{ token: string; newPassword: string }`
**Response `data`:** `{ reset: true }`
Resets and **revokes every active session** for that user.

### `GET /auth/sessions` — auth required
**Response `data`:** array of
```ts
{ id: string; deviceInfo: string | null; ip: string | null; createdAt: string; expiresAt: string; isCurrent: boolean }
```

### `DELETE /auth/sessions/:id` — auth required
Revoke one specific session by id (ownership-checked — 404 if it's not yours). **Includes your own current session if you pass its id** — use this if you really want to log out the session making the request. **Response `data`:** `{ revoked: true }`

### `DELETE /auth/sessions` — auth required
"Log out all **other** devices" — revokes every active session for the caller **except the one making this request**. Your current session stays logged in; `revoked` reflects only the other sessions that were terminated. To also end your current session, either call this and then `POST /auth/logout`, or use `DELETE /auth/sessions/:id` with your own session id. **Response `data`:** `{ revoked: number }`

---

## 4. Users Module (`/users`) — staff management

All routes require auth.

### `GET /users/me` / `PATCH /users/me` — any role
Self-service profile. `PATCH` body: `{ fullName?: string; phone?: string }` (at least one field required). Returns `PublicUser`.

### `POST /users/me/avatar` — any role
Upload or replace user avatar. **multipart/form-data**, field name **`avatar`** (JPEG/PNG/WebP, max 8MB). Single dedicated slot — re-uploading replaces the previous avatar (old file deleted from storage). Returns updated `PublicUser` with `avatarUrl` set (201).

### Staff CRUD — Super Admin / Admin only (`403` for everyone else)
| Method | Path | Notes |
|---|---|---|
| GET | `/users?page&pageSize&role&isActive&q` | `role` ∈ `admin,employee,accounts,support`; `isActive` = `"true"/"false"` string |
| POST | `/users` | body: `{ fullName, email, phone, role, password? }` — role restricted to `admin/employee/accounts/support`; `password` omitted → server generates a temp one (returned once — capture and show it) |
| GET | `/users/:id` | |
| PATCH | `/users/:id` | body: any of `{ fullName?, phone?, role?, isActive? }` |

---

## 5. Vendors Module (`/vendors`)

All routes require auth.

### Vendor self-service (role: `vendor` only)

| Method | Path | Body / Notes | Response `data` |
|---|---|---|---|
| GET | `/vendors/me` | — | full `Vendor` row (see §15) |
| PATCH | `/vendors/me` | any subset: `businessName, categoryId, description, phone, email, website, addressLine, city, state, pincode, latitude, longitude` (≥1 field). `pincode` = 6 digits, `latitude` ∈[-90,90], `longitude` ∈[-180,180] | updated `Vendor` |
| PATCH | `/vendors/me/business-details` | any subset (≥1 field): `businessEntityType, registrationYear, employeeCount, gstNumber, panNumber, cinLlpMsmeNumber` — see field notes below | updated `Vendor` |
| PATCH | `/vendors/me/contact` | any subset (≥1 field): `whatsappNumber, landlineNumber, alternateContactNumber, customerCareNumber, socialLinks` — see field notes below | updated `Vendor` |
| POST | `/vendors/me/logo` | **multipart/form-data**, field name **`logo`** (JPEG/PNG/WebP, max 8MB). Single dedicated slot — re-uploading replaces the previous logo (old file deleted from storage), it does not append. | updated `Vendor` (200) |
| DELETE | `/vendors/me/logo` | — | updated `Vendor` with `logoUrl: null` (200) |
| POST | `/vendors/me/cover-banner` | **multipart/form-data**, field name **`banner`** (JPEG/PNG/WebP, max 8MB). Same replace-not-append behavior as logo. | updated `Vendor` (200) |
| DELETE | `/vendors/me/cover-banner` | — | updated `Vendor` with `coverBannerUrl: null` (200) |
| PATCH | `/vendors/me/address` | any subset (≥1 field): `shopOfficeNumber, buildingName, street, area, landmark, city, district, state, country, pincode` — recomposes `addressLine` from the **merged** state (existing values + this patch), not just what you sent | updated `Vendor` |
| PATCH | `/vendors/me/location` | any subset (≥1 field): `latitude, longitude, googleMapLink, serviceRadiusKm` (int, 0–500) | updated `Vendor` |
| PATCH | `/vendors/me/timing` | any subset (≥1 field): `is24x7, hasEmergencyService` (booleans) | updated `Vendor` |
| PATCH | `/vendors/me/catalogue-summary` | any subset (≥1 field): `priceRangeMin, priceRangeMax, minOrderValue, maxOrderValue` (numbers ≥0, min must be ≤ max **against your saved values, not just this request** — see note below, or 400), `brandsAvailable, seoKeywords` (string arrays, clear with `[]` not `null`) | updated `Vendor` |
| PUT | `/vendors/me/hours` | `{ hours: [{ dayOfWeek: 0-6, isClosed: boolean, opensAt?: "HH:mm", closesAt?: "HH:mm" }, ...] }` (1–7 entries; `dayOfWeek` 0=Sunday) | array of `BusinessHour` |
| POST | `/vendors/me/photos` | **multipart/form-data**, field name **`photo`** (JPEG/PNG/WebP, max 8MB), optional form field `caption`. **Max 20 photos — 400 once at the cap.** No minimum enforced here (see profile-completion below for the 5-photo "media" checklist item). | created `VendorPhoto` (201) |
| PATCH | `/vendors/me/photos/reorder` | `{ order: string[] }` — array of photo UUIDs in desired order | `{ reordered: true }` |
| DELETE | `/vendors/me/photos/:id` | — | `{ deleted: true }` |
| POST | `/vendors/me/catalogues` | **multipart/form-data**, field name **`file`** (PDF/JPEG/PNG/WebP, max 15MB), optional text field **`kind`** ∈ `catalogue` \| `brochure` (defaults `catalogue` if omitted) | created `VendorCatalogue` (201) |
| DELETE | `/vendors/me/catalogues/:id` | — | `{ deleted: true }` |
| POST | `/vendors/me/documents` | **multipart/form-data**, field name **`file`** (PDF/JPEG/PNG/WebP, max **10MB**) + text field **`type`** ∈ `gst_certificate, pan_card, aadhaar, shop_act_license, msme_certificate, fssai, drug_license, trade_license, iso_certificate, other`. Always uploads `status: "pending"` — a vendor cannot set their own document's status. | created `VendorDocument` (201) |
| GET | `/vendors/me/documents` | your own uploaded documents | array of `VendorDocument` |
| GET | `/vendors/me/documents/:id/file` | **streams the raw file bytes** (not the JSON envelope) — `Content-Type` set from the stored file, `Content-Disposition: inline`. This is the **only** way to fetch a document's content — see the security note below. | binary |
| DELETE | `/vendors/me/documents/:id` | **only while `status: "pending"`** — 400 once an admin has reviewed it (verified or rejected) | `{ deleted: true }` |

> 🔒 **Security: vendor documents are never public.** Unlike photos/logo/banner/catalogues (which get a directly-fetchable public URL), `VendorDocument.fileUrl` is an **internal storage key**, not a URL — do not try to construct a link from it or `fetch()` it directly, it will not resolve to anything. The **only** way to get a document's bytes is `GET /vendors/me/documents/:id/file` (or the staff equivalent below), which checks auth + ownership on every request. This matters most for GST/PAN/**Aadhaar** scans — treat them as sensitive: don't cache the response, don't log the URL you built (there isn't one), and mask Aadhaar numbers in any UI that ever displays one directly (not just the file).
| GET | `/vendors/me/profile-completion` | — computed at read time, not stored | `ProfileCompletion` (see §15) |
| GET | `/vendors/me/enquiries?page&pageSize&status` | vendor's own enquiry inbox. Optional `status` ∈ `new, responded, closed` filters the `items`/`total`/pagination as normal. **`counts` is always the UNFILTERED breakdown across all three statuses** (`{ new, responded, closed }`), regardless of any `status` filter applied — use it to render a "new enquiries" badge without a second request, even while viewing a filtered list. | `Paginated<Enquiry> & { counts: { new: number; responded: number; closed: number } }` |

> ⚠️ **Cross-request validation note**: `priceRangeMin`/`priceRangeMax` and `minOrderValue`/`maxOrderValue` are validated against your **saved** values, not just the fields present in a single request. If you build a form that saves fields independently (or a multi-step wizard), a change that would push min above the already-saved max is rejected with `400`, even if that field alone looks fine in isolation. Don't rely on a single field's own bounds — the other side of the pair matters too.

**Multipart upload example (web, fetch):**
```js
const form = new FormData();
form.append('photo', fileInput.files[0]);
form.append('caption', 'Storefront');
await fetch(`${BASE}/vendors/me/photos`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` }, // NO Content-Type — browser sets multipart boundary
  body: form,
});
```

**`business-details` field notes:**
- `businessEntityType` ∈ `proprietorship, partnership, llp, pvt_ltd, public_ltd, ngo, trust, freelancer, employee`
- `registrationYear`: integer, 1900–(current year + 1)
- `employeeCount`: integer ≥ 0
- `gstNumber`: **auto-uppercased server-side**, must match the standard 15-char GSTIN pattern (`27AAACA4442A1Z5` shape) or 422
- `panNumber`: **auto-uppercased server-side**, must match the standard 10-char PAN pattern (`AAACA4442A` shape) or 422
- `cinLlpMsmeNumber`: free text, max 30 chars — one field for whichever of CIN/LLP/MSME applies
- `gstInvoiceAvailable`: boolean — informational only ("can this vendor issue GST invoices"), does not imply the platform generates them
- Send `null` for any field to explicitly clear it (vs. omitting the key, which leaves it unchanged)

**`contact` field notes:**
- `whatsappNumber` / `landlineNumber` / `alternateContactNumber` / `customerCareNumber`: same phone format as elsewhere (7–20 chars, digits/+/-/space)
- `socialLinks`: object with **only** these optional keys — `facebook, instagram, linkedin, youtube, twitter` — each must be a valid URL. **Strict schema: any other key is rejected with 422**, not silently dropped. Send `socialLinks: null` to clear all links at once (partial clear isn't supported — resend the object with only the keys you want to keep)
```ts
// PATCH /vendors/me/contact example body
{
  whatsappNumber: "9876543210",
  socialLinks: { facebook: "https://facebook.com/yourbiz", instagram: "https://instagram.com/yourbiz" }
}
```

### Admin / Employee (`super_admin`, `admin`, `employee`)

| Method | Path | Query / Body | Response `data` |
|---|---|---|---|
| GET | `/vendors?page&pageSize&status&categoryId&city&q` | `status` ∈ onboarding statuses (below) | `Paginated<Vendor>` |
| GET | `/vendors/:id` | — | full `Vendor`, **now includes `documents: VendorDocument[]` and `profileCompletion: ProfileCompletion`** |
| PATCH | `/vendors/:id/onboarding-status` | `{ status: OnboardingStatus; note?: string }` — **`onboardingNotes` on the vendor row is set to `note` if provided, or cleared to `null` otherwise; it never carries forward a previous transition's note.** e.g. approving with no `note` after a prior rejection/suspension clears that old reason, it does not keep showing on the record. The full history (each transition's own note) is unaffected — see `GET .../onboarding-history` below. | updated `Vendor` |
| GET | `/vendors/:id/onboarding-history` | — | array of `VendorOnboardingHistory` |
| GET | `/vendors/:id/documents` | — | array of `VendorDocument` for that vendor |
| GET | `/vendors/:id/documents/:docId/file` | streams the raw file bytes, same as the vendor-side endpoint above | binary |
| PATCH | `/vendors/:id/documents/:docId/review` | `{ status: 'verified' \| 'rejected'; note?: string }` — `'pending'` is not a valid review outcome (422); sets `reviewedById`/`reviewedAt` to you/now. **Also auto-recomputes the vendor's `kycStatus`** (see below). | updated `VendorDocument` |
| PATCH | `/vendors/:id/assign-sales-executive` | `{ employeeUserId: string }` — target must be an existing user with `role: "employee"` or `400` | updated `Vendor` |
| PATCH | `/vendors/:id/source` | `{ source: VendorSource }` | updated `Vendor` |

**Onboarding statuses:** `pending` · `under_review` · `approved` · `rejected` · `suspended`
Only `approved` vendors are visible in the public directory (§6).

**`kycStatus` is derived, not directly settable** — it recomputes automatically from the vendor's `VendorDocument` set on every upload, delete, and review:
- `not_started` — zero documents
- `in_progress` — at least one document, none rejected, not all verified
- `verified` — at least one document AND every document is `verified`
- `rejected` — **any** document is `rejected` (dominates even if others are verified — there's currently no path back once a document is rejected other than the reviewer changing that specific document's status again, since `DELETE` only works on `pending` documents)

---

## 6. Public Directory (`/directory`) — NO auth, use for the public app/web

### `GET /directory/search`
**Query:** `q?` (search text), `category?` (category **slug**, not id), `city?`, `rating?` (1–5, minimum), `page?`, `pageSize?`

**Response `data`:** `Paginated<VendorSearchResult>` where each item:
```ts
{
  id: string; slug: string; businessName: string; description: string | null;
  city: string | null; avgRating: string; reviewCount: number;
  categoryName: string; categorySlug: string; photoUrl: string | null;
}
```
(`avgRating` comes over the wire as a **decimal string**, e.g. `"4.3"` — parse with `Number()` before formatting/comparison, don't assume it's a JS number.)

### `GET /directory/business/:slug`
Full business profile. 404s if the vendor doesn't exist **or isn't approved** (pending vendors are invisible publicly — don't rely on this for admin preview).

**Response `data`:** `Vendor` with nested `category`, `hours[]`, `photos[]`, `catalogues[]` (see §15 for field names).

### `GET /directory/business/:slug/reviews?page&pageSize`
Only non-hidden reviews. **Response `data`:** `Paginated<{ id, rating, comment, createdAt, customerName }>`

### `GET /directory/business/:slug/products?categoryId&availability&page&pageSize`
`availability` ∈ `in_stock` · `out_of_stock` · `discontinued`. Only active products (`isActive: true`) of an approved vendor.
**Response `data`:** `Paginated<Product>` with nested `images[]`, `category`.

---

## 7. Customer Engagement (`/customer`)

### Reviews
| Method | Path | Role | Body | Notes |
|---|---|---|---|---|
| POST | `/customer/reviews` | `customer` | `{ vendorId: uuid, rating: 1-5, comment?: string }` | **Upsert** — one review per customer per vendor; posting again edits the existing review. 201. |
| GET | `/customer/reviews?page&pageSize` | `customer` | — | the caller's own reviews, `Paginated<Review>` — **includes hidden ones** (this is the author viewing/editing their own content, not the public list, which already excludes `isHidden` elsewhere). Each row includes `vendor: { id, slug, businessName }` so a "My Reviews" UI can link back and pre-fill the edit form without a second request per row. |
| PATCH | `/customer/reviews/:id/moderate` | `super_admin`,`admin` | `{ isHidden: boolean }` | |

### Favourites
| Method | Path | Role | Notes |
|---|---|---|---|
| POST `/customer/favourites/:vendorId` | `customer` | Upsert — always 201, safe to call repeatedly (favouriting an already-favourited vendor is a no-op, not an error) |
| DELETE `/customer/favourites/:vendorId` | `customer` | Also idempotent — `{ removed: boolean }` tells you whether anything was actually removed; never 404s on a repeat call |
| GET `/customer/favourites?page&pageSize` | `customer` | `Paginated<{ favouritedAt: string; vendor: { id, slug, businessName, city, avgRating, categoryName } }>` |

### Reports
| Method | Path | Role | Body |
|---|---|---|---|
| POST `/customer/reports` | `customer` | `{ vendorId: uuid, reason: ReportReason, details?: string }` |
| GET `/customer/reports?status&page&pageSize` | `super_admin`,`admin` | |
| PATCH `/customer/reports/:id` | `super_admin`,`admin` | `{ status: ReportStatus }` |

**`ReportReason`:** `fake` · `offensive` · `closed` · `wrong_info` · `other`
**`ReportStatus`:** `open` · `reviewed` · `actioned` · `dismissed`

### Enquiries — **guest-allowed**
| Method | Path | Auth | Body |
|---|---|---|---|
| POST `/customer/enquiries` | **optional** (works with or without a Bearer token) | `{ vendorId: uuid, name?: string, phone?: string, message?: string }` — `name`+`phone` **required if not logged in**; auto-filled from the account if logged in |
| GET `/customer/enquiries?page&pageSize` | `customer` required | own enquiries |

For a **guest checkout-style enquiry form** (no login), send `name` and `phone` in the body and omit the Authorization header entirely.

### Staff customer directory (`/customers`, plural) — `super_admin`,`admin`,`employee`,`vendor`

A **separate router from `/customer` above** — note the "s". The self-service surface (`/customer/...`) is what a signed-in customer uses on their own account; `/customers/...` is the directory for looking any customer up. Same underlying `Customer` rows, different auth boundary.

**`vendor` is scoped, staff are not.** A `vendor` caller only ever sees customers who have interacted with its own business — at least one enquiry, booking, or call log against it (any one counts, not all three). Every one of the three routes below applies this automatically; there's no `vendorId` param to pass. Same treatment as `/leads`, `/tasks`, `/calls`: a customer outside a vendor's scope is `404`, never `403` (doesn't confirm whether they exist). `q` search and the vendor-scope filter combine correctly (both narrow the result set, neither replaces the other). `GET /:id/history`'s per-type rows are **also** narrowed to the vendor's own interactions — a vendor sees only its own enquiries/bookings/calls/follow-ups/payments with that customer, never another vendor's, even once the customer itself has passed the scope check. `super_admin`/`admin`/`employee` see the full, unscoped directory, same as before.

| Method | Path | Notes |
|---|---|---|
| GET | `/customers?page&pageSize&q` | `q` searches the linked account's `fullName`/`email`/`phone` (case-insensitive contains). Each row includes `counts: { enquiries, bookings, reviews }` so the list is useful without a follow-up call per row. |
| GET | `/customers/:id` | Same shape as the list row plus `accountCreatedAt`, `updatedAt`, and a `favourites` count in addition to the other three. |
| GET | `/customers/:id/history?type=…` | Activity feed, one type at a time (not combined) — `type` is **required**, one of `calls`, `enquiries`, `bookings`, `follow_ups`, `payments`. Paginated (`page`/`pageSize`), same `Paginated<T>` envelope as everywhere else. |

**Response shape (list + detail):**
```ts
{
  id: string; userId: string;               // id = Customer.id, use this for :id everywhere above
  fullName: string; email: string; phone: string; isActive: boolean;
  address: string | null; city: string | null;
  createdAt: string;                        // detail also adds: accountCreatedAt, updatedAt
  counts: { enquiries: number; bookings: number; reviews: number };  // detail also adds: favourites
}
```

**History `type` → item shape:**
- `enquiries` → `Enquiry` with `vendor: { id, slug, businessName }`
- `bookings` → `Booking` (see §15 — `bookingDate`/`startTime`/`endTime` are plain strings, same guarantee as `/bookings`) with `vendor: { id, slug, businessName }`
- `calls` → `CallLog` row with `vendor: { id, slug, businessName }` (§13).
- `follow_ups` → `FollowUp` row with `lead: { id, name, vendorId }`. Only follow-ups on leads linked to this customer (`Lead.customerId`) — a customer's own manually-created leads if any exist, not every follow-up a vendor has ever scheduled.
- `payments` → `PaymentTransaction` row, matched by the customer's `userId` (payments are tracked against the payer's User, not a Customer row). **Always empty today** — Accounts/Payments hasn't shipped yet (#26), same "empty, not an error" note as `calls`.

---

## 8. Bookings & Slots (`/bookings`)

Full slot-based booking engine (M2 Step 2) — replaces M1's "any date/time accepted" basic capture. **A booking can only be created against a real, active, non-full slot** a vendor has defined; there is no longer an unchecked freeform booking path. All routes require auth; role per row below.

### Slots — vendor-only
Weekly recurring templates (not tied to a specific calendar date) that drive availability computation. Deleting a slot never touches existing bookings — bookings don't reference slots by id, they're matched by `(dayOfWeek, startTime, endTime)` at creation time.

| Method | Path | Role | Body |
|---|---|---|---|
| GET `/bookings/slots?includeInactive` | `vendor` | — | own slots, active-only by default |
| POST `/bookings/slots` | `vendor` | `{ dayOfWeek: 0-6, startTime: "HH:mm", endTime: "HH:mm", capacity?: number }` (default capacity 1; startTime < endTime) | 201 |
| PATCH `/bookings/slots/:id` | `vendor` | `{ dayOfWeek?, startTime?, endTime?, capacity?, isActive? }` (≥1) |
| DELETE `/bookings/slots/:id` | `vendor` | — |

### Availability — customer-only
`GET /bookings/availability?vendorId=uuid&date=YYYY-MM-DD` → array of:
```ts
{ dayOfWeek: number; startTime: string; endTime: string; capacity: number; booked: number; remaining: number; isAvailable: boolean; }
```
One entry per active slot matching that date's weekday. `booked` counts non-`cancelled`, non-`rescheduled` bookings on that exact date+slot (a rescheduled booking's original slot instance is freed — the demand moved to the new booking row created alongside it). `date` is read as a literal calendar date, no timezone shifting.

### Bookings — customer
| Method | Path | Body |
|---|---|---|
| POST `/bookings` | `{ vendorId: uuid, bookingDate: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm", notes?: string }` — **400** if no active slot matches that vendor/day/time exactly, **409** if the slot is at capacity for that date. Status starts `requested`. |
| GET `/bookings?page&pageSize` | own bookings, `Paginated<Booking>` |
| PATCH `/bookings/:id/cancel` | — only from `requested`/`confirmed` (409 otherwise) |

### Bookings — vendor management
| Method | Path | Body | Notes |
|---|---|---|---|
| GET `/bookings/requests?status&page&pageSize` | — | own bookings ("requests inbox"), any status filter |
| PATCH `/bookings/:id/status` | `{ status: "confirmed" \| "completed" \| "cancelled" \| "no_show" }` | "decline" = `cancelled` (no separate declined status in the enum). **409** if the booking is already terminal (`completed`/`cancelled`/`no_show`/`rescheduled`). |
| PATCH `/bookings/:id/reschedule` | `{ bookingDate, startTime, endTime }` | Validated exactly like a fresh `POST /bookings` (400/409 the same way). **Creates a new booking** (`status: "confirmed"`, `rescheduledFromId` pointing at the original) and marks the original `rescheduled`. Response is the **new** booking, 201. |
| PATCH `/bookings/:id/assign-staff` | `{ staffId: uuid \| null }` | `null` unassigns. **400** unless `staffId` is CRM staff (`employee`/`admin`/`super_admin`) or this booking's own vendor account — same authorization boundary as lead/follow-up assignment (§10). |

**`BookingStatus`:** `requested` · `confirmed` · `rescheduled` · `completed` · `cancelled` · `no_show`

### Booking reminders (background job, no HTTP surface yet)
A cron job runs every 15 minutes and sends a reminder for every `confirmed` booking starting within the next 24 hours that hasn't been reminded yet (`reminderSentAt` null on the `Booking` row). Writes two `Notification` rows per reminder (`channel: "in_app"` and `channel: "email"`) and stamps `reminderSentAt` so it never double-sends. There's no `GET /notifications` read API yet — that's M2 Step 8; for now the only way to observe a reminder fired is the `reminderSentAt` timestamp on the booking itself (present in every `Booking` response).

---

## 9. Inventory (`/inventory`) — vendor-only

All routes require auth as `vendor`. Every resource is ownership-scoped to the caller's own vendor row — `:id` from another vendor 404s, it never 403s (doesn't leak whether the id exists).

**Product categories are per-vendor**, distinct from the global `BusinessCategory` used for directory browsing (§5/§6). A product's `categoryId` must be one of *that vendor's own* product categories — a category id from `/categories` (the global taxonomy) or another vendor's product category is rejected with `400`, not `422` (it's a business-rule check, not a shape check).

### Product categories
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/inventory/product-categories?includeInactive` | — | own categories, active-only by default |
| POST | `/inventory/product-categories` | `{ name: string }` (2–80 chars) | 201 |
| PATCH | `/inventory/product-categories/:id` | `{ name?, isActive? }` (≥1 field) | |
| DELETE | `/inventory/product-categories/:id` | — | **409** while any product still references it — deactivate (`isActive: false`) instead |

### Products
| Method | Path | Body / Query |
|---|---|---|
| GET | `/inventory/products?categoryId&availability&isActive&q&page&pageSize` | own products, `Paginated<Product>` with `images[]`, `category` |
| POST | `/inventory/products` | `{ name: string, description?: string, price?: number\|null, categoryId?: uuid\|null, availability?: ProductAvailability, isActive?: boolean }` — `price` max 2 decimal places, non-negative; 201 |
| GET | `/inventory/products/:id` | own product with `images[]`, `category` |
| PATCH | `/inventory/products/:id` | any subset of the create fields (≥1) |
| DELETE | `/inventory/products/:id` | removes the product and its images (DB row + stored files) |
| PATCH | `/inventory/products/:id/availability` | `{ availability: ProductAvailability }` — quick toggle, separate from the general PATCH for a one-tap UI action |

### Product images
| Method | Path | Notes |
|---|---|---|
| POST | `/inventory/products/:id/images` | **multipart/form-data**, field name **`image`** (JPEG/PNG/WebP, max 8MB) — same content-sniffed pipeline as vendor photos (§5); a mismatched/corrupt file is `400`, never silently accepted or a `500` | 201 |
| DELETE | `/inventory/products/:id/images/:imageId` | |

`isActive: false` on a product (or its vendor not being `approved`) removes it from the public `/directory/business/:slug/products` listing (§6) immediately — there's no separate publish step.

---

## 10. Leads / CRM (`/leads`)

Roles: `vendor`, `employee`, `admin`, `super_admin`. **Ownership model:** a `vendor` caller only ever sees/acts on leads belonging to their own business (creating one as a vendor silently forces `vendorId` to your own, ignoring anything else sent); `employee`/`admin`/`super_admin` are CRM staff and can see/act on **any** lead. A lead outside your scope is always `404`, never `403` (doesn't confirm whether it exists).

Every directory enquiry (`POST /customer/enquiries`, §7) **automatically creates a Lead** with `source: "directory_search"` and `enquiryId` set — you don't create these manually, they just show up in `GET /leads`.

### Leads
| Method | Path | Role | Body / Query |
|---|---|---|---|
| GET | `/leads?stage&openOnly&source&priority&assignedTo&vendorId&dateFrom&dateTo&page&pageSize` | any | `vendorId` filter only has effect for staff — a vendor's results are always scoped to itself regardless of this param. `dateFrom`/`dateTo` are ISO datetimes, filtering on `createdAt`. See below for `stage`/`openOnly`. |
| POST | `/leads` | any | `{ vendorId?: uuid, name: string, phone: string, email?: string, source: LeadSource, priority?: Priority, assignedToId?: uuid }` — `vendorId` **required** for staff (400 if omitted), ignored/overridden for a vendor caller. 201. |
| GET | `/leads/:id` | any (ownership) | full `Lead` with `vendor`, `assignedTo`, `enquiry` |
| PATCH | `/leads/:id` | any (ownership) | `{ name?, phone?, email?, priority?, source? }` (≥1) — contact/priority/source only, **not** stage (use the dedicated endpoint below) |
| PATCH | `/leads/:id/stage` | any (ownership) | `{ stage: LeadStage }` — every call logs a `lead_stage_history` row (`fromStage` = the lead's stage *before* this call), even if you set the same stage it's already in |
| PATCH | `/leads/:id/assign` | any (ownership) | `{ assignedToId: uuid \| null }` — `null` unassigns; a non-existent/inactive user id → `400` |
| GET | `/leads/:id/history` | any (ownership) | array of `LeadStageHistory`, newest first |

> **`stage` accepts multiple values** — three equivalent formats, pick whichever your HTTP client sends naturally:
> - Single value: `?stage=new` (unchanged, still works)
> - Comma-separated: `?stage=new,contacted`
> - Repeated params: `?stage=new&stage=contacted`
>
> All three filter to the union of the given stages. Any invalid stage value in the set → `422`.
>
> **`openOnly=true`** is a convenience filter that excludes `won` and `lost` (every non-terminal stage) — use this for an "Open Leads" KPI instead of enumerating the other 5 stages yourself, so it doesn't silently under-count if a new terminal stage is ever added. Combinable with `stage` (both filters apply, intersected) though in practice you'd use one or the other.

### Lead notes — threaded, author-stamped
| Method | Path | Body |
|---|---|---|
| GET `/leads/:id/notes` | — | newest first, each with `author: { id, fullName, role }` |
| POST `/leads/:id/notes` | `{ note: string }` (1–2000 chars) | 201 |

### Follow-ups
⚠️ **Route ordering matters if you're proxying/mocking this**: `/leads/follow-ups/today` and `PATCH /leads/follow-ups/:followUpId` are literal paths distinct from `/leads/:id/...` — don't build a client-side router that treats everything after `/leads/` as a lead id.

| Method | Path | Role | Body |
|---|---|---|---|
| GET `/leads/:id/follow-ups` | any (ownership via the lead) | — | list for that lead, ordered by `dueAt` ascending |
| POST `/leads/:id/follow-ups` | any (ownership via the lead) | `{ dueAt: ISO datetime, assignedToId?: uuid, remark?: string }` — `assignedToId` defaults to **you** (the caller) if omitted | 201 |
| PATCH `/leads/follow-ups/:followUpId` | any (ownership via the lead) | `{ dueAt?, status?: FollowUpStatus, remark? }` (≥1) — this is how you mark done/missed or reschedule (change `dueAt`) |
| GET `/leads/follow-ups/today` | any | your own **pending** follow-ups due today or earlier — overdue items stay on this list until actioned, they don't silently disappear at midnight |

---

## 11. Calendar (`/calendar`)

Roles: `vendor`, `employee`, `admin`, `super_admin`. **Calendar has no table of its own** — every route here reads `Booking` + `FollowUp` + `Task` with a shared date window and returns them together. All dates are plain `"YYYY-MM-DD"` strings (both request query params and response fields).

**Ownership is asymmetric per feed** — this is deliberate, not inconsistent, because the underlying tables model ownership differently:
- **Bookings**: a `vendor` caller sees every booking on their own business. Staff (`employee`/`admin`/`super_admin`) see **every vendor's** bookings by default (no `vendorId` param = unscoped, same convention as `GET /leads`) — pass `vendorId` to narrow to one vendor.
- **Follow-ups**: always scoped to **you personally** (`assignedToId` = the caller), for every role, every route — `vendorId` has no effect on this feed. This matches `GET /leads/follow-ups/today`'s existing contract, which `GET /calendar/day` reuses directly when `date` is today (or omitted).
- **Tasks**: a `vendor` caller sees tasks tied to their own business (any assignee) OR personally assigned to them. Staff see their own personal task list by default (`assignedToId` = the caller, matching `GET /tasks/my`), or a specific vendor's full task board via `vendorId`.

| Method | Path | Query | Response `data` |
|---|---|---|---|
| GET | `/calendar/day?date&vendorId` | `date` optional (defaults to today, `"YYYY-MM-DD"`); `vendorId` staff-only, ignored for vendor callers | `{ date, bookings: Booking[], tasks: Task[], followUps: FollowUp[] }` |
| GET | `/calendar/week?start&vendorId` | `start` optional (defaults to today) — the 7-day window is `[start, start+6]` | `{ start, end, days: [{ date, bookings, tasks, followUps }, ...7] }` |
| GET | `/calendar/appointments?from&to&vendorId` | `from`/`to` **required**, `from <= to` or `422` | `Booking[]` — bookings only, for an appointment-only view with status-based coloring in the UI |
| GET | `/calendar/follow-ups?from&to&vendorId` | `from`/`to` **required** | `FollowUp[]` — follow-ups only, any status (not just `pending` like `/leads/follow-ups/today` — this is a calendar view, not the actionable inbox) |

`Booking` here is the same shape as `/bookings` (§8) — plain `bookingDate`/`startTime`/`endTime` strings. `Task`/`FollowUp` shapes are in §15.

---

## 12. Tasks (`/tasks`)

Roles: `vendor`, `employee`, `admin`, `super_admin`. **Ownership model:** a `vendor` caller sees/manages tasks tied to their own business (`vendorId`) OR personally assigned to them; CRM staff see/manage **any** task, optionally filtered by `vendorId`. A task outside your scope is always `404`, never `403`.

**Assignee authorization** (checked on create and on reassignment via `PATCH /:id`):
- If the task has a `vendorId`: the assignee must be CRM staff (`employee`/`admin`/`super_admin`) **or** that vendor's own account — same boundary as lead/follow-up/booking-staff assignment.
- If the task has **no** `vendorId` (an internal task with no business context): the assignee must be CRM staff — there's no "record's own vendor" to fall back on.
- Either way, a mismatched assignee → `400`, not `422` (it's a business-rule rejection, not a shape problem).

A `vendor` caller's own `vendorId` is always forced onto tasks it creates (any `vendorId` it sends is ignored), same pattern as a vendor's manual lead.

| Method | Path | Role | Body / Query |
|---|---|---|---|
| GET | `/tasks?status&priority&vendorId&page&pageSize` | any | staff-only `vendorId` filter; vendor callers are always scoped to their own business + personal assignments |
| POST | `/tasks` | any | `{ title: string, description?: string, assignedToId: uuid, vendorId?: uuid, leadId?: uuid, dueDate: "YYYY-MM-DD", priority?: Priority }` — `priority` defaults `medium`. 201. |
| GET | `/tasks/:id` | any (ownership) | full `Task` with `assignedTo`, `assignedBy`, `vendor`, `lead` relations |
| PATCH | `/tasks/:id` | any (ownership) | `{ title?, description?, assignedToId?, dueDate?, priority? }` (≥1) — contact fields only, **not** status (use the dedicated endpoint below); `vendorId` is fixed at creation, not editable |
| PATCH | `/tasks/:id/status` | any (ownership) | `{ status: TaskStatus }` — transitions are validated, not a free-form set: `pending → in_progress\|completed`, `in_progress → pending\|completed`, `overdue → in_progress\|completed`, `completed` is terminal (no further transitions). **`overdue` can never be set directly by a client** — it doesn't appear as a valid target from any starting status; only a scheduled job sets it. An invalid transition → `400`. |
| DELETE | `/tasks/:id` | any (ownership) | `{ deleted: true }` |
| GET | `/tasks/my?status&due&page&pageSize` | any | **always personal** (`assignedToId` = you), regardless of role — matches the plan doc's `GET /tasks/my` contract. `due` is an exact-date filter (`"YYYY-MM-DD"`), not a range. |

**Automatic deadline tracking** — two crons (every 15 min, no endpoint of their own — there's no `GET /notifications` read API yet, M2 Step 8):
- **Task overdue**: any `pending`/`in_progress` task whose `dueDate` has fully passed flips to `status: "overdue"` and sends an in-app + email notification to the assignee. One-way, cron-exclusive — see the `PATCH /:id/status` row above.
- **Follow-up reminder**: any `pending` `FollowUp` (see §10) whose `dueAt` has passed and hasn't been reminded about yet (`remindedAt` still `null`) gets an in-app + email nudge to its assignee, and `remindedAt` gets stamped. **This never changes the follow-up's `status`** — marking one `missed` stays a manual action (`PATCH /leads/follow-ups/:followUpId`), the cron only nudges.

---

## 13. Calls (`/calls`)

Roles: `vendor`, `employee`, `admin`, `super_admin`. **Manual entry only** — there's no telephony integration yet, the provider-signed auto-log webhook is M3. Ownership model is the same as Leads (§10): a `vendor` caller only ever sees/logs calls for its own business (creating one silently forces `vendorId` to your own, ignoring anything else sent); staff can see/log for **any** vendor, optionally filtered.

| Method | Path | Body / Query |
|---|---|---|
| GET | `/calls?vendorId&direction&status&leadId&customerId&dateFrom&dateTo&page&pageSize` | `vendorId` filter only has effect for staff. `dateFrom`/`dateTo` are ISO datetimes, filtering on `calledAt`. |
| POST | `/calls` | `{ vendorId?: uuid, customerId?: uuid, leadId?: uuid, phone: string, direction: CallDirection, status: CallStatus, durationSeconds?: number, calledAt: ISO datetime }` — `vendorId` **required** for staff (400 if omitted), ignored/overridden for a vendor caller. `leadId`, if sent, **must belong to the resolved vendor** — a cross-vendor `leadId` is `400`, same integrity rule as everywhere else a lead is referenced. 201. |

`loggedById` is always the caller — not client-suppliable.

---

## 14. Analytics (`/analytics/vendor`)

Roles: `vendor`, `employee`, `admin`, `super_admin`. **Unlike Leads/Calls, there is no "all vendors" view** — every route requires a specific vendor in scope: `vendorId` is forced to your own for a `vendor` caller, and **required** for staff (`400` if omitted). All four routes accept the same `vendorId` query param with that rule.

| Method | Path | Query | Response `data` |
|---|---|---|---|
| GET | `/analytics/vendor/summary` | `vendorId`, `from?`, `to?` (ISO datetimes) | `{ totalCalls, missedCalls, totalLeads, wonLeads, conversionRate, followUpsPending, followUpsOverdue }` |
| GET | `/analytics/vendor/monthly` | `vendorId`, `months?` (1–24, default 12) | Array of `{ month: "YYYY-MM", leads, bookings, won }`, oldest first, one entry per month including empty ones (zero-filled, never sparse) |
| GET | `/analytics/vendor/leads-by-source` | `vendorId`, `from?`, `to?` | Array of `{ source: LeadSource, count }` — all 5 sources always present (zero-filled), in a fixed order, not raw DB groupby order |
| GET | `/analytics/vendor/pipeline-funnel` | `vendorId`, `from?`, `to?` | Array of `{ stage: LeadStage, count }` — all 7 stages always present (zero-filled), in canonical funnel order (`new` → ... → `won`/`lost`) |

**`conversionRate`** — **not yet client-confirmed** (plan/10-client-questions.md #12). Implemented as `won ÷ total leads` (a percentage, one decimal place) — the conventional meaning across CRM tools (Salesforce/HubSpot/Pipedrive/Zoho). The other candidate formula, `won ÷ (won + lost)`, is what those same tools call **"win rate"**, a different metric — don't assume this endpoint returns that instead. If the client's answer differs, this is a one-line formula swap on the backend (a single named function), not a contract change — but until then, treat the exact number as provisional.

**`from`/`to`** apply to `totalCalls`/`missedCalls`/`totalLeads`/`wonLeads` (and the `leads-by-source`/`pipeline-funnel` breakdowns) — filtering `CallLog.calledAt` / `Lead.createdAt` respectively. **`followUpsPending`/`followUpsOverdue` are current-state counts, deliberately NOT affected by `from`/`to`** — "how much is on my plate right now," not a historical window. `wonLeads` is scoped to the same `createdAt` cohort as `totalLeads` (not a separate won-in-window count) — `conversionRate` reads as "of leads created in this window, what fraction eventually converted."

**`monthly`'s `won` count** is based on when each lead's stage history transitioned to `won` (the actual month it was won), not when the `Lead` row itself was created — the more accurate signal for a month-over-month trend chart.

---

## 15. Data Shapes Reference

Field names below are exact camelCase JSON keys as returned by the API (Prisma maps snake_case DB columns to camelCase automatically). Dates are ISO-8601 strings. Decimal/money fields come over the wire as **strings** (JS float precision) — parse with `Number()` only for display math, never for currency arithmetic.

### `PublicUser`
```ts
{
  id: string; role: Role; fullName: string; email: string; phone: string;
  avatarUrl: string | null; isActive: boolean; lastLoginAt: string | null;
  createdAt: string; updatedAt: string;
}
```

### `Vendor`
```ts
{
  id: string; userId: string; businessName: string; slug: string;
  categoryId: string; description: string | null;
  phone: string | null; email: string | null; website: string | null;
  addressLine: string | null; city: string | null; state: string | null; pincode: string | null;
  latitude: string | null; longitude: string | null;   // decimal-as-string
  onboardingStatus: OnboardingStatus; onboardingNotes: string | null;
  approvedById: string | null; approvedAt: string | null;
  avgRating: string; reviewCount: number;               // avgRating decimal-as-string

  // ── Vendor KYC profile v2 (plan/14-vendor-onboarding-v2.md) ──────────────
  // Business details (PATCH /vendors/me/business-details)
  businessEntityType: BusinessEntityType | null;
  logoUrl: string | null; coverBannerUrl: string | null;   // POST /vendors/me/logo, /cover-banner
  registrationYear: number | null; employeeCount: number | null;
  gstNumber: string | null; panNumber: string | null; cinLlpMsmeNumber: string | null;
  // Contact (PATCH /vendors/me/contact)
  whatsappNumber: string | null; landlineNumber: string | null;
  alternateContactNumber: string | null; customerCareNumber: string | null;
  socialLinks: { facebook?: string; instagram?: string; linkedin?: string; youtube?: string; twitter?: string } | null;
  // Address (PATCH /vendors/me/address) — addressLine above is auto-recomposed
  // from these on every save; don't try to compose it client-side.
  shopOfficeNumber: string | null; buildingName: string | null; street: string | null;
  area: string | null; landmark: string | null; district: string | null; country: string | null;
  // Location (PATCH /vendors/me/location) — serviceRadiusKm is stored only,
  // no radius-based search yet (that's an M3 "near me" feature)
  googleMapLink: string | null; serviceRadiusKm: number | null;
  // Timing (PATCH /vendors/me/timing) — in addition to the per-day PUT /vendors/me/hours
  is24x7: boolean; hasEmergencyService: boolean;
  // Catalogue summary (PATCH /vendors/me/catalogue-summary) — vendor-level
  // summary, distinct from per-product price/availability (Inventory module).
  // seoKeywords feeds the public search full-text index (weighted like description).
  priceRangeMin: string | null; priceRangeMax: string | null;   // decimal-as-string
  minOrderValue: string | null; maxOrderValue: string | null;   // decimal-as-string
  brandsAvailable: string[]; seoKeywords: string[];
  gstInvoiceAvailable: boolean;
  // Internal/CRM — admin/employee-set (§5); referralCode is vendor-set but
  // registration-only for now.
  referralCode: string | null;
  assignedSalesExecutiveId: string | null;  // PATCH /vendors/:id/assign-sales-executive
  source: VendorSource | null;              // PATCH /vendors/:id/source
  kycStatus: KycStatus;                     // DERIVED — see the note under §5's admin table; not directly settable by anyone
  // ───────────────────────────────────────────────────────────────────────

  createdAt: string; updatedAt: string;
  // present when fetched with relations (public business detail, vendor /me, admin get-by-id):
  category?: BusinessCategory; hours?: BusinessHour[];
  photos?: VendorPhoto[]; catalogues?: VendorCatalogue[]; documents?: VendorDocument[];
  // admin GET /vendors/:id only:
  profileCompletion?: ProfileCompletion;
}
```
> ⚠️ Every field in the "Vendor KYC profile v2" block above already comes back
> on every `Vendor` response (nothing is hidden). As of Prompt 6, every field
> in this block now has a write endpoint **except** `kycStatus` (derived —
> never write it directly).

### `ProfileCompletion`
```ts
{
  percentage: number;   // 0-100, rounded, across ALL sections combined
  sections: {
    // each section: how many of its tracked fields are filled, and that ratio as %
    business: { filled: number; total: number; percentage: number };
    contact: { filled: number; total: number; percentage: number };
    address: { filled: number; total: number; percentage: number };
    timing: { filled: number; total: number; percentage: number };
    catalogueSummary: { filled: number; total: number; percentage: number };
    documents: { filled: number; total: number; percentage: number };
    media: { filled: number; total: number; percentage: number };
  };
}
```
Returned by `GET /vendors/me/profile-completion` (vendor) and inline as `profileCompletion` on `GET /vendors/:id` (admin/employee) — same shape, same numbers. **This is a progress indicator for a "complete your profile" checklist UI, not an approval gate** — nothing about onboarding-status transitions depends on it. Computed at read time from the current row, not stored, so it's always current. The specific fields counted as "required" per section are a reasonable starting rubric (no client-confirmed spec exists yet for exactly which fields are mandatory) — see the `computeProfileCompletion` comment in `vendors.service.ts` if you need the exact field list per section.

### `BusinessCategory`
```ts
{ id: string; name: string; slug: string; iconUrl: string | null; isActive: boolean; createdAt: string; updatedAt: string; }
```

### `BusinessHour`
```ts
{ id: string; vendorId: string; dayOfWeek: number; opensAt: string | null; closesAt: string | null; isClosed: boolean; }
// dayOfWeek: 0=Sunday .. 6=Saturday. opensAt/closesAt are "HH:mm:ss" time strings.
```

### `VendorPhoto`
```ts
{ id: string; vendorId: string; imageUrl: string; caption: string | null; sortOrder: number; createdAt: string; updatedAt: string; }
```

### `VendorCatalogue`
```ts
{ id: string; vendorId: string; fileUrl: string; fileName: string; fileType: string; kind: 'catalogue' | 'brochure'; createdAt: string; updatedAt: string; }
```

### `VendorOnboardingHistory`
```ts
{ id: string; vendorId: string; fromStatus: OnboardingStatus | null; toStatus: OnboardingStatus; changedById: string; note: string | null; createdAt: string; }
```

### `VendorDocument`
```ts
{
  id: string; vendorId: string;
  type: 'gst_certificate' | 'pan_card' | 'aadhaar' | 'shop_act_license' | 'msme_certificate' | 'fssai' | 'drug_license' | 'trade_license' | 'iso_certificate' | 'other';
  fileUrl: string;   // ⚠️ an internal storage KEY, not a URL — see the security note in §5. Fetch content via GET .../documents/:id/file only.
  fileName: string;
  status: 'pending' | 'verified' | 'rejected';
  reviewedById: string | null; reviewedAt: string | null; note: string | null;
  createdAt: string; updatedAt: string;
}
```

### `Enquiry`
```ts
{ id: string; vendorId: string; customerId: string | null; name: string; phone: string; message: string | null; status: EnquiryStatus; createdAt: string; updatedAt: string; }
```

### `Favourite`
```ts
{ id: string; customerId: string; vendorId: string; createdAt: string; }
```

### `BusinessReport`
```ts
{ id: string; vendorId: string; customerId: string; reason: ReportReason; details: string | null; status: ReportStatus; handledById: string | null; createdAt: string; }
```

### `Review` (as returned by moderate/upsert — full row)
```ts
{ id: string; vendorId: string; customerId: string; rating: number; comment: string | null; isHidden: boolean; createdAt: string; updatedAt: string; }
```
On `GET /customer/reviews` each row also has `vendor: { id: string; slug: string; businessName: string }`.

### `Booking`
```ts
{
  id: string; vendorId: string; customerId: string; staffId: string | null;
  bookingDate: string; startTime: string; endTime: string;
  status: BookingStatus; notes: string | null;
  rescheduledFromId: string | null; reminderSentAt: string | null;
  createdAt: string; updatedAt: string;
  // present on GET /bookings/requests only:
  customer?: { id: string; user: { fullName: string; phone: string } };
  staff?: { id: string; fullName: string } | null;
}
```
> **`bookingDate`/`startTime`/`endTime` are plain, timezone-free strings** — `bookingDate: "2026-08-04"`, `startTime: "14:00"`, `endTime: "15:00"` — **not** ISO datetime instants, on every response that returns a `Booking` (create, list, cancel, requests inbox, status update, reschedule, staff assignment). Don't run these through a `Date`/timezone formatter; treat them as the wall-clock values they are — that conversion already happened server-side. Same guarantee applies to `Booking`'s `bookingDate`/`startTime`/`endTime` inside `GET /bookings/availability`'s response (see below), which returns `startTime`/`endTime` the same way despite not being a raw `Booking`.

### `BookingSlot`
```ts
{ id: string; vendorId: string; dayOfWeek: number; startTime: string; endTime: string; capacity: number; isActive: boolean; createdAt: string; updatedAt: string; }
```
`startTime`/`endTime` are plain `"HH:mm"` strings, same guarantee as `Booking` above.

### `ProductCategory`
```ts
{ id: string; vendorId: string; name: string; isActive: boolean; createdAt: string; updatedAt: string; }
```

### `Product`
```ts
{
  id: string; vendorId: string; categoryId: string | null;
  name: string; description: string | null;
  price: string | null;                      // decimal-as-string, e.g. "279.00"
  availability: ProductAvailability; isActive: boolean;
  createdAt: string; updatedAt: string;
  // present when fetched with relations (all /inventory/products responses, public products list):
  images?: ProductImage[]; category?: ProductCategory | null;
}
```

### `ProductImage`
```ts
{ id: string; productId: string; imageUrl: string; sortOrder: number; createdAt: string; updatedAt: string; }
```

### `Lead`
```ts
{
  id: string; vendorId: string; customerId: string | null;
  name: string; phone: string; email: string | null;
  stage: LeadStage; source: LeadSource; priority: Priority;
  assignedToId: string | null; enquiryId: string | null;
  createdAt: string; updatedAt: string;
  // present on GET /leads and GET /leads/:id:
  vendor?: { id: string; slug: string; businessName: string };
  assignedTo?: { id: string; fullName: string; role: Role } | null;
  // present only on GET /leads/:id:
  enquiry?: Enquiry | null;
}
```

### `LeadStageHistory`
```ts
{ id: string; leadId: string; fromStage: LeadStage | null; toStage: LeadStage; changedById: string; createdAt: string; changedBy: { id: string; fullName: string; role: Role }; }
```

### `LeadNote`
```ts
{ id: string; leadId: string; authorId: string; note: string; createdAt: string; updatedAt: string; author: { id: string; fullName: string; role: Role }; }
```

### `FollowUp`
```ts
{
  id: string; leadId: string; assignedToId: string;
  dueAt: string; status: FollowUpStatus; remark: string | null; remindedAt: string | null;
  createdAt: string; updatedAt: string;
  // present on GET /leads/follow-ups/today and every /calendar/* route:
  lead?: { id: string; name: string; phone: string; vendorId: string };
}
```

### `Task`
```ts
{
  id: string; title: string; description: string | null;
  assignedToId: string; assignedById: string;
  vendorId: string | null; leadId: string | null;
  dueDate: string;                       // "YYYY-MM-DD"
  priority: Priority; status: TaskStatus;
  createdAt: string; updatedAt: string;
  // present on GET /tasks, GET /tasks/:id, GET /tasks/my, and every /calendar/* route:
  assignedTo?: { id: string; fullName: string; role?: Role };
  // present only on GET /tasks/:id:
  assignedBy?: { id: string; fullName: string; role: Role };
  lead?: { id: string; name: string } | null;
  // present on GET /tasks, GET /tasks/my, /calendar/*:
  vendor?: { id: string; slug: string; businessName: string } | null;
}
```

### `CallLog`
```ts
{
  id: string; vendorId: string; customerId: string | null; leadId: string | null;
  phone: string; direction: CallDirection; status: CallStatus;
  durationSeconds: number | null; loggedById: string | null;
  calledAt: string; createdAt: string; updatedAt: string;
  // present on GET /calls:
  lead?: { id: string; name: string } | null;
  loggedBy?: { id: string; fullName: string; role: Role } | null;
}
```

---

## 16. Enums — exact string values

Import these from `packages/shared` if your codebase can reference the monorepo package directly; otherwise hardcode exactly as below (they are the Postgres enum values — case-sensitive, snake_case).

```ts
Role = 'super_admin' | 'admin' | 'employee' | 'vendor' | 'customer' | 'accounts' | 'support'
OnboardingStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended'
ReportReason = 'fake' | 'offensive' | 'closed' | 'wrong_info' | 'other'
ReportStatus = 'open' | 'reviewed' | 'actioned' | 'dismissed'
EnquiryStatus = 'new' | 'responded' | 'closed'
ProductAvailability = 'in_stock' | 'out_of_stock' | 'discontinued'
BookingStatus = 'requested' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled' | 'no_show'
LeadStage = 'new' | 'follow_up_pending' | 'interested' | 'quotation_sent' | 'negotiation' | 'won' | 'lost'
LeadSource = 'google' | 'facebook' | 'whatsapp' | 'referral' | 'directory_search'
Priority = 'low' | 'medium' | 'high'
FollowUpStatus = 'pending' | 'done' | 'missed'
TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'  // 'overdue' is cron-set only, never sent by a client
CallDirection = 'inbound' | 'outbound'
CallStatus = 'answered' | 'missed'
```
(Additional enums — accounts, tickets — exist in the schema for future milestones but have no live endpoints yet; ignore until later in M2.)

---

## 17. Test accounts (local/staging seed data)

Every seeded account uses the same password: **`Password123!`**

| Email | Role | Notes |
|---|---|---|
| `superadmin@hindustandirectory.test` | `super_admin` | full access |
| `admin@hindustandirectory.test` | `admin` | |
| `employee@hindustandirectory.test` | `employee` | has an `EmployeeRecord` (designation "CRM Executive") — accounts module endpoints don't exist yet (#26), this just gives the login a real record to point at once they do |
| `vendor@hindustandirectory.test` | `vendor` | business: "Spice Junction" (contact `contact@spicejunction.test`) |
| `customer@hindustandirectory.test` | `customer` | |
| `accounts@hindustandirectory.test` | `accounts` | no accounts module endpoints yet (#26) — login only |
| `support@hindustandirectory.test` | `support` | no support module endpoints yet (#26) — login only |

The demo vendor (Spice Junction) also gets non-empty demo data so every panel has something to render on a fresh seed: 7 leads spread across all 7 stages, 2 follow-ups (one overdue, one upcoming — exercises `GET /leads/follow-ups/today`), a 12-slot weekly booking-slot template (Mon–Sat, lunch + dinner, closed Sunday), 5 bookings (upcoming/confirmed, completed, requested, staff-assigned, cancelled), and 5 enquiries (mixed `new`/`responded`).

Re-seed anytime with `npm run seed` from the repo root. **The seed is upsert-based, not destructive** — it does not wipe existing data; re-running it is safe and just ensures the seeded rows exist/are current. Still, don't run it against a shared staging DB others are actively testing on without checking first, since it will create the demo accounts/data there too if they're missing.

---

## 18. Known gaps / things NOT to build against yet

- **No customer 360°, accounts, support** — remaining M2 steps. (Calendar and Tasks shipped in M2 Step 3 — see §11/§12. Calls and Analytics shipped in M2 Step 4 — see §13/§14.)
- **No `/notifications` read API** (`notifications` table exists and the booking-reminder + task-overdue + missed-follow-up crons write to it, but there's no `GET /notifications`, mark-read, or bell-icon-backing endpoint yet) — M2 Step 8.
- **No push notifications / mobile-specific endpoints** — M3.
- **File URLs**: in local dev, `imageUrl`/`fileUrl` are served from this same API host under `/uploads/...` (relative to `PUBLIC_BASE_URL`, not `/api/v1`). In production these become full S3-compatible URLs — treat every `*Url` field as an already-absolute URL you can put straight into an `<img src>` / image loader, don't assume the host.

---

## 19. Questions / contract changes

This file is the contract. If something you need isn't here or doesn't match reality, **don't guess the shape** — flag it in the shared channel and get the OpenAPI/this doc updated first (see `plan/09-team-workflow.md` §1, contract-first development). This file will be re-generated/extended after each backend PR that adds or changes endpoints.
