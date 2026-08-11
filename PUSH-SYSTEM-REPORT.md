# NOOD Push Notification System — Upgrade Report

Date: 2026-08-11
Scope: `nood-app/` (Expo SDK 54 frontend) + `nood-backend/` (Express backend). End-to-end production-grade push system.

---

## 1. Every file changed

### Backend (`nood-backend/`)

| File | Change |
|---|---|
| `utils/push-config.js` | **NEW** — centralized frequency/anti-spam config (env-driven) |
| `utils/push-state-db.js` | **NEW** — campaign events + frequency counters + cart-nudge cooldown persistence (Supabase + JSON fallback) |
| `utils/push-delivery.js` | **NEW** — single centralized Expo push delivery service (chunking, tickets, receipts, deactivation, idempotency) |
| `utils/admin-auth.js` | **NEW** — admin token auth middleware for protected endpoints |
| `utils/push-tokens-db.js` | MODIFIED — added `email`, `is_active`, `last_seen_at`; `deactivateToken()`; JSON fallback respects active flag |
| `utils/inventory.js` | MODIFIED — real `detectNewProducts()` (select-existing → insert-only-new) |
| `jobs/inventory-sync.js` | MODIFIED — fires new-product campaign AFTER products are saved/indexed |
| `jobs/notification-campaigns.js` | REWRITTEN — full campaign engine (all 9 types), cart nudge from real `carts` table |
| `jobs/new-product-campaign.js` | **DELETED** — duplicated direct-Expo job, superseded by inventory-sync integration |
| `routes/notifications.js` | REWRITTEN — register-token (idempotent + email), admin-gated `/send`, `/campaign`, `/deactivate-token` |
| `routes/webhooks.js` | MODIFIED — transactional `order-update` push on fulfillment webhook |
| `server.js` | MODIFIED — mounts campaign engine; removes old duplicate job |
| `supabase-setup.sql` | MODIFIED — new tables/columns (see §4) |
| `.env.example` | MODIFIED — new env vars documented |
| `package.json` | MODIFIED — `npm test` runs push test suite |
| `.gitignore` | MODIFIED — ignores runtime push state JSON files |
| `public-push-sender.html` | MODIFIED — admin page sends `x-admin-token`, added token field |
| `tests/push.test.js` | **NEW** — 12 automated tests |

### Frontend (`nood-app/`)

| File | Change |
|---|---|
| `components/NotificationListener.tsx` | REWRITTEN — cold-start tap handling via `getLastNotificationResponseAsync()`, dedupe against live listener, SDK 54 named imports |
| `utils/notification-handling.ts` | MODIFIED — route validation (`isValidNotificationRoute`), removed broken `import { Notifications }` |
| `utils/push-notifications.ts` | MODIFIED — fixed `.default` bug in `presentLocalNotification`, registration sends `email` |
| `context/UpdatesContext.tsx` | MODIFIED — removed wrong `deviceId: profileId` on registration |
| `app/account/orders.tsx` | MODIFIED — opens specific order from `orderId` deep-link param |
| `context/CartContext.tsx` | MODIFIED — fixed pre-existing TS errors so `tsc --noEmit` is zero (see §2) |

---

## 2. What was wrong

1. **Unauthenticated broadcast endpoints.** `POST /api/notifications/send` and `/campaign` had no auth — anyone could blast every device.
2. **Three separate direct-Expo call sites** (`routes/notifications.js`, `jobs/notification-campaigns.js`, `jobs/new-product-campaign.js`). No chunking, no ticket logging, no receipts, no stats.
3. **New-product job was disconnected** — it read `push-tokens.json` directly, queried Shopify Storefront separately, sent only the 1st product (no batching), and its state file logic could re-notify after a deploy.
4. **`inventory-sync.js` never INSERTED products** — it only `update()`d, so the `products` table could be empty and there was no reliable new-product detection. `syncCatalog()` was a no-op.
5. **Cart-nudge campaign read `cart-users.json`** which never existed — dead code.
6. **Frontend `NotificationListener` had no cold-start handling** — tapping a notification while the app was terminated did nothing.
7. **`utils/notification-handling.ts` had `import { Notifications } from 'expo-notifications'`** — SDK 54 exports named functions, not a `Notifications` object → TS error.
8. **`presentLocalNotification` used `notifications.default.scheduleNotificationAsync`** — there is no `.default` in SDK 54 → local notifications silently failed.
9. **Blind route navigation** — `route` payload was trusted; an unsafe/external URL could be navigated to.
10. **Pre-existing TS errors in `CartContext.tsx`** — `consumeActiveCoupon` used-before-declared (TDZ), and a circular `checkoutTotals` ↔ `activeCouponDiscount` dependency made `tsc` fail the whole project.

---

## 3. What was changed

- **Centralized delivery service** (`push-delivery.js`): validates tokens, chunks at 100/request, logs ticket IDs, processes receipts, deactivates `DeviceNotRegistered` tokens, dedupes by `campaignId`/`dedupeKey`, enforces quiet hours + per-device promo caps, reports `sent/failed/skipped`. One bad token never breaks a batch.
- **Persistent token store**: tokens already persisted to Supabase `push_tokens` (JSON fallback) — extended with `email`, `is_active`, `last_seen_at`. Registration is idempotent (`onConflict: token`). `DeviceNotRegistered` deactivates rather than deletes.
- **New-product pipeline**: `inventory-sync` → `detectNewProducts()` inserts genuinely-new products (existing IDs looked up first) → `sendNewProductCampaign()` fires **after** the product row exists and can be opened. Batch threshold: ≥3 new products in one sync → one "🔥 N new styles just dropped" push to New Arrivals; otherwise one push per product, deduped per handle.
- **Campaign engine** with all 9 types; `order-update` is transactional (never frequency-limited). Scheduled daily-reward + flash-live use env-configured hours. Cart nudges query the real `carts` table with a persisted cooldown and skip carts that already got a recovery email/discount.
- **Admin auth**: `NOOD_ADMIN_TOKEN` via `x-admin-token` header. Unset → endpoints fail closed (503). No unauthenticated broadcast.
- **Frontend**: cold-start + live-tap dedupe, safe route validation, SDK 54 fixes, orderId deep link.
- **Minimal fixes** to pre-existing `CartContext` TS errors (nothing else in that file was touched).

---

## 4. Database schema / migration

Run `supabase-setup.sql` in the Supabase SQL editor (it's idempotent).

New/changed:

```sql
-- push_tokens: added
  email text,
  is_active boolean not null default true,
  last_seen_at timestamptz,

-- NEW: campaign events (dedupe + delivery stats)
create table if not exists push_campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id text unique not null,
  campaign_type text not null default 'general',
  dedupe_key text unique,
  title text, body text,
  payload jsonb default '{}',
  status text not null default 'created',
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  skipped_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- NEW: per-token daily promo frequency
create table if not exists push_frequency (
  token text not null,
  day text not null,
  promo_count integer not null default 0,
  last_promo_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (token, day)
);

-- NEW: cart nudge cooldown
create table if not exists push_cart_nudges (
  cart_key text primary key,
  last_nudge_at timestamptz,
  updated_at timestamptz not null default now()
);

-- products: added
  created_at timestamptz not null default now(),
  notified_at timestamptz,
```

Note: `notified_at` is reserved for future product-level dedupe-window enforcement; current dedupe uses `push_campaign_events.dedupe_key`.

---

## 5. New environment variables

All optional (sane defaults), documented in `nood-backend/.env.example`:

| Variable | Default | Purpose |
|---|---|---|
| `NOOD_ADMIN_TOKEN` | (none — REQUIRED for admin endpoints) | Admin auth for broadcast endpoints |
| `PUSH_MIN_INTERVAL_MINUTES` | 60 | Min minutes between promotional pushes per device |
| `PUSH_MAX_PROMO_PER_DAY` | 3 | Max promotional pushes per device per day |
| `PUSH_QUIET_HOURS_ENABLED` | true | Enable quiet hours |
| `PUSH_QUIET_HOURS_START` | 22 | Quiet hours start (server local, 0-23) |
| `PUSH_QUIET_HOURS_END` | 8 | Quiet hours end |
| `PUSH_CAMPAIGN_INTERVAL_MINUTES` | 15 | Campaign engine tick |
| `PUSH_NEW_PRODUCT_BATCH_THRESHOLD` | 3 | ≥N new products → single batch push |
| `PUSH_CART_NUDGE_COOLDOWN_HOURS` | 48 | Cart nudge cooldown |
| `PUSH_CART_NUDGE_MIN_AGE_MINUTES` | 60 | Cart must be this old before nudging |
| `PUSH_REWARD_REMINDER_HOUR` | 18 | Daily-reward push hour |
| `PUSH_FLASH_WINDOW_START` / `_END` | 6 / 10 | Flash-live push window |

Test-only: `PUSH_TOKENS_FILE`, `PUSH_CAMPAIGN_STATE_FILE`, `PUSH_FREQUENCY_STATE_FILE` (used by tests; optional).

---

## 6. New / changed endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/notifications/register-token` | none (app) | Idempotent token registration; accepts `email` |
| `GET /api/notifications/devices` | none (safe summary) | List devices (no full tokens) |
| `POST /api/notifications/send` | **ADMIN** | Manual broadcast: `{title, body, type, route, productHandle, campaign, targetUserId?, token?}` |
| `POST /api/notifications/campaign` | **ADMIN** | Named campaign send: `{campaign, title?, body?, data?, targetUserId?, productHandle?}` |
| `POST /api/notifications/deactivate-token` | **ADMIN** | Deactivate a token by suffix |
| `POST /webhooks/fulfillments/update` | Shopify HMAC | Now also sends transactional `order-update` push |

---

## 7. How automatic new-product notifications work

1. `jobs/inventory-sync.js` fetches the full active product list from Shopify Admin every 30 min (+ on startup).
2. `detectNewProducts()` looks up which `shopify_product_id`s already exist in `products`, then **inserts only the new ones**. (This also fixes the table never being populated.)
3. Only after the insert succeeds does `sendNewProductCampaign()` run — so the product is saved/indexed and openable in the app before any push fires.
4. If ≥ `PUSH_NEW_PRODUCT_BATCH_THRESHOLD` (default 3) new products are found in one sync → ONE push: "🔥 N new styles just dropped — See what's new on NOOD", deep-linking to New Arrivals (`/collection/new-arrivals`).
5. Otherwise → one push per product (e.g. "👟 Fresh on NOOD — Air Max Plus is now available."), deep-linking to `/product/<handle>`.
6. Duplicate protection: campaign dedupe keys (`product_<handle>` per product, `batch_<date>_<handles>` for batches) mean repeated syncs never re-fire.

---

## 8. How manual broadcasts work

1. Set `NOOD_ADMIN_TOKEN` in the backend env.
2. Call (or use the `/push` admin page):
   ```
   curl -X POST https://nood-backend.onrender.com/api/notifications/send \
     -H 'Content-Type: application/json' \
     -H 'x-admin-token: <NOOD_ADMIN_TOKEN>' \
     -d '{"title":"🔥 Weekend sale","body":"Up to 50% off","type":"broadcast","route":"/(tabs)/deals"}'
   ```
3. Optional targeting fields: `targetUserId` (per-user), `token` (single test device), `productHandle` (product deep link), `campaign` (dedupe id).
4. The send goes through the delivery service (frequency caps + quiet hours apply to promotional types; admin can always see `sent/failed/skipped`).

---

## 9. How notification frequency is controlled

- **Per-device daily cap**: `PUSH_MAX_PROMO_PER_DAY` (default 3) — counted in `push_frequency` (per token per UTC day).
- **Per-device minimum interval**: `PUSH_MIN_INTERVAL_MINUTES` (default 60) between promotional pushes.
- **Quiet hours**: `PUSH_QUIET_HOURS_START`/`_END` (default 22→8 server local) — promotional pushes skipped entirely.
- **Transactional exemption**: `order-update` never goes through promo caps/quiet hours.
- **Duplicate campaign protection**: `push_campaign_events.campaign_id` (unique) + `dedupe_key` (unique) — retries and repeated jobs are no-ops.
- **Duplicate product protection**: per-product dedupe keys prevent re-promoting the same product.
- **Cart nudge cooldown**: `PUSH_CART_NUDGE_COOLDOWN_HOURS` (default 48) persisted in `push_cart_nudges`.
- All thresholds live in `utils/push-config.js` — **no hardcoded business thresholds scattered around.**

---

## 10. How to test on your real Android phone

1. Build a dev client with push credentials:
   ```
   cd nood-app
   npx eas build --platform android --profile development
   ```
   (EAS project id `36b5f555-a445-4e13-943b-47899596b01d` is already configured in `app.json`.)
2. Install and open the app, enable notifications when prompted, and sign in.
3. Confirm registration in backend logs: `[PUSH] Registered token | suffix: ...<last12> | userId: ...`
   or hit `GET https://nood-backend.onrender.com/api/notifications/devices`.
4. Send a manual test push:
   ```
   curl -X POST https://nood-backend.onrender.com/api/notifications/send \
     -H 'Content-Type: application/json' -H 'x-admin-token: <TOKEN>' \
     -d '{"title":"🔥 Test","body":"Hello from NOOD","type":"broadcast"}'
   ```
5. Tap the notification in foreground / background / terminated states and confirm it routes correctly.
6. In Expo Go push will NOT work (Expo Go limitation) — you must use a development build or production APK.

---

## 11. Exact commands to run locally

```bash
# Backend
cd nood-backend
npm install
node server.js                 # or: npm start
npm test                       # 12 push tests

# Frontend typecheck + lint
cd nood-app
npx tsc --noEmit --skipLibCheck -p tsconfig.json   # must be 0 errors
npx expo lint                   # or: npx eslint <changed files>

# Local dev build on device
npx eas build --platform android --profile development
```

---

## 12. Render environment variables / configuration to add

In the Render dashboard → your backend service → **Environment**:

| Key | Value |
|---|---|
| `NOOD_ADMIN_TOKEN` | a long random string (≥16 chars), e.g. `openssl rand -hex 32` |
| `PUSH_MIN_INTERVAL_MINUTES` | `60` (optional) |
| `PUSH_MAX_PROMO_PER_DAY` | `3` (optional) |
| `PUSH_QUIET_HOURS_ENABLED` | `true` (optional) |
| `PUSH_QUIET_HOURS_START` | `22` (optional) |
| `PUSH_QUIET_HOURS_END` | `8` (optional) |
| `PUSH_NEW_PRODUCT_BATCH_THRESHOLD` | `3` (optional) |
| `PUSH_CART_NUDGE_COOLDOWN_HOURS` | `48` (optional) |
| `PUSH_REWARD_REMINDER_HOUR` | `18` (optional) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | set these if not already |

Also run `supabase-setup.sql` once in Supabase SQL Editor (adds `push_campaign_events`, `push_frequency`, `push_cart_nudges`, and new columns).

---

## 13. Remaining blockers / notes

- **No real physical-device delivery was tested** — the automated tests mock Expo's push endpoint. You must test on a real Android device (§10) to confirm actual delivery.
- The backend `.env` still has placeholder `WIPAY_ACCOUNT_NUMBER` / `SHOPIFY_ADMIN_ACCESS_TOKEN` (pre-existing, unrelated to push).
- `notified_at` column is reserved but not yet used — current product dedupe is via campaign `dedupe_key`; wiring `notified_at` into a product-level dedupe window is a future enhancement.
- **Personalization** (viewed/search/wishlist/purchased-brand targeting) is architecturally ready — the delivery service accepts arbitrary recipient filters — but NOOD does not yet store the behavioral signals server-side. To enable real personalization you'll need to persist: viewed products, search terms, wishlist, cart, purchased products, preferred brands, categories, price range, recently-viewed (currently only in local AsyncStorage). The existing `recommendation-signals.ts` on-device data could be uploaded via a new endpoint when you're ready.
- Git note (pre-existing): both repos have stale `.git/index.lock` / `.git/HEAD.lock` on the host machine — remove them before committing if you hit lock errors.
