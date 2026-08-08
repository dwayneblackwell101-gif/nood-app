# NOOD — Launch Checklist

> Everything that must be true before real customers can pay you.
> Work top to bottom. Items marked ⛔ are **blockers** — skip them and checkout will fail.

---

## ⛔ 1. Backend credentials (`nood-backend/.env`)

The backend now **screams at you on startup** if these are missing.
Set all four to real values:

| Variable | Where to get it |
| --- | --- |
| `WIPAY_ACCOUNT_NUMBER` | Your WiPay merchant dashboard (account number, not email) |
| `WIPAY_ENVIRONMENT` | `production` after you finish testing (keep `sandbox` for now) |
| `SHOPIFY_STORE_DOMAIN` | `noodcaribbean.myshopify.com` |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Shopify Admin → Settings → Apps → Develop apps → create app → Admin API access token (scopes: `write_orders`, `read_orders`) |

**Verify:** `cd nood-backend && node server.js` → should print `✅ All production credentials present.`

**Deploy:** push the updated `server.js` to Render/Railway (your live URL is `https://nood-backend.onrender.com`).

---

## ⛔ 1b. Supabase setup (video feed likes/comments/shares + jobs)

The video feed's **real likes, comments, and shares** (shared across all users)
and the background jobs (cart recovery, inventory sync, order sync) need a
Supabase database. It's free up to a point.

| Variable | Where to get it |
| --- | --- |
| `SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API → `service_role` secret key |

**Setup steps:**
1. Go to https://supabase.com → create a new project (any region).
2. In the project, open **SQL Editor** → **New query**.
3. Paste the entire contents of **`nood-backend/supabase-setup.sql`** and click **Run**.
4. Copy your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into `nood-backend/.env`.
5. Restart the backend. The video feed counts will now be real and shared.

> Without Supabase, the app still works — video feed counts show 0 and update
> locally per-device, but aren't shared between users.

---

## ⛔ 2. Payment gateway — live test purchase

- [ ] WiPay: after setting `WIPAY_ENVIRONMENT=production`, place a **real $1.00 order** in the app and complete it in the WiPay popup.
- [ ] Confirm the order appears in **Shopify Admin → Orders** (this proves the Admin API token + order creation work).
- [ ] Confirm the order appears in the app under **Account → Your Orders**.
- [ ] PayPal: set `EXPO_PUBLIC_PAYPAL_ENV=production` in `nood-app/.env` and use a **live PayPal client ID** from developer.paypal.com (not the sandbox one). Test one PayPal checkout.

---

## ⛔ 3. Production app build

Push notifications and AR **only work in a real build** (not Expo Go).

- [ ] `cd nood-app && npx eas build --profile production --platform android`
- [ ] iOS (requires paid Apple Developer account): `npx eas build --profile production --platform ios` then submit via App Store Connect.
- [ ] Install the build on a real device and confirm: push notification prompt appears, and AR try-on shows the AR scene (not the fallback).

---

## 🟡 4. Pre-launch QA (30 min)

- [ ] Sign up with Google → sign out → sign back in (guest cart should merge).
- [ ] Add to cart → change quantity → remove item.
- [ ] Apply a reward (lucky spin / scratch) → confirm locked balance.
- [ ] Wishlist an item → confirm it survives app restart.
- [ ] Add an address with the new city/state/country pickers → confirm it's used at checkout.
- [ ] Create an order → check the tracking timeline in Your Orders.
- [ ] Verify the referral link: share from the Special Reward Challenge → open on another device → attribution counts.

---

## 🟡 5. App Store / listing polish (before submission)

- [ ] App icon and splash use the NOOD brand assets (already configured in `app.json`).
- [ ] Write the App Store / Play Store description with the real features:
      flash sales, rewards & streaks, AR try-on, visual search, price-drop alerts.
- [ ] Privacy policy URL linked (needed for iOS review + Play Data Safety).
- [ ] Screenshots on a real device (emulator screenshots get rejected).

---

## 🟢 6. Optional but recommended

- [ ] **Home screen refactor** — `app/(tabs)/index.tsx` is 7,000 lines. Not a blocker,
      but a launch-day bug in there is slow to fix. (I can do this carefully.)
- [ ] Analytics (e.g. Shopify's built-in) so you can see funnel drop-off on day 1.
- [ ] Set up a support email + link it in the Support screen.

---

## The single most important test

> **"A stranger with a phone can buy a product and get a Shopify order."**

Run that exact sentence as a test before you tell anyone the app is live.
