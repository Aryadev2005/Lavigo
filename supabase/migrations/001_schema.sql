-- Lavigo schema. Run in Supabase: SQL Editor -> paste -> Run.
-- Design: all WRITES go through the Next.js server using the service-role key
-- (public visitors can never write directly). Anonymous visitors may only READ
-- published content and seat availability.

-- ───────────── destinations (also holds the custom-trip rate card) ─────────────
create table if not exists destinations (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  area          text not null default '',
  blurb         text not null default '',
  hero_image    text,
  gallery       jsonb not null default '[]',            -- [{src, caption}]
  default_nights int  not null default 3,
  theme         jsonb not null default '["#3A0CA3","#4CC9F0","#F1FAEE"]',  -- fallback gradient when no photo
  places        jsonb not null default '[]',            -- ["Pokhara","Kathmandu"]
  rate_budget   int not null default 0,                 -- per room per night
  rate_comfort  int not null default 0,
  rate_premium  int not null default 0,
  travel_train  int not null default 0,                 -- per person from Ranchi
  travel_cab    int not null default 0,
  travel_flight int not null default 0,
  activities    jsonb not null default '[]',            -- [{id,n,p,where}]
  sort_order    int not null default 0,
  published     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ───────────── trips (the group-trip "product", one public page each) ─────────────
create table if not exists trips (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  destination_id uuid references destinations(id) on delete set null,
  title        text not null,
  route        text not null default '',
  summary      text not null default '',
  nights       int  not null check (nights >= 0),
  image        text,
  itinerary    jsonb not null default '[]',             -- [{title, text}]
  inclusions   jsonb not null default '[]',             -- ["Hotel stays"]
  exclusions   jsonb not null default '[]',
  faqs         jsonb not null default '[]',             -- [{q, a}]
  published    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ───────────── departures (a dated batch: price + seats) ─────────────
create table if not exists departures (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references trips(id) on delete cascade,
  depart_date  date not null,
  price        int  not null check (price >= 0),        -- per person, incl. GST (INR)
  seats_total  int  not null check (seats_total >= 0),
  status       text not null default 'open' check (status in ('open','closed')),
  created_at   timestamptz not null default now()
);
create index if not exists departures_trip_idx on departures(trip_id, depart_date);

-- ───────────── bookings (payment-ready) ─────────────
create table if not exists bookings (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  departure_id   uuid not null references departures(id) on delete restrict,
  name           text not null,
  phone          text not null,
  email          text,
  travellers     int  not null check (travellers between 1 and 20),
  other_names    text,
  status         text not null default 'held' check (status in ('held','confirmed','cancelled','expired')),
  hold_expires_at timestamptz,
  amount_total   int  not null,                          -- INR, incl. GST
  amount_advance int  not null,                          -- 25% advance, INR
  amount_paid    int  not null default 0,
  -- Payment fields: unused while payments are handled on WhatsApp. When Razorpay
  -- is switched on, the webhook fills these and calls confirm_booking().
  payment_provider text,
  payment_order_id text,
  payment_id       text,
  payment_status   text not null default 'unpaid' check (payment_status in ('unpaid','partial','paid','refunded')),
  admin_note     text,
  created_at     timestamptz not null default now(),
  confirmed_at   timestamptz,
  cancelled_at   timestamptz
);
create index if not exists bookings_dep_idx    on bookings(departure_id, status);
create index if not exists bookings_phone_idx  on bookings(phone, created_at desc);
create unique index if not exists bookings_order_uidx on bookings(payment_order_id) where payment_order_id is not null;

-- ───────────── seat counting ─────────────
-- A seat is taken by: a confirmed booking, or a held booking whose hold has not expired.
create or replace function seats_taken(p_departure uuid, p_exclude uuid default null)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(travellers), 0)::int
  from bookings
  where departure_id = p_departure
    and (p_exclude is null or id <> p_exclude)
    and (status = 'confirmed' or (status = 'held' and hold_expires_at > now()))
$$;

-- Public, read-only view: departures with live seats-left. Exposes only aggregates.
create or replace view departures_public as
select d.id, d.trip_id, d.depart_date, d.price, d.seats_total, d.status,
       greatest(d.seats_total - seats_taken(d.id), 0) as seats_left
from departures d
join trips t on t.id = d.trip_id and t.published;

-- ───────────── booking code ─────────────
create or replace function new_booking_code() returns text language plpgsql as $$
declare c text; tries int := 0;
begin
  loop
    -- LVG- + 5 hex chars (0/1 swapped to 7/8 so codes are easy to read aloud)
    c := 'LVG-' || translate(upper(substr(replace(gen_random_uuid()::text,'-',''),1,5)), '01', '78');
    exit when not exists (select 1 from bookings where code = c);
    tries := tries + 1;
    if tries > 20 then raise exception 'could_not_generate_code'; end if;
  end loop;
  return c;
end $$;

-- ───────────── create a hold (called by the server only) ─────────────
create or replace function create_hold(
  p_departure uuid, p_name text, p_phone text, p_email text,
  p_travellers int, p_others text, p_hold_minutes int default 1440
) returns bookings language plpgsql security definer set search_path = public as $$
declare d departures%rowtype; left_now int; b bookings%rowtype; recent int; active_holds int;
begin
  if p_travellers is null or p_travellers < 1 or p_travellers > 20 then raise exception 'bad_travellers'; end if;
  if length(trim(coalesce(p_name,''))) < 2 then raise exception 'bad_name'; end if;
  if p_phone !~ '^[6-9][0-9]{9}$' then raise exception 'bad_phone'; end if;

  -- Lock the departure row: concurrent bookings for the same departure queue up here,
  -- which is what makes overselling impossible.
  select * into d from departures where id = p_departure for update;
  if not found then raise exception 'departure_not_found'; end if;
  if d.status <> 'open' then raise exception 'departure_closed'; end if;
  if d.depart_date <= current_date then raise exception 'departure_past'; end if;

  -- Abuse guards: limit how many seats one phone number can block at once.
  select count(*) into active_holds from bookings
    where phone = p_phone and status = 'held' and hold_expires_at > now();
  if active_holds >= 2 then raise exception 'too_many_holds'; end if;
  select count(*) into recent from bookings
    where phone = p_phone and created_at > now() - interval '1 hour';
  if recent >= 4 then raise exception 'rate_limited'; end if;

  left_now := d.seats_total - seats_taken(d.id);
  if left_now < p_travellers then
    raise exception 'not_enough_seats:%', greatest(left_now,0);
  end if;

  insert into bookings(code, departure_id, name, phone, email, travellers, other_names,
                       status, hold_expires_at, amount_total, amount_advance)
  values (new_booking_code(), d.id, trim(p_name), p_phone, nullif(trim(coalesce(p_email,'')),''),
          p_travellers, nullif(trim(coalesce(p_others,'')),''),
          'held', now() + make_interval(mins => p_hold_minutes),
          d.price * p_travellers, round(d.price * p_travellers * 0.25))
  returning * into b;
  return b;
end $$;

-- ───────────── confirm (owner taps Confirm, or payment webhook calls it) ─────────────
create or replace function confirm_booking(
  p_booking uuid, p_amount_paid int default null,
  p_provider text default null, p_order_id text default null, p_payment_id text default null
) returns bookings language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; d departures%rowtype; paid int;
begin
  select * into b from bookings where id = p_booking for update;
  if not found then raise exception 'booking_not_found'; end if;
  if b.status = 'confirmed' then
    -- idempotent: a repeated webhook must not double count
    return b;
  end if;
  if b.status = 'cancelled' then raise exception 'booking_cancelled'; end if;

  select * into d from departures where id = b.departure_id for update;
  -- A lapsed hold can still be confirmed if its seats are still free.
  if d.seats_total - seats_taken(d.id, b.id) < b.travellers then
    raise exception 'seats_gone';
  end if;

  paid := coalesce(p_amount_paid, b.amount_advance);
  update bookings set
      status = 'confirmed', confirmed_at = now(), hold_expires_at = null,
      amount_paid = paid,
      payment_status = case when paid >= amount_total then 'paid' when paid > 0 then 'partial' else 'unpaid' end,
      payment_provider = coalesce(p_provider, payment_provider),
      payment_order_id = coalesce(p_order_id, payment_order_id),
      payment_id       = coalesce(p_payment_id, payment_id)
  where id = b.id returning * into b;
  return b;
end $$;

-- record a later balance payment on a confirmed booking
create or replace function record_payment(p_booking uuid, p_amount int)
returns bookings language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype;
begin
  update bookings set
     amount_paid = least(amount_total, amount_paid + p_amount),
     payment_status = case when amount_paid + p_amount >= amount_total then 'paid' else 'partial' end
  where id = p_booking and status = 'confirmed' returning * into b;
  if not found then raise exception 'booking_not_found'; end if;
  return b;
end $$;

create or replace function cancel_booking(p_booking uuid)
returns bookings language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype;
begin
  update bookings set status = 'cancelled', cancelled_at = now(), hold_expires_at = null
  where id = p_booking and status in ('held','confirmed','expired') returning * into b;
  if not found then raise exception 'booking_not_found'; end if;
  return b;
end $$;

-- housekeeping: mark lapsed holds as expired (seats are already free the moment a hold lapses)
create or replace function expire_holds() returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update bookings set status = 'expired' where status = 'held' and hold_expires_at <= now();
  get diagnostics n = row_count;
  return n;
end $$;

-- ───────────── security ─────────────
alter table destinations enable row level security;
alter table trips        enable row level security;
alter table departures   enable row level security;
alter table bookings     enable row level security;

drop policy if exists "public read destinations" on destinations;
create policy "public read destinations" on destinations for select to anon, authenticated using (published);
drop policy if exists "public read trips" on trips;
create policy "public read trips" on trips for select to anon, authenticated using (published);
drop policy if exists "public read departures" on departures;
create policy "public read departures" on departures for select to anon, authenticated
  using (exists (select 1 from trips t where t.id = trip_id and t.published));
-- bookings: no policy for anon/authenticated => no access. Server (service role) bypasses RLS.

-- Only the server may call the write functions.
revoke all on function create_hold(uuid,text,text,text,int,text,int) from public, anon, authenticated;
revoke all on function confirm_booking(uuid,int,text,text,text)      from public, anon, authenticated;
revoke all on function record_payment(uuid,int)                      from public, anon, authenticated;
revoke all on function cancel_booking(uuid)                          from public, anon, authenticated;
revoke all on function expire_holds()                                from public, anon, authenticated;
revoke all on function new_booking_code()                            from public, anon, authenticated;
grant select on departures_public to anon, authenticated;
grant execute on function seats_taken(uuid, uuid) to anon, authenticated;
