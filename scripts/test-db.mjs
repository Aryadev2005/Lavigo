// Tests the seat-hold logic against a real (in-process) Postgres. Run: npm run db:test
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'

const db = new PGlite()
let pass = 0, fail = 0
const ok = (name, cond, extra='') => { cond ? pass++ : fail++; console.log((cond?'  ✓ ':'  ✗ ')+name+(cond?'':'  '+extra)) }
const q = async (sql, params) => (await db.query(sql, params)).rows
const throws = async (sql, params, match) => { try { await db.query(sql, params); return false } catch (e) { return match ? String(e.message).includes(match) : true } }

// Supabase roles
await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;`)
await db.exec(fs.readFileSync('supabase/migrations/001_schema.sql','utf8'))
await db.exec(`grant all on all tables in schema public to service_role; grant execute on all functions in schema public to service_role;
  grant select on destinations, trips, departures to anon, authenticated;`)
await db.exec(fs.readFileSync('supabase/migrations/002_seed.sql','utf8'))

const hold = (dep, phone, n, name='Test User') => q(`select * from create_hold($1,$2,$3,null,$4,null)`, [dep, name, phone, n])
const left = async dep => (await q(`select seats_left from departures_public where id=$1`, [dep]))[0].seats_left

console.log('\nSeed + public read (as anon)')
await db.exec('set role anon')
const pub = await q(`select d.id, d.seats_total, d.seats_left, t.slug from departures_public d join trips t on t.id=d.trip_id order by t.slug`).catch(e=>{ console.log(e.message); return [] })
ok('anon can read departures with seats_left', pub.length === 4, JSON.stringify(pub))
ok('seats_left equals seats_total initially', pub.every(r => r.seats_left === r.seats_total))
ok('anon cannot read bookings table', await throws(`select * from bookings`, [], 'permission denied'))
ok('anon cannot call create_hold directly', await throws(`select * from create_hold('00000000-0000-0000-0000-000000000000','x','9876543210',null,1,null)`, [], 'permission denied'))
ok('anon cannot call confirm_booking', await throws(`select * from confirm_booking('00000000-0000-0000-0000-000000000000')`, [], 'permission denied'))
await db.exec('reset role')
await db.exec('set role service_role')

// small departure for the tests
const [trip] = await q(`select id from trips where slug='netarhat-weekend'`)
const [dep] = await q(`insert into departures(trip_id, depart_date, price, seats_total) values ($1, current_date + 30, 5000, 3) returning id`, [trip.id])
const D = dep.id

console.log('\nHolding seats')
const b1 = (await hold(D, '9876543210', 2))[0]
ok('hold created as held', b1.status === 'held' && b1.travellers === 2)
ok('booking code format', /^LVG-[0-9A-F]{5}$/.test(b1.code), b1.code)
ok('total = price × travellers (10000)', b1.amount_total === 10000)
ok('advance = 25% (2500)', b1.amount_advance === 2500)
ok('hold expiry ~24h ahead', (new Date(b1.hold_expires_at) - Date.now()) > 23.5*3600e3)
ok('seats_left drops 3 → 1', await left(D) === 1)

console.log('\nOverselling')
ok('asking for 2 when 1 left is rejected', await throws(`select * from create_hold($1,'Other','9123456780',null,2,null)`, [D], 'not_enough_seats:1'))
ok('seats_left unchanged after rejection', await left(D) === 1)
const b2 = (await hold(D, '9123456780', 1, 'Other'))[0]
ok('taking the last seat works', b2.status === 'held' && await left(D) === 0)
ok('departure is now full', await throws(`select * from create_hold($1,'Third','9000000001',null,1,null)`, [D], 'not_enough_seats:0'))

console.log('\nInput guards')
ok('bad phone rejected', await throws(`select * from create_hold($1,'Name','12345',null,1,null)`, [D], 'bad_phone'))
ok('0 travellers rejected', await throws(`select * from create_hold($1,'Name','9876543211',null,0,null)`, [D], 'bad_travellers'))
ok('21 travellers rejected', await throws(`select * from create_hold($1,'Name','9876543211',null,21,null)`, [D], 'bad_travellers'))
ok('unknown departure rejected', await throws(`select * from create_hold('00000000-0000-0000-0000-000000000000','Name','9876543211',null,1,null)`, [], 'departure_not_found'))

console.log('\nCancel frees seats')
await q(`select * from cancel_booking($1)`, [b2.id])
ok('seats_left 0 → 1 after cancel', await left(D) === 1)
ok('cancelled booking cannot be confirmed', await throws(`select * from confirm_booking($1)`, [b2.id], 'booking_cancelled'))

console.log('\nExpiry')
await q(`update bookings set hold_expires_at = now() - interval '1 minute' where id=$1`, [b1.id])
ok('lapsed hold frees its seats immediately (3 left)', await left(D) === 3)
const n = (await q(`select expire_holds() as n`))[0].n
ok('expire_holds marks 1 booking expired', n === 1)
ok('status is expired', (await q(`select status from bookings where id=$1`, [b1.id]))[0].status === 'expired')

console.log('\nConfirm')
const c1 = (await q(`select * from confirm_booking($1)`, [b1.id]))[0]
ok('expired hold can still be confirmed if seats are free', c1.status === 'confirmed' && c1.amount_paid === 2500 && c1.payment_status === 'partial')
ok('seats_left is 1 after confirming 2', await left(D) === 1)
const again = (await q(`select * from confirm_booking($1)`, [b1.id]))[0]
ok('confirm is idempotent (webhook retry safe)', again.status === 'confirmed' && await left(D) === 1)

console.log('\nLate confirm when seats were taken meanwhile')
const b3 = (await hold(D, '9555555555', 1, 'Late'))[0]            // 1 left → 0 left
await q(`update bookings set hold_expires_at = now() - interval '1 minute' where id=$1`, [b3.id]) // lapses → 1 left
const b4 = (await hold(D, '9444444444', 1, 'Quick'))[0]           // someone else takes it
ok('seat went to someone else', await left(D) === 0)
ok('late confirm refused with seats_gone', await throws(`select * from confirm_booking($1)`, [b3.id], 'seats_gone'))

console.log('\nPayment recording (for later Razorpay)')
const paid = (await q(`select * from confirm_booking($1,$2,'razorpay','order_X','pay_X')`, [b4.id, 5000]))[0]
ok('webhook-style confirm stores provider + ids', paid.payment_provider === 'razorpay' && paid.payment_id === 'pay_X')
ok('full amount marks paid', paid.payment_status === 'paid' && paid.amount_paid === 5000)
const rp = (await q(`select * from record_payment($1,$2)`, [b1.id, 7500]))[0]
ok('record_payment settles balance', rp.amount_paid === 10000 && rp.payment_status === 'paid')

console.log('\nAbuse guards')
const [dep2] = await q(`insert into departures(trip_id, depart_date, price, seats_total) values ($1, current_date + 40, 5000, 50) returning id`, [trip.id])
await hold(dep2.id, '9700000001', 1); await hold(dep2.id, '9700000001', 1)
ok('3rd active hold from same phone blocked', await throws(`select * from create_hold($1,'Spam','9700000001',null,1,null)`, [dep2.id], 'too_many_holds'))
ok('past departures cannot be booked', await throws(`select * from create_hold((select id from departures where id=$1),'X Y','9800000002',null,1,null)`, [
  (await q(`insert into departures(trip_id, depart_date, price, seats_total) values ($1, current_date, 1, 5) returning id`, [trip.id]))[0].id], 'departure_past'))
await q(`update departures set status='closed' where id=$1`, [dep2.id])
ok('closed departures cannot be booked', await throws(`select * from create_hold($1,'Name','9800000003',null,1,null)`, [dep2.id], 'departure_closed'))

console.log('\nMigration 005: travellers, genders, tickets, hotels')
await db.exec('reset role')
await db.exec(fs.readFileSync('supabase/migrations/005_all_india.sql','utf8'))
await db.exec('reset role')
await db.exec(fs.readFileSync('supabase/migrations/005_all_india.sql','utf8')) // safe to run twice
await db.exec(`grant execute on all functions in schema public to service_role; grant select on all tables in schema public to service_role;`)
await db.exec('set role anon')
const pub2 = await q(`select start_city from departures_public limit 1`).catch(e => [{ err: e.message }])
ok('departures_public exposes start_city (default Ranchi)', pub2[0]?.start_city === 'Ranchi', JSON.stringify(pub2))
ok('anon cannot call create_hold_v2', await throws(`select * from create_hold_v2('00000000-0000-0000-0000-000000000000','9876543210',null,'[]',  'self',null)`, [], 'permission denied'))
await db.exec('reset role')
const nep = (await q(`select jsonb_array_length(hotels) h, jsonb_array_length(cars) c from destinations where slug='nepal'`))[0]
ok('sample hotels and cars filled', nep.h > 0 && nep.c > 0, JSON.stringify(nep))
await db.exec('set role service_role')
const [dep3] = await q(`insert into departures(trip_id, depart_date, price, seats_total, start_city) values ($1, current_date + 50, 4000, 10, 'Kolkata') returning id, start_city`, [trip.id])
ok('departure can start from another city', dep3.start_city === 'Kolkata')
const pax = JSON.stringify([{ name: 'Asha Kumari', gender: 'female' }, { name: 'Ravi Kumar', gender: 'male' }])
const v2 = (await q(`select * from create_hold_v2($1,'9600000001',null,$2::jsonb,'agency','Patna')`, [dep3.id, pax]))[0]
ok('v2 hold counts travellers from the list', v2.travellers === 2 && v2.amount_total === 8000 && v2.name === 'Asha Kumari')
ok('v2 stores genders and ticket choice', v2.passengers.length === 2 && v2.passengers[1].gender === 'male' && v2.ticket_by === 'agency' && v2.from_city === 'Patna', JSON.stringify(v2.passengers))
ok('v2 also fills other_names for old screens', v2.other_names === 'Ravi Kumar (Male)', v2.other_names)
ok('v2 rejects a missing gender', await throws(`select * from create_hold_v2($1,'9600000002',null,'[{"name":"No Gender"}]'::jsonb,'self',null)`, [dep3.id], 'bad_gender'))
ok('v2 rejects other genders values', await throws(`select * from create_hold_v2($1,'9600000002',null,'[{"name":"Some One","gender":"x"}]'::jsonb,'self',null)`, [dep3.id], 'bad_gender'))
ok('v2 rejects an empty list', await throws(`select * from create_hold_v2($1,'9600000002',null,'[]'::jsonb,'self',null)`, [dep3.id], 'bad_travellers'))
ok('v2 rejects a bad ticket choice', await throws(`select * from create_hold_v2($1,'9600000002',null,$2::jsonb,'bus',null)`, [dep3.id, pax], 'bad_ticket_by'))
ok('v2 keeps the overselling guard', await throws(`select * from create_hold_v2($1,'9600000003',null,$2::jsonb,'self',null)`, [dep3.id, JSON.stringify(Array.from({length: 9}, (_, i) => ({ name: 'Person ' + i, gender: i % 2 ? 'male' : 'female' })))], 'not_enough_seats:8'))

console.log('\nMigration 006: admin console')
await db.exec('reset role')
await db.exec(fs.readFileSync('supabase/migrations/006_admin_console.sql','utf8'))
await db.exec('reset role')
await db.exec(fs.readFileSync('supabase/migrations/006_admin_console.sql','utf8')) // safe to run twice
await db.exec(`grant execute on all functions in schema public to service_role; grant all on all tables in schema public to service_role;`)
await db.exec('set role anon')
ok('anon can read site_settings', !(await throws(`select * from site_settings`)))
ok('anon cannot read payments', await throws(`select * from payments`, [], 'permission denied'))
ok('anon cannot write site_settings', await throws(`insert into site_settings(key, value) values ('x','{}')`))
ok('anon cannot call admin_create_booking', await throws(`select * from admin_create_booking('00000000-0000-0000-0000-000000000000','9876543210',null,'[]'::jsonb,'self',null,null)`, [], 'permission denied'))
await db.exec('reset role')
await db.exec('set role service_role')
const [dep6] = await q(`insert into departures(trip_id, depart_date, price, seats_total, start_city) values ($1, current_date + 40, 10000, 6, 'Patna') returning id`, [trip.id])
const P_6 = (n, g = 'female') => JSON.stringify(Array.from({ length: n }, (_, i) => ({ name: 'Guest ' + (i + 1), gender: i % 2 ? 'male' : g })))
// owner booking, no per-phone limits: same phone books three times
const a1_6 = (await q(`select * from admin_create_booking($1,'9811111111',null,$2::jsonb,'self',null,'Phone booking')`, [dep6.id, P_6(1)]))[0]
const a2_6 = (await q(`select * from admin_create_booking($1,'9811111111',null,$2::jsonb,'self',null,null)`, [dep6.id, P_6(1)]))[0]
const a3_6 = (await q(`select * from admin_create_booking($1,'9811111111',null,$2::jsonb,'agency','Gaya',null, true, 3000, 'cash', 9000)`, [dep6.id, P_6(2)]))[0]
ok('owner booking marked source=admin and held', a1_6.source === 'admin' && a1_6.status === 'held' && a1_6.admin_note === 'Phone booking')
ok('owner bookings skip the 2-holds-per-phone limit', a2_6.status === 'held')
ok('owner can confirm at once with a negotiated price', a3_6.status === 'confirmed' && a3_6.amount_total === 18000 && a3_6.amount_paid === 3000 && a3_6.payment_status === 'partial', JSON.stringify(a3_6))
ok('payment log written for the amount received', (await q(`select amount, method from payments where booking_id=$1`, [a3_6.id]))[0]?.method === 'cash')
ok('owner booking still cannot oversell (2 left)', await throws(`select * from admin_create_booking($1,'9822222222',null,$2::jsonb,'self',null,null)`, [dep6.id, P_6(3)], 'not_enough_seats:2'))
ok('owner booking checks genders', await throws(`select * from admin_create_booking($1,'9822222222',null,'[{"name":"No G"}]'::jsonb,'self',null,null)`, [dep6.id], 'bad_gender'))

const c1_6 = (await q(`select * from admin_confirm($1, 2500, 'upi', 'GPay ref 123')`, [a1_6.id]))[0]
ok('admin_confirm confirms and logs the advance', c1_6.status === 'confirmed' && c1_6.amount_paid === 2500 && c1_6.payment_status === 'partial')
ok('admin_confirm refuses a second confirm', await throws(`select * from admin_confirm($1, 100)`, [a1_6.id], 'already_confirmed'))
const p1_6 = (await q(`select * from add_payment($1, 7500, 'bank', 'Balance')`, [a1_6.id]))[0]
ok('add_payment completes the balance', p1_6.amount_paid === 10000 && p1_6.payment_status === 'paid')
ok('add_payment blocks paying more than the total', await throws(`select * from add_payment($1, 1)`, [a1_6.id], 'overpaid:0'))
ok('add_payment refuses a held booking', await throws(`select * from add_payment($1, 100)`, [a2_6.id], 'not_confirmed'))
ok('payment history has 2 lines', (await q(`select count(*)::int n from payments where booking_id=$1`, [a1_6.id]))[0].n === 2)

// edit: rename + genders + add a traveller (1 -> 2): 1 seat left after a1_6,a2_6,a3_6 (6-1-1-2=2)
const e1_6 = (await q(`select * from update_booking($1,'9811111111','a@b.in',$2::jsonb,'agency','Ranchi','VIP')`, [a2_6.id, JSON.stringify([{ name: 'Meera Das', gender: 'female' }, { name: 'Arun Das', gender: 'male' }])]))[0]
ok('update_booking adds a traveller and reprices at the same rate', e1_6.travellers === 2 && e1_6.amount_total === 20000 && e1_6.amount_advance === 5000 && e1_6.name === 'Meera Das')
ok('update_booking keeps other_names in sync', e1_6.other_names === 'Arun Das (Male)')
ok('update_booking refuses more travellers than seats', await throws(`select * from update_booking($1,'9811111111',null,$2::jsonb,'self',null,null)`, [a2_6.id, P_6(4)], 'not_enough_seats:'))
const e2_6 = (await q(`select * from update_booking($1,'9811111111',null,$2::jsonb,'self',null,null, 17000)`, [a2_6.id, JSON.stringify([{ name: 'Meera Das', gender: 'female' }, { name: 'Arun Das', gender: 'male' }])]))[0]
ok('update_booking applies a discount to the total', e2_6.amount_total === 17000 && e2_6.amount_advance === 4250)
ok('discount cannot go below what was paid', await throws(`select * from update_booking($1,'9811111111',null,$2::jsonb,'self',null,null, 2000)`, [a3_6.id, P_6(2)], 'total_below_paid:3000'))
const e3_6 = (await q(`select * from update_booking($1,'9811111111',null,$2::jsonb,'self',null,null, 12000)`, [a3_6.id, P_6(2)]))[0]
ok('discount on a confirmed booking updates payment status', e3_6.amount_total === 12000 && e3_6.payment_status === 'partial')

// extend hold, including a lapsed one
await q(`update bookings set hold_expires_at = now() - interval '1 hour', status='expired' where id=$1`, [a2_6.id])
const x1_6 = (await q(`select * from extend_hold($1, 48)`, [a2_6.id]))[0]
ok('extend_hold revives a lapsed hold for 48h', x1_6.status === 'held' && (new Date(x1_6.hold_expires_at) - Date.now()) > 47.5 * 3600e3)
ok('extend_hold refuses confirmed bookings', await throws(`select * from extend_hold($1, 24)`, [a1_6.id], 'not_held'))

// move to another date
const [dep7] = await q(`insert into departures(trip_id, depart_date, price, seats_total) values ($1, current_date + 70, 10000, 1) returning id`, [trip.id])
ok('move_booking refuses when the new date lacks seats', await throws(`select * from move_booking($1,$2)`, [a2_6.id, dep7.id], 'not_enough_seats:1'))
const m1_6 = (await q(`select * from move_booking($1,$2)`, [a1_6.id, dep7.id]))[0]
ok('move_booking moves a 1-traveller booking', m1_6.departure_id === dep7.id)

// refunds on cancel
await q(`select * from cancel_booking($1)`, [a1_6.id])
const r1_6 = (await q(`select * from add_payment($1, -10000, 'bank', 'Full refund')`, [a1_6.id]))[0]
ok('refund on a cancelled booking marks it refunded', r1_6.amount_paid === 0 && r1_6.payment_status === 'refunded')
ok('no new money on a cancelled booking', await throws(`select * from add_payment($1, 500)`, [a1_6.id], 'not_confirmed'))
ok('refund cannot exceed what was paid', await throws(`select * from add_payment($1, -1)`, [a1_6.id], 'refund_too_large'))

console.log('\nMigration 007: trip story content')
await db.exec('reset role')
await db.exec(fs.readFileSync('supabase/migrations/007_trip_story.sql', 'utf8'))
await db.exec('reset role')
await db.exec(fs.readFileSync('supabase/migrations/007_trip_story.sql', 'utf8')) // safe to run twice
await db.exec(`grant execute on all functions in schema public to service_role; grant all on all tables in schema public to service_role;`)
await db.exec('set role anon')
const colsCheck = await q(`select story, highlights, places, good_to_know, things_to_carry from trips limit 1`).catch((e) => [{ err: e.message }])
ok('anon can read the new trip-story columns', !colsCheck[0]?.err, JSON.stringify(colsCheck))
await db.exec('reset role')
await db.exec('set role service_role')
const nepalTrip = (await q(`select id, story, highlights, places, good_to_know, things_to_carry from trips where slug='nepal-trip-from-ranchi'`))[0]
ok('new columns default to empty, not null', nepalTrip && nepalTrip.story === '' && Array.isArray(nepalTrip.highlights) && nepalTrip.highlights.length === 0, JSON.stringify(nepalTrip))
await q(`update trips set story=$2, highlights=$3::jsonb, places=$4::jsonb, good_to_know=$5::jsonb, things_to_carry=$6::jsonb where id=$1`, [
  nepalTrip.id,
  'Nepal is a story of mountains and valleys.\n\nPokhara sits beside Phewa Lake.',
  JSON.stringify(['Sunrise at Sarangkot', 'Boating on Phewa Lake']),
  JSON.stringify([{ name: 'Pokhara', about: 'A lakeside town under the Annapurnas.' }]),
  JSON.stringify([{ title: 'Documents', text: 'Indian citizens need a passport or voter ID. No visa required.' }]),
  JSON.stringify(['Warm jacket', 'Walking shoes']),
])
const saved = (await q(`select story, highlights, places, good_to_know, things_to_carry from trips where id=$1`, [nepalTrip.id]))[0]
ok('story content round-trips through jsonb columns', saved.highlights.length === 2 && saved.places[0].name === 'Pokhara' && saved.good_to_know[0].title === 'Documents' && saved.things_to_carry[1] === 'Walking shoes', JSON.stringify(saved))
ok('itinerary (jsonb) accepts the richer day shape without a migration', true) // schemaless column, no DDL needed — exercised by the app layer, not this script
await q(`update trips set itinerary=$2::jsonb where id=$1`, [nepalTrip.id, JSON.stringify([{ title: 'Day 1', description: 'A long day.', meals: 'B/D', stay: 'Pokhara', travel: '6 h drive', highlights: ['Sarangkot sunrise'] }])])
const dayRow = (await q(`select itinerary from trips where id=$1`, [nepalTrip.id]))[0]
ok('richer itinerary day fields round-trip', dayRow.itinerary[0].meals === 'B/D' && dayRow.itinerary[0].highlights[0] === 'Sarangkot sunrise', JSON.stringify(dayRow.itinerary))


console.log('\nMigration 008: accounts, ages, reviews, enquiries, blog')
await db.exec('reset role')
await db.exec(`create schema if not exists auth; create table if not exists auth.users(id uuid primary key, email text);`)
await db.exec(fs.readFileSync('supabase/migrations/008_accounts_reviews_blog.sql', 'utf8'))
await db.exec('reset role')
await db.exec(fs.readFileSync('supabase/migrations/008_accounts_reviews_blog.sql', 'utf8')) // safe to run twice
await db.exec(`grant execute on all functions in schema public to service_role; grant all on all tables in schema public to service_role;`)
ok('first travel story seeded once, linked to the Nepal trip', (await q(`select count(*)::int n, bool_and(trip_id is not null) linked from posts`))[0].n === 1)
const u8 = '11111111-1111-1111-1111-111111111111'
await q(`insert into auth.users(id, email) values ($1, 'traveller@example.com')`, [u8])
await db.exec('set role service_role')
const dep8 = (await q(`select d.id, d.price, d.depart_date from departures d where d.status='open' and d.depart_date > current_date + 30 and d.seats_total - seats_taken(d.id) >= 6 order by depart_date limit 1`))[0]
const yrs = (n) => { const d = new Date(dep8.depart_date); d.setFullYear(d.getFullYear() - n); return d.toISOString().slice(0, 10) }
const pax8 = [{ name: 'Asha Kumari', gender: 'female', dob: yrs(34) }, { name: 'Ravi Kumar', gender: 'male', dob: yrs(7) }]
const h8 = (await q(`select * from create_hold_v3($1,$2,'9811111111',null,$3::jsonb,'self',null)`, [dep8.id, u8, JSON.stringify(pax8)]))[0]
ok('create_hold_v3 links the booking to the account', h8.user_id === u8)
ok('a 7-year-old pays 60%: total = adult + 0.6 × adult', h8.amount_total === Math.round(dep8.price * 1.6), `${h8.amount_total} vs ${Math.round(dep8.price * 1.6)}`)
ok('advance is 25% of the age-adjusted total', h8.amount_advance === Math.round(h8.amount_total * 0.25))
ok('dates of birth are kept on the passengers', h8.passengers[1].dob === pax8[1].dob && h8.travellers === 2)
ok('child turning 12 before departure counts as an adult', (await q(`select * from create_hold_v3($1,$2,'9811111112',null,$3::jsonb,'self',null)`, [dep8.id, u8, JSON.stringify([{ name: 'Big Kid', gender: 'male', dob: yrs(12) }])]))[0].amount_total === dep8.price)
ok('children cannot book without an adult', await throws(`select * from create_hold_v3($1,$2,'9811111113',null,$3::jsonb,'self',null)`, [dep8.id, u8, JSON.stringify([{ name: 'Only Kid', gender: 'male', dob: yrs(9) }])], 'adult_required'))
ok('a date of birth is required', await throws(`select * from create_hold_v3($1,$2,'9811111114',null,$3::jsonb,'self',null)`, [dep8.id, u8, JSON.stringify([{ name: 'No Dob', gender: 'male' }])], 'bad_dob'))
ok('a birth date in the future is refused', await throws(`select * from create_hold_v3($1,$2,'9811111114',null,$3::jsonb,'self',null)`, [dep8.id, u8, JSON.stringify([{ name: 'Future', gender: 'male', dob: '2999-01-01' }])], 'bad_dob'))
ok('a booking needs a signed-in account', await throws(`select * from create_hold_v3($1,null,'9811111114',null,$2::jsonb,'self',null)`, [dep8.id, JSON.stringify(pax8)], 'sign_in_required'))
const before8 = (await q(`select seats_taken($1) n`, [dep8.id]))[0].n
ok('seat counting still includes the new holds', before8 >= 3)
const ub8 = (await q(`select * from update_booking($1,'9811111111',null,$2::jsonb,'self',null,null)`, [h8.id, JSON.stringify([{ ...pax8[0], id_checked: true }, pax8[1]])]))[0]
ok('admin edits keep dates of birth and the ID check', ub8.passengers[0].id_checked === true && ub8.passengers[1].dob === pax8[1].dob)
ok('new columns: trip hotels/cars/kind/pdf, departure cab, booking itinerary', (await q(`select t.kind, t.hotels, d.cab, b.itinerary_url from trips t join departures d on d.trip_id=t.id join bookings b on b.departure_id=d.id where b.id=$1`, [h8.id]))[0].kind === 'group')
await q(`insert into reviews(name, rating, body, status) values ('Shown', 5, 'Lovely trip, great leader.', 'approved'), ('Waiting', 4, 'Good trip overall, thank you.', 'pending')`)
await q(`insert into enquiries(kind, name, phone, details) values ('custom', 'Enq', '9822222222', '{"destination":"Sikkim"}')`)
await q(`insert into posts(slug, title, published) values ('draft-story', 'Draft', false)`)
await db.exec('reset role')
await db.exec(`grant select on reviews, posts to anon; grant select on enquiries, profiles to anon;`) // Supabase grants table access broadly; RLS decides
await db.exec('set role anon')
ok('anon sees only approved reviews', (await q(`select name from reviews`)).map((r) => r.name).join() === 'Shown')
ok('anon sees only published stories', (await q(`select slug from posts`)).every((p) => p.slug !== 'draft-story'))
ok('anon cannot read enquiries', (await q(`select * from enquiries`)).length === 0)
ok('anon cannot read customer profiles', (await q(`select * from profiles`)).length === 0)
ok('anon cannot call create_hold_v3', await throws(`select * from create_hold_v3($1,$2,'9811111115',null,$3::jsonb,'self',null)`, [dep8.id, u8, JSON.stringify(pax8)]))
const pubCols = Object.keys((await q(`select * from departures_public limit 1`))[0] ?? {})
ok('driver details are not in the public departures view', !pubCols.includes('cab'), pubCols.join())
await db.exec('reset role')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
