# NOOD Unified Notification System — Final Report

Date: 2026-08-11
Scope: `nood-app/` (Expo SDK 54) + `nood-backend/` (Express). One unified notification platform: every push → NOOD Inbox item → read state → deep link.

---

## 1. Every file changed

### Backend (`nood-backend/`)

| File | Change |
|---|---|
| `utils/inbox-db.js` | **NEW** — Supabase `notification_inbox` + `notification_inbox_reads` persistence with JSON fallback. Idempotent by `campaign_id`. Broadcast vs user rows. Read state. |
| `utils/preferences-db.js` | **NEW** — server-side per-category notification preferences (`notification_preferences`). Security/orders/tracking/returns/support always allowed. |
| `utils/tracking.js` | **NEW** — normalized tracking status mapper (`confirmed`…`returned`), persistence in `order_tracking`, change-detection (dedupe on `last_notified_status`), triggers inbox + transactional push on real changes only. |
| `utils/push-delivery.js` | MODIFIED — every send now creates an inbox item BEFORE delivery (exists even if Expo fails); preference suppression; per-user frequency (`userId` passed to `checkAndIncrementFrequency`). |
| `utils/push-config.js` | MODIFIED — full notification taxonomy (~90 types → category), priority classes (CRITICAL > TRANSACTIONAL_HIGH > PERSONAL_HIGH > PROMOTIONAL > LOW), `categoryForType()`, `priorityClassForType()`. |
| `utils/push-state-db.js` | MODIFIED — `push_frequency` now supports `user_id` (per-user caps). |
| `jobs/inventory-sync.js` | MODIFIED — **Shopify 402 fix**: Admin API → Storefront GraphQL fallback so new-product detection works on all plans. |
| `routes/notifications.js` | MODIFIED — inbox endpoints (`GET /inbox`, `GET /inbox/unread-count`, `POST /inbox/:id/read`, `POST /inbox/read-all`) + preferences endpoints. |
| `routes/tracking.js` | **NEW** — `GET /api/tracking/:orderId`, `GET /api/tracking?userId=`. |
| `routes/webhooks.js` | MODIFIED — fulfillment webhook now normalizes status, persists `order_tracking`, fires transactional inbox+push on change only (deduped). |
| `server.js` | MODIFIED — mounts tracking router. |
| `supabase-setup.sql` | MODIFIED — new tables/columns (see §2). |
| `.env.example` | MODIFIED — documents `SHOPIFY_STOREFRONT_TOKEN` fallback + new push envs. |
| `.gitignore` | MODIFIED — ignores inbox/preferences JSON state files. |
| `tests/push.test.js` | MODIFIED — **20 tests** (see §9). |

### Frontend (`nood-app/`)

| File | Change |
|---|---|
| `utils/inbox.ts` | **NEW** — inbox client: fetch/list/mark-read/mark-all/unread-count with AsyncStorage offline cache, type→icon/color meta, relative time, shared routing (`inboxToNavigation`). |
| `app/account/tracking.tsx` | **NEW** — branded animated Order Tracking screen (see §7). |
| `app/account/updates.tsx` | MODIFIED — full inbox screen now renders real backend items (icon/color per type, relative time, unread dot, mark all read). |
| `context/UpdatesContext.tsx` | REWRITTEN — loads real inbox from backend with offline cache; `refreshInbox`, real `unreadCount`, `openUpdate` routes via shared `inboxToNavigation`. |
| `app/(tabs)/index.tsx` | MODIFIED — Home NOOD Inbox slide shows real notifications (latest 4), real unread count instead of static "6 new", "View all" action, tapping routes via shared logic. |
| `app/(tabs)/home-styles.ts` | MODIFIED — added `heroUpdateViewAll` styles. |
| `utils/notification-handling.ts` | MODIFIED — full taxonomy routing (product/cart/tracking/returns/deals/games/rewards/support/security), safe route validation. |

---

## 2. SQL migration

Run `supabase-setup.sql` in the Supabase SQL editor (idempotent). New:

```sql
-- push_frequency: add user_id for per-user caps
alter table push_frequency add column if not exists user_id text;

-- NOOD Inbox (user_id NULL = broadcast; campaign_id UNIQUE = no dupes)
create table if not exists notification_inbox (
  id uuid primary key default gen_random_uuid(),
  user_id text, device_id text,
  campaign_id text unique not null,
  dedupe_key text unique,
  type text not null default 'general',
  category text, priority integer,
  title text not null default 'NOOD',
  body text not null default '',
  route text, product_handle text, order_id text,
  data jsonb default '{}',
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create index if not exists notification_inbox_created_at_idx on notification_inbox (created_at desc);
create index if not exists notification_inbox_user_id_idx on notification_inbox (user_id);

-- Read state
create table if not exists notification_inbox_reads (
  user_id text not null,
  notification_id uuid not null references notification_inbox (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

-- Preferences
create table if not exists notification_preferences (
  user_id text not null,
  category text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

-- Order tracking (normalized)
create table if not exists order_tracking (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id text unique not null,
  order_name text, email text, user_id text,
  carrier text, tracking_number text, tracking_url text,
  status text not null default 'confirmed',
  friendly_status text,
  latest_event_title text, latest_event_description text,
  latest_event_location text, latest_event_at timestamptz,
  estimated_delivery timestamptz,
  last_notified_status text,
  tracking_history jsonb default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

All tables get `enable row level security` + service-role-only policy (backend uses service key).

---

## 3. Every endpoint added/changed

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/notifications/inbox?userId=\|deviceId=&limit=` | app | Latest notifications (broadcast + own), newest first, with `read` |
| `GET /api/notifications/inbox/unread-count` | app | Unread count |
| `POST /api/notifications/inbox/:id/read` | app | Mark one read |
| `POST /api/notifications/inbox/read-all` | app | Mark all read |
| `GET /api/notifications/preferences?userId=` | app | Load category preferences |
| `POST /api/notifications/preferences` | app | Set a preference |
| `GET /api/tracking/:orderId` | app | One order's normalized tracking |
| `GET /api/tracking?userId=` | app | All tracked orders for a user |
| `POST /webhooks/fulfillments/update` | Shopify HMAC | Now normalizes + persists tracking, fires deduped inbox+push |
| Existing: `POST /register-token`, `POST /send` (admin), `POST /campaign` (admin), `GET /devices`, `POST /deactivate-token` | — | unchanged (manual sends now also create inbox items via delivery service) |

---

## 4. Notification types implemented

The full taxonomy (~90 types) is registered in `utils/push-config.js` with category + priority. **Wired to real event sources today:**

| Type | Trigger (real) |
|---|---|
| `new_product` | inventory sync new-product detection (Admin → Storefront fallback) |
| `cart-nudge` | scheduled job querying `carts` table |
| `daily-reward`, `flash-live` | scheduled engine (configurable hours) |
| `hot-product`, `price-drop`, `broadcast`, `general` | manual admin send / campaign endpoint |
| `order-update`, `order-confirmed`, `order-processing`, `order-packed`, `order-shipped`, `order-in-transit`, `order-local-facility`, `order-out-for-delivery`, `delivery-attempted`, `order-delivered`, `order-delayed`, `order-exception`, `return-received` | fulfillment webhook → normalized status change |
| `support-reply`, `security-alert`, `refund-*`, `restock`, `deal-live`, `spin-ready`, `reward-earned`, etc. | **Not yet wired** — taxonomy/priority/routing ready; requires backend event sources (Shopify refunds webhook, game/reward state, etc.) |

---

## 5. Transactional vs promotional

- **Transactional** (bypass promo caps + quiet hours): all order/tracking/returns/refunds + security (`order-*`, `delivery-*`, `return-*`, `refund-*`, `payment-*`, `security-alert`, `new-login`, `password-changed`, `support-reply`, …).
- **Promotional** (subject to `PUSH_MAX_PROMO_PER_DAY`, `PUSH_MIN_INTERVAL_MINUTES`, quiet hours, preferences): arrivals, deals, games, rewards, cart nudges, recommendations, general/broadcast.

---

## 6. Priority / frequency / preference rules

- **Priority classes** (in `push-config.js`): CRITICAL (1000) > TRANSACTIONAL_HIGH (800) > PERSONAL_HIGH (600) > PROMOTIONAL (400) > LOW (200). `priorityClassForType()` used by the engine.
- **Frequency**: per-user where possible (`push_frequency.user_id`); daily cap + min interval + quiet hours; transactional exempt.
- **Preferences**: `notification_preferences` table; `preference_disabled` suppression logged. Security/orders/tracking/returns/support cannot be disabled.

---

## 7. Order tracking design

- `utils/tracking.js` normalizes raw Shopify/carrier strings → 12 statuses.
- Fulfillment webhook → `upsertOrderTracking()` (deduped by `last_notified_status`) → inbox + transactional push only on **change**.
- Frontend `app/account/tracking.tsx`: animated progress tracker (Ordered → Packed → Shipped → In Transit → Out for Delivery → Delivered), status-specific animations (processing pulse, shipped drift, out-for-delivery stronger, delivered check, delayed/exception warning), `AccessibilityInfo.isReduceMotionEnabled()` respected, timeline, carrier/tracking number, Track Package / Copy / Support / View order actions. Deep-links: `order-out-for-delivery + orderId` → this screen.
- Only real data is shown — no fabricated ETA/location/events.

---

## 8. How the NOOD Inbox works

- **Persistence**: every push campaign creates an inbox row (`notification_inbox`) via the delivery service BEFORE sending. `campaign_id UNIQUE` → retries never duplicate.
- **Broadcast**: single global row (`user_id NULL`), visible to all users. Per-user rows for targeted sends.
- **Read state**: `notification_inbox_reads (user_id, notification_id)`. Server-side mark-read / mark-all / unread count.
- **Home**: `HeroUpdatesSlide` shows latest 4 real items + real unread count + "View all". `app/account/updates.tsx` shows full history.
- **Offline**: `utils/inbox.ts` caches latest items + unread count in AsyncStorage; backend remains source of truth.
- **Deep links**: `inboxToNavigation()` = `notificationToRoute()` (single routing system shared with push taps).

---

## 9. Tests (all passing)

Run with `npm test` in `nood-backend`. **20 passed, 0 failed**:

1. token registration
2. duplicate token registration (idempotent)
3. new-product detection (only genuinely new)
4. repeated sync → no duplicate campaign
5. product batch notification (1 batched push)
6. manual broadcast
7. campaign frequency cap (promo blocked, transactional bypass)
8. cart notification cooldown
9. invalid Expo token → DeviceNotRegistered deactivated
10. deep-link payload generation (all types)
11. admin auth (rejects invalid)
12. frontend deep-link routing (compiled TS)
13. Supabase credential validation (sb_secret_ + service_role accepted; publishable/anon/missing rejected)
14. inbox persistence + retry dedupe + broadcast/user visibility
15. unread count + mark read + mark all read
16. tracking normalization (all statuses)
17. push ↔ inbox deep-link consistency
18. push campaign creates inbox item with matching payload
19. broadcast inbox visibility to all users
20. tracking deep-link routes to tracking screen

Frontend: `npx tsc --noEmit` → **0 errors**. `npx eslint <changed files>` → **0 errors**.

---

## 10. Shopify 402 resolution

`[INVENTORY SYNC] Shopify fetch failed: 402` was the Admin REST `products.json` endpoint returning **Payment Required** (Shopify plan limitation / unpaid invoice). Fixed by adding a **Storefront GraphQL fallback** (`jobs/inventory-sync.js`) that works on every Shopify plan. Now: Admin API → Storefront fallback → new-product detection → inbox → push.

---

## 11. Environment variables

- `SHOPIFY_STOREFRONT_TOKEN` — now used as fallback for inventory/new-product sync (documented in `.env.example`).
- Existing: `NOOD_ADMIN_TOKEN`, `PUSH_MIN_INTERVAL_MINUTES`, `PUSH_MAX_PROMO_PER_DAY`, `PUSH_QUIET_HOURS_*`, `PUSH_NEW_PRODUCT_BATCH_THRESHOLD`, `PUSH_CART_NUDGE_*`, `PUSH_REWARD_REMINDER_HOUR`, `PUSH_FLASH_WINDOW_*`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Test-only (auto): `PUSH_INBOX_FILE`, `PUSH_INBOX_READS_FILE`, `PUSH_PREFERENCES_FILE`.

---

## 12. Render changes

Deploy the updated backend. No new Render config required beyond the env vars above. Run the §2 SQL migration once. Rebuild/restart picks up the new tables + routes.

---

## 13. Android testing procedure

1. `cd nood-app && npx eas build --platform android --profile development` (or production).
2. Install, enable notifications, sign in → check `/api/notifications/devices` shows your device.
3. Send a manual test: `curl -X POST .../api/notifications/send -H 'x-admin-token: <TOKEN>' -d '{"title":"🔥 Test","body":"hello","type":"broadcast","route":"/(tabs)/deals"}'`.
4. Verify: push arrives, Home NOOD Inbox shows the item with correct icon + unread badge, tapping deep-links to Deals.
5. Fulfill an order in Shopify → webhook → check `[WEBHOOK] tracking normalized` + inbox item + push with status.
6. Tap order notification → animated tracking screen opens for that order.
7. Mark read / mark all → unread count updates.

---

## 14. Remaining gaps to production-readiness

- **Not yet wired (need real event sources):** restock/size-restock, wishlist price-drop detection from Shopify compare-at pricing, deal/coupon expiry timers, game/reward state (spin/scratch ready, streak at risk, reward won), refunds webhook, support replies, security events (new login). Taxonomy + routing + inbox + push pipeline are ready for each.
- **Personalization signals** are client-side (AsyncStorage) today — need server-side persistence (viewed products, searches, wishlist, orders, brands) to drive `personalized-pick`, `personalized-deal`, etc.
- Physical-device push delivery was NOT tested in this environment (no real device token) — automated tests mock Expo.
- `order_tracking` is populated by webhooks; if Shopify webhooks aren't configured for `fulfillments/update`, tracking stays empty (the screen falls back to local order data).
