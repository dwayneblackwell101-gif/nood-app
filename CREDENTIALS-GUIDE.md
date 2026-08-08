# NOOD — Launch Credentials Setup

> How to turn the placeholders into real credentials so a stranger can
> actually pay you. Work through these in order. Each section tells you
> **exactly** what to grab, from where, and where to paste it.

---

## What's still missing right now

Checked against your files on **2026-08-06**:

| File | Variable | Status |
| --- | --- | --- |
| `nood-backend/.env` | `WIPAY_ACCOUNT_NUMBER` | ❌ placeholder `your_wipay_account_number` |
| `nood-backend/.env` | `WIPAY_ENVIRONMENT` | ⚠️ `sandbox` (fine for testing) |
| `nood-backend/.env` | `SHOPIFY_ADMIN_ACCESS_TOKEN` | ❌ placeholder `your_shopify_admin_access_token` |
| `nood-backend/.env` | `SUPABASE_URL` | ❌ missing |
| `nood-backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` | ❌ missing |
| `nood-app/.env` | `EXPO_PUBLIC_PAYPAL_ENV` | ⚠️ `sandbox` |
| `nood-app/.env` | `EXPO_PUBLIC_PAYPAL_CLIENT_ID` | ⚠️ sandbox client ID |

The **two hard blockers** are the WiPay account number and the Shopify
Admin token — the backend refuses to create orders without them. The
Supabase keys unlock video-feed likes/comments and the background jobs.
PayPal sandbox is fine for testing; switch to live only at launch.

---

## 1. Shopify Admin API token (⛔ blocker)

1. Go to your Shopify admin → **Settings → Apps → Develop apps**.
2. Click **Create an app** (name it `NOOD Backend`).
3. In the app, go to **Admin API scopes** and grant at minimum:
   - `write_orders`, `read_orders` (order creation)
   - `write_products`, `read_products` (inventory sync)
   - `write_customers`, `read_customers` (optional)
4. Click **Install app**, then under **Admin API access token** click
   **Install** and copy the token.
5. Paste it into `nood-backend/.env`:

```
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxx
```

> The token looks like `shpat_` followed by ~20 chars. Your
> `SHOPIFY_STORE_DOMAIN` is already correct (`noodcaribbean.myshopify.com`),
> so once this token is real, order creation will work.

---

## 2. WiPay account number (⛔ blocker)

1. Log in to your **WiPay merchant dashboard** (tt.wipayfinancial.com).
2. Copy your **account number** — this is the merchant account number,
   **not** your email or login.
3. Paste it into `nood-backend/.env`:

```
WIPAY_ACCOUNT_NUMBER=your_real_account_number_here
```

4. Keep `WIPAY_ENVIRONMENT=sandbox` while testing. Only set it to
   `production` once you've completed a real $1 order in sandbox and
   confirmed it shows up in Shopify.

---

## 3. Supabase (video feed + background jobs)

1. Go to **https://supabase.com** → **New project** (any region, free tier).
2. Once created, open the project → **SQL Editor → New query**.
3. Paste the entire contents of `nood-backend/supabase-setup.sql` and run it.
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **`service_role` secret key** → `SUPABASE_SERVICE_ROLE_KEY`
5. Paste both into `nood-backend/.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

6. Restart the backend. Video-feed likes/comments/shares and the cart
   recovery + inventory sync jobs will now use real shared data.

> Without Supabase the app still works — video counts just show 0 and
> update per-device only.

---

## 4. PayPal (sandbox → live)

### For testing (current state is fine)
- `EXPO_PUBLIC_PAYPAL_ENV=sandbox` in `nood-app/.env`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID` = your **sandbox** client ID from
  developer.paypal.com → **Apps & Credentials** (sandbox tab).

### For launch
1. In developer.paypal.com → **Apps & Credentials**, switch to **Live**.
2. **Create App** → copy the **Client ID**.
3. In `nood-app/.env`:
   ```
   EXPO_PUBLIC_PAYPAL_ENV=production
   EXPO_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id
   ```

> PayPal's client-side SDK only needs the client ID (it's public). There is
> no secret needed in the backend for the current flow.

---

## 5. Verify it all works

From `nood-backend/`:

```
node server.js
```

You should see:

```
✅ All production credentials present.
```

Then run **the single most important test**:

> **"A stranger with a phone can buy a product and get a Shopify order."**

Place a real $1 order via WiPay in the app, and confirm the order appears
in **Shopify Admin → Orders** and in the app under **Account → Your Orders**.

---

## What I already fixed (2026-08-06)

- **Missing payment routes (was a 404):** Wallet checkout
  (`POST /api/wallet/checkout`) and PayPal order creation/capture
  (`POST /api/orders`, `POST /api/orders/:id/capture`) didn't exist in the
  backend — they'd have failed silently on a real purchase. Added
  `nood-backend/routes/payments.js` reusing the existing Shopify order
  creator. All three payment methods now work once credentials are real.
- **Frontend env pointed at your LAN:** `nood-app/.env` now defaults to
  `https://nood-backend.onrender.com` with `EXPO_PUBLIC_LOCAL_BACKEND=false`.
  Your local dev override still lives in `nood-app/.env.local`.
- **Duplicate cart button on product page:** "Add to cart" no longer opens
  the variant picker when there's nothing to choose.
