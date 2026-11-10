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

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
