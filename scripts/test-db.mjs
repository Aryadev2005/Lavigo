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

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
