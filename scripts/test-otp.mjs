// Tests verify_phone_otp (migration 009) against in-process Postgres. Run: node scripts/test-otp.mjs
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'

const db = new PGlite()
let fail = 0
const ok = (name, cond) => { if (!cond) fail++; console.log((cond ? '  ✓ ' : '  ✗ ') + name) }
const q = async (sql, p) => (await db.query(sql, p)).rows
const A = '00000000-0000-0000-0000-00000000000a', B = '00000000-0000-0000-0000-00000000000b'

await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create table auth.users (id uuid primary key);
  insert into auth.users values ('${A}'), ('${B}');
  create table profiles (id uuid primary key references auth.users(id), email text, full_name text not null default '',
    phone text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());`)
await db.exec(fs.readFileSync('supabase/migrations/009_phone_otp.sql', 'utf8'))

const put = (u, phone, hash, mins = 5) => q(`insert into phone_otps (user_id, phone, code_hash, expires_at) values ($1,$2,$3, now() + make_interval(mins => $4))
  on conflict (user_id) do update set phone=excluded.phone, code_hash=excluded.code_hash, expires_at=excluded.expires_at, attempts=0`, [u, phone, hash, mins])
const check = async (u, h) => (await q(`select verify_phone_otp($1,$2) r`, [u, h]))[0].r

ok('no code yet', await check(A, 'x') === 'no_code')
await put(A, '9876543210', 'good')
ok('wrong code', await check(A, 'bad') === 'wrong')
ok('right code', await check(A, 'good') === 'ok')
ok('profile saved + verified', (await q(`select phone, phone_verified_at from profiles where id=$1`, [A]))[0]?.phone_verified_at != null)
ok('code consumed', await check(A, 'good') === 'no_code')

await put(B, '9876543210', 'good')
ok('same number on another account is refused', await check(B, 'good') === 'taken')

await put(B, '9123456780', 'good')
for (let i = 0; i < 5; i++) await check(B, 'bad')
ok('locked after 5 wrong tries, even with the right code', await check(B, 'good') === 'too_many')

await put(B, '9123456780', 'good', -1)
ok('expired code refused', await check(B, 'good') === 'expired')

await db.exec('set role anon')
ok('anon cannot call it', await check(A, 'x').then(() => false, () => true))

console.log(fail ? `\n${fail} failed` : '\nall passed')
process.exit(fail ? 1 : 0)
