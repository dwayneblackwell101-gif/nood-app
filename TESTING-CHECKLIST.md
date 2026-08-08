# NOOD — Testing Checklist

> How to run and QA the app right now. Most things work even though Shopify
> billing is still pending — those are marked below.

---

## How to run it

```bash
# Terminal 1 — Backend (optional for most UI testing)
cd C:\Users\Shellson\Desktop\nood-backend
node server.js

# Terminal 2 — App
cd C:\Users\Shellson\Desktop\nood-app
npm start
```
Then scan the QR with Expo Go on your phone.

> The app is currently pointed at the Render backend (production URL). For
> local dev you can switch `nood-app/.env` to `EXPO_PUBLIC_BACKEND_URL=http://<your-LAN-IP>:3000`
> and `EXPO_PUBLIC_LOCAL_BACKEND=true` — but UI testing works either way.

---

## 🟢 Fully testable NOW (works without Shopify)

### Home tab
- [ ] Feed renders the hero slideshow (video) + flash sale banner + deal of the day
- [ ] Product grid scrolls smoothly (uses cached products)
- [ ] Long-press a product card → quick-preview modal pops up
- [ ] Tap a product → opens product page (may show 1 image — see note below)
- [ ] Floating cart button appears when items in cart

### Categories tab
- [ ] Sidebar shows all 8 categories (Men, Women, Kids, Shoes, Electronics, Accessories, Beauty, Construction)
- [ ] Tapping a category switches the right panel to its subcategories
- [ ] Tapping a subcategory circle navigates (or does nothing gracefully offline)
- [ ] Pull-to-refresh works

### Deals tab
- [ ] Flash sale banner shows with live countdown
- [ ] Deals grid renders (dummy/fallback data)
- [ ] Countdown timer ticks every second

### Rewards (Account → Rewards)
- [ ] Daily streak card — tap "Check in today", see the count go up
- [ ] Daily rewards calendar — claim today's reward → locked balance increases
- [ ] VIP card shows Bronze + progress bar
- [ ] Quests panel — browse categories to progress "Browse 3 categories"
- [ ] Scratch Prize — play it, see confetti
- [ ] Lucky Spin — spin, get a reward
- [ ] Style Challenges — open, see the 3 seeded challenges

### Video feed (Home → "Watch & Shop" card)
- [ ] All 16 videos load and auto-play
- [ ] Videos are muted
- [ ] Swipe between videos (full screen paging)
- [ ] Like → heart fills, count +1
- [ ] Comment → sheet opens, post a comment, appears in list
- [ ] Share → opens native share sheet
- [ ] Product tag shows "Shop this look" (offline) — becomes real product when Shopify is live
- [ ] Order is RANDOM each time you open the feed

### Cart / Wishlist
- [ ] Add to cart from home grid → badge updates
- [ ] Cart swipe-to-delete works
- [ ] Quantity steppers work
- [ ] Free shipping progress bar fills as total grows
- [ ] Wishlist heart toggles, items persist after restart

### Settings / Account
- [ ] Address picker — country → region → city cascade works
- [ ] Style DNA (Settings → Personalization) → complete the quiz, returns to Settings
- [ ] Notification toggles, incl. "Daily reward reminder"
- [ ] Profile, order history (empty state ok), wallet, messages screens open

### Gestures
- [ ] Swipe down on the video feed closes it
- [ ] Android: full-screen swipe-back from left edge
- [ ] iOS: edge swipe-back

---

## 🟡 Works but limited (needs Supabase set up)

- [ ] Video feed likes/comments/shares sync across users (currently local-only)
- [ ] Style Challenges submissions/votes shared across users
- [ ] Cart abandonment emails send (needs Supabase + SendGrid)

---

## 🔴 Can't test until Shopify billing is paid

- [ ] Product page shows ALL images (currently 1 — storefront API locked)
- [ ] Home feed shows real products
- [ ] Categories show real subcategory images
- [ ] Checkout → real payment → Shopify order created
- [ ] Search across real catalog

---

## 🐛 If you find a bug — record it like this

```
SCREEN: <where>
WHAT I DID: <tap/swipe/scrolled...>
WHAT HAPPENED: <error text or bad behavior>
EXPECTED: <what should happen>
```

Paste these into the chat and I'll fix them.

---

## The one sentence that matters for launch

> **"A stranger with a phone can buy a product and get a Shopify order."**

That's the test that matters most — and it's the one blocked by Shopify billing.
Everything above it can be QA'd today.
