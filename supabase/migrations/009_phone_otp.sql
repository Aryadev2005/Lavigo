-- 009: Mandatory +91 WhatsApp number verification for customer accounts.
-- Run once in Supabase: SQL Editor -> paste -> Run. Safe to run more than once. Needs 008 first.
-- Codes are sent with the WhatsApp Cloud API "login_code" template by the website's server.

alter table profiles add column if not exists phone_verified_at timestamptz;
-- one verified account per number (unverified rows may share or leave it blank)
create unique index if not exists profiles_verified_phone_uq on profiles(phone) where phone_verified_at is not null;

-- The one live code per customer. Only the code's hash is stored.
create table if not exists phone_otps (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  phone        text not null,
  code_hash    text not null,
  expires_at   timestamptz not null,
  attempts     int  not null default 0,
  sent_at      timestamptz not null default now(),
  sends        int  not null default 1,         -- codes sent since window_start (hourly cap)
  window_start timestamptz not null default now()
);
alter table phone_otps enable row level security;
grant all on phone_otps to service_role;

-- Checks a code atomically (no racing past the 5-try limit) and, on success, saves the number.
-- Returns: ok | no_code | expired | wrong | too_many | taken
create or replace function verify_phone_otp(p_user uuid, p_hash text) returns text
language plpgsql security definer set search_path = public as $$
declare r phone_otps;
begin
  update phone_otps set attempts = attempts + 1 where user_id = p_user and attempts < 5 returning * into r;
  if not found then
    return case when exists (select 1 from phone_otps where user_id = p_user) then 'too_many' else 'no_code' end;
  end if;
  if r.expires_at < now() then return 'expired'; end if;
  if r.code_hash <> p_hash then return case when r.attempts >= 5 then 'too_many' else 'wrong' end; end if;
  begin
    insert into profiles (id, phone, phone_verified_at) values (p_user, r.phone, now())
    on conflict (id) do update set phone = excluded.phone, phone_verified_at = now(), updated_at = now();
  exception when unique_violation then
    delete from phone_otps where user_id = p_user;
    return 'taken';
  end;
  delete from phone_otps where user_id = p_user;
  return 'ok';
end $$;
revoke all on function verify_phone_otp(uuid, text) from public, anon, authenticated;
grant execute on function verify_phone_otp(uuid, text) to service_role;
