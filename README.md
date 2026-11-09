# Lavigo Travel Co. website

Next.js 16 (App Router) + Supabase. Group-trip pages, custom-trip planner, seat holds, owner admin panel.
Payments are handled on WhatsApp for now; the database and booking flow are built so Razorpay can be dropped in (see bottom).

## 1. Set up Supabase (10 minutes)
1. supabase.com → New project → name `lavigo`, region **Mumbai (ap-south-1)**.
2. SQL Editor → run, in order, the contents of:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_seed.sql` (sample trips from the prototype; edit or delete them from /admin later)
   - `supabase/migrations/003_storage.sql` (photo bucket)
3. Authentication → Users → **Add user** → the owner's email + a strong password (tick "auto confirm").
4. Project Settings → API: copy the Project URL, `anon` key and `service_role` key.

## 2. Environment variables
Copy `.env.example` to `.env.local` for local work, and add the same keys in Vercel → Project → Settings → Environment Variables.
`SUPABASE_SERVICE_ROLE_KEY` is a secret: server only, never share it or commit it.
`ADMIN_EMAILS` must contain the owner's email (same as the Supabase user).

## 3. Run / deploy
```
npm install
npm run dev          # http://localhost:3000   (works without Supabase in read-only demo mode)
npm run db:test      # 35 seat-logic tests against an in-process Postgres
npm run build
```
Deploy: push to GitHub → Vercel → Import. Add the env vars. Then add `lavigo.in` and `www.lavigo.in` under Project → Domains and set the DNS records at GoDaddy that Vercel shows.

## 4. Launch day checklist
- [ ] Owner's real prices, dates, seats, photos entered in /admin (the seed content is sample data)
- [ ] `BUSINESS.email` and `BUSINESS.gstin` filled in `lib/config.ts`
- [ ] Owner has read and approved `/terms` and `/refund-policy` (refund slabs must come from him)
- [ ] Place a test booking, confirm it in /admin, cancel it
- [ ] Set `ALLOW_INDEXING=true` in Vercel and redeploy (until then the site tells Google to stay away)
- [ ] Submit `https://lavigo.in/sitemap.xml` in Google Search Console
- [ ] Claim the Google Business Profile for the Ranchi office

## How the owner uses it
`lavigo.in/admin` → sign in.
- **Bookings**: customers who hold seats appear as "awaiting payment". After they pay on WhatsApp, enter the amount received and tap **Confirm**. **Cancel** releases the seats instantly.
- **Trips & dates**: create a trip once; add a departure (date, price per person, total seats) for each batch. "Left" falls automatically as people book. Prices/dates/seats go live within seconds, no redeploy.
- **Planner rates**: room, travel and experience prices behind the "Plan my trip" page, and the photo gallery per destination.

## How seats work
- Booking form → `create_hold()` (Postgres function). It locks the departure row, checks seats, inserts the booking as `held` for 24 h.
- A seat is taken by a confirmed booking or an unexpired hold. Lapsed holds free their seats automatically (no cron needed); a daily cron only tidies status labels.
- One phone number can have at most 2 active holds and 4 attempts per hour (stops someone blocking a whole departure).

## Adding Razorpay later
The pieces are already in place: `bookings` has `payment_provider/payment_order_id/payment_id/payment_status`, and `confirm_booking()` accepts those values and is idempotent (safe for webhook retries). To switch on:
1. Owner completes Razorpay KYC; add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
2. Add an API route that creates a Razorpay order for the booking's `amount_advance` (receipt = booking code), and a "Pay advance" button on `/booking/[code]` next to the WhatsApp one.
3. Add a webhook route that verifies `x-razorpay-signature` and calls `rpc('confirm_booking', {p_booking, p_amount_paid, p_provider:'razorpay', p_order_id, p_payment_id})`.
Hold time can drop to ~30 minutes for online payment (`HOLD_HOURS` in `lib/config.ts`).

## Update: all-India trips (migration 005)

Run `supabase/migrations/005_all_india.sql` once in the Supabase SQL editor. It adds:
- a starting city on every departure (default Ranchi, editable in Admin → Trips → Departures),
- each traveller's name and gender, and who books the train/flight tickets, on every booking (`create_hold_v2`),
- hotel and car lists on every destination (editable in Admin → Destinations), filled with starter entries.

The site works before the migration too: bookings fall back to `create_hold` and keep travellers, genders and the ticket choice in the notes field, and hotels/cars come from `data/stays.json`.

Itineraries download from `/trips/<slug>/itinerary` and `/plan/itinerary` (print → Save as PDF).
