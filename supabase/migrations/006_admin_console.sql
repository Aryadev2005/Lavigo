-- 006: Admin console. Payment log, owner-made bookings, editing bookings (travellers, genders,
-- discounts), extending holds, trip photo galleries and editable site content.
-- Run once in Supabase: SQL Editor -> paste -> Run. Safe to run more than once. Needs 005 first.

-- ───────────── bookings: where it came from ─────────────
alter table bookings add column if not exists source text not null default 'website';
do $$ begin
  alter table bookings add constraint bookings_source_chk check (source in ('website','admin'));
exception when duplicate_object then null; end $$;

-- ───────────── payment log: every amount the owner records ─────────────
create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  amount      int  not null,                       -- INR; negative = refund
  method      text not null default 'upi' check (method in ('upi','cash','bank','card','other')),
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists payments_booking_idx on payments(booking_id, created_at);
alter table payments enable row level security;   -- no policies: only the server (service role) can read or write
revoke all on payments from anon, authenticated;

-- ───────────── trips: own photo gallery (falls back to the destination's photos) ─────────────
alter table trips add column if not exists gallery jsonb not null default '[]';   -- [{src, caption}]
-- itinerary days may now carry an "image" key: [{title, text, image}]

-- ───────────── editable site content ─────────────
create table if not exists site_settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table site_settings enable row level security;
drop policy if exists "public read site settings" on site_settings;
create policy "public read site settings" on site_settings for select to anon, authenticated using (true);
grant select on site_settings to anon, authenticated;

-- ───────────── helpers ─────────────
create or replace function pay_status(p_paid int, p_total int) returns text language sql immutable as $$
  select case when p_paid >= p_total and p_total > 0 then 'paid' when p_paid > 0 then 'partial' else 'unpaid' end
$$;

create or replace function check_passengers(p jsonb) returns int language plpgsql immutable as $$
declare e jsonb; n int;
begin
  if p is null or jsonb_typeof(p) <> 'array' then raise exception 'bad_travellers'; end if;
  n := jsonb_array_length(p);
  if n < 1 or n > 20 then raise exception 'bad_travellers'; end if;
  for e in select * from jsonb_array_elements(p) loop
    if length(trim(coalesce(e->>'name',''))) < 2 then raise exception 'bad_name'; end if;
    if coalesce(e->>'gender','') not in ('male','female') then raise exception 'bad_gender'; end if;
  end loop;
  return n;
end $$;

create or replace function clean_passengers(p jsonb) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(jsonb_build_object('name', left(trim(e->>'name'), 80), 'gender', e->>'gender') order by i), '[]'::jsonb)
  from jsonb_array_elements(p) with ordinality as x(e, i)
$$;

-- ───────────── owner creates a booking (phone call, walk-in, office) ─────────────
-- Same seat lock as the website, but no per-phone limits. Can be confirmed straight away,
-- and the per-person price can be set (for a negotiated rate).
create or replace function admin_create_booking(
  p_departure uuid, p_phone text, p_email text, p_passengers jsonb,
  p_ticket_by text, p_from_city text, p_note text,
  p_confirm boolean default false, p_amount_paid int default 0, p_method text default 'upi',
  p_price_per_person int default null, p_hold_minutes int default 1440
) returns bookings language plpgsql security definer set search_path = public as $$
declare d departures%rowtype; b bookings%rowtype; n int; price int; left_now int; others text;
begin
  n := check_passengers(p_passengers);
  if p_phone !~ '^[6-9][0-9]{9}$' then raise exception 'bad_phone'; end if;
  if coalesce(p_ticket_by,'') not in ('agency','self') then raise exception 'bad_ticket_by'; end if;
  if coalesce(p_amount_paid,0) < 0 then raise exception 'bad_amount'; end if;

  select * into d from departures where id = p_departure for update;
  if not found then raise exception 'departure_not_found'; end if;
  if d.depart_date < current_date then raise exception 'departure_past'; end if;
  left_now := d.seats_total - seats_taken(d.id);
  if left_now < n then raise exception 'not_enough_seats:%', greatest(left_now, 0); end if;

  price := coalesce(p_price_per_person, d.price);
  if price < 0 then raise exception 'bad_amount'; end if;
  select string_agg(trim(e->>'name') || ' (' || initcap(e->>'gender') || ')', ', ' order by i)
    into others from jsonb_array_elements(p_passengers) with ordinality as x(e, i) where i > 1;

  insert into bookings(code, departure_id, name, phone, email, travellers, other_names, status, hold_expires_at,
                       amount_total, amount_advance, passengers, ticket_by, from_city, admin_note, source)
  values (new_booking_code(), d.id, left(trim(p_passengers->0->>'name'), 80), p_phone, nullif(trim(coalesce(p_email,'')),''), n, others,
          'held', now() + make_interval(mins => p_hold_minutes),
          price * n, round(price * n * 0.25), clean_passengers(p_passengers), p_ticket_by,
          nullif(left(trim(coalesce(p_from_city,'')), 60), ''), nullif(trim(coalesce(p_note,'')), ''), 'admin')
  returning * into b;

  if p_confirm then
    update bookings set status = 'confirmed', confirmed_at = now(), hold_expires_at = null,
      amount_paid = least(coalesce(p_amount_paid,0), amount_total),
      payment_status = pay_status(least(coalesce(p_amount_paid,0), amount_total), amount_total)
    where id = b.id returning * into b;
    if coalesce(p_amount_paid,0) > 0 then
      insert into payments(booking_id, amount, method, note) values (b.id, p_amount_paid, coalesce(p_method,'upi'), 'Recorded when the booking was made');
    end if;
  end if;
  return b;
end $$;

-- ───────────── owner confirms a held (or lapsed) booking and logs what was received ─────────────
create or replace function admin_confirm(p_booking uuid, p_amount int, p_method text default 'upi', p_note text default null)
returns bookings language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype;
begin
  if coalesce(p_amount,0) < 0 then raise exception 'bad_amount'; end if;
  select * into b from bookings where id = p_booking;
  if not found then raise exception 'booking_not_found'; end if;
  if b.status = 'confirmed' then raise exception 'already_confirmed'; end if;
  select * into b from confirm_booking(p_booking, least(b.amount_paid + coalesce(p_amount,0), b.amount_total));
  if coalesce(p_amount,0) > 0 then
    insert into payments(booking_id, amount, method, note) values (b.id, p_amount, coalesce(p_method,'upi'), nullif(trim(coalesce(p_note,'')),''));
  end if;
  return b;
end $$;

-- ───────────── log a payment (or a refund, as a negative amount) ─────────────
create or replace function add_payment(p_booking uuid, p_amount int, p_method text default 'upi', p_note text default null)
returns bookings language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; paid int;
begin
  if p_amount is null or p_amount = 0 then raise exception 'bad_amount'; end if;
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.status not in ('confirmed','cancelled') then raise exception 'not_confirmed'; end if;
  if b.status = 'cancelled' and p_amount > 0 then raise exception 'not_confirmed'; end if;
  paid := b.amount_paid + p_amount;
  if paid < 0 then raise exception 'refund_too_large'; end if;
  if b.status = 'confirmed' and paid > b.amount_total then raise exception 'overpaid:%', b.amount_total - b.amount_paid; end if;
  update bookings set amount_paid = paid,
    payment_status = case when p_amount < 0 and paid = 0 then 'refunded' else pay_status(paid, amount_total) end
  where id = b.id returning * into b;
  insert into payments(booking_id, amount, method, note) values (b.id, p_amount, coalesce(p_method,'upi'), nullif(trim(coalesce(p_note,'')),''));
  return b;
end $$;

-- ───────────── give a held or lapsed booking more time ─────────────
create or replace function extend_hold(p_booking uuid, p_hours int default 24)
returns bookings language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; d departures%rowtype;
begin
  if p_hours is null or p_hours < 1 or p_hours > 24 * 14 then raise exception 'bad_hours'; end if;
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.status not in ('held','expired') then raise exception 'not_held'; end if;
  select * into d from departures where id = b.departure_id for update;
  if d.seats_total - seats_taken(d.id, b.id) < b.travellers then raise exception 'seats_gone'; end if;
  update bookings set status = 'held',
    hold_expires_at = greatest(coalesce(hold_expires_at, now()), now()) + make_interval(hours => p_hours)
  where id = b.id returning * into b;
  return b;
end $$;

-- ───────────── edit a booking: contact, travellers (names, genders, count), tickets, price, note ─────────────
-- Changing the number of travellers re-checks seats. The total keeps the booking's per-person price
-- unless a new total is given (for a discount). The advance is recalculated at 25% of the total.
create or replace function update_booking(
  p_booking uuid, p_phone text, p_email text, p_passengers jsonb,
  p_ticket_by text, p_from_city text, p_note text, p_amount_total int default null
) returns bookings language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; d departures%rowtype; n int; per int; total int; others text;
begin
  n := check_passengers(p_passengers);
  if p_phone !~ '^[6-9][0-9]{9}$' then raise exception 'bad_phone'; end if;
  if coalesce(p_ticket_by,'') not in ('agency','self') then raise exception 'bad_ticket_by'; end if;
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.status = 'cancelled' then raise exception 'booking_cancelled'; end if;

  if n <> b.travellers and (b.status = 'confirmed' or (b.status = 'held' and b.hold_expires_at > now())) then
    select * into d from departures where id = b.departure_id for update;
    if d.seats_total - seats_taken(d.id, b.id) < n then
      raise exception 'not_enough_seats:%', greatest(d.seats_total - seats_taken(d.id, b.id), 0);
    end if;
  end if;

  per := round(b.amount_total::numeric / b.travellers);
  total := coalesce(p_amount_total, case when n = b.travellers then b.amount_total else per * n end);
  if total < 0 then raise exception 'bad_amount'; end if;
  if total < b.amount_paid then raise exception 'total_below_paid:%', b.amount_paid; end if;
  select string_agg(trim(e->>'name') || ' (' || initcap(e->>'gender') || ')', ', ' order by i)
    into others from jsonb_array_elements(p_passengers) with ordinality as x(e, i) where i > 1;

  update bookings set
    name = left(trim(p_passengers->0->>'name'), 80), phone = p_phone, email = nullif(trim(coalesce(p_email,'')),''),
    travellers = n, passengers = clean_passengers(p_passengers), other_names = others,
    ticket_by = p_ticket_by, from_city = nullif(left(trim(coalesce(p_from_city,'')), 60), ''),
    admin_note = nullif(trim(coalesce(p_note,'')), ''),
    amount_total = total, amount_advance = round(total * 0.25),
    payment_status = case when status = 'confirmed' then pay_status(amount_paid, total) else payment_status end
  where id = b.id returning * into b;
  return b;
end $$;

-- ───────────── move a booking to another departure (date change) ─────────────
create or replace function move_booking(p_booking uuid, p_departure uuid)
returns bookings language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; d departures%rowtype;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.status = 'cancelled' then raise exception 'booking_cancelled'; end if;
  if b.departure_id = p_departure then return b; end if;
  select * into d from departures where id = p_departure for update;
  if not found then raise exception 'departure_not_found'; end if;
  if d.depart_date < current_date then raise exception 'departure_past'; end if;
  if d.seats_total - seats_taken(d.id) < b.travellers then
    raise exception 'not_enough_seats:%', greatest(d.seats_total - seats_taken(d.id), 0);
  end if;
  update bookings set departure_id = d.id where id = b.id returning * into b;
  return b;
end $$;

revoke all on function admin_create_booking(uuid,text,text,jsonb,text,text,text,boolean,int,text,int,int) from public, anon, authenticated;
revoke all on function admin_confirm(uuid,int,text,text) from public, anon, authenticated;
revoke all on function add_payment(uuid,int,text,text) from public, anon, authenticated;
revoke all on function extend_hold(uuid,int) from public, anon, authenticated;
revoke all on function update_booking(uuid,text,text,jsonb,text,text,text,int) from public, anon, authenticated;
revoke all on function move_booking(uuid,uuid) from public, anon, authenticated;
grant execute on function admin_create_booking(uuid,text,text,jsonb,text,text,text,boolean,int,text,int,int), admin_confirm(uuid,int,text,text),
  add_payment(uuid,int,text,text), extend_hold(uuid,int), update_booking(uuid,text,text,jsonb,text,text,text,int), move_booking(uuid,uuid) to service_role;
grant all on payments, site_settings to service_role;

-- payments already recorded before this update: one log line per confirmed booking
insert into payments(booking_id, amount, method, note, created_at)
select b.id, b.amount_paid, 'other', 'Recorded before the payment log existed', coalesce(b.confirmed_at, b.created_at)
from bookings b
where b.amount_paid > 0 and not exists (select 1 from payments p where p.booking_id = b.id);
