-- 008: Customer accounts, traveller ages, itinerary files, per-trip hotels/cars and the cab for each
-- departure, reviews, enquiries, blog posts and the About page.
-- Run once in Supabase: SQL Editor -> paste -> Run. Safe to run more than once. Needs 005, 006 and 007 first.
-- Everything here is read and written by the website's server with the service role, after it has
-- checked who the visitor is, so the new tables have row-level security on and no public policies
-- (except published blog posts and approved reviews, which anyone may read).

-- ───────────── customer accounts ─────────────
-- One row per signed-in customer (Supabase Auth user). Admins are still decided by ADMIN_EMAILS.
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text not null default '',
  phone       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table profiles enable row level security;

alter table bookings add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists bookings_user_idx on bookings(user_id);

-- ───────────── itineraries the owner uploads ─────────────
alter table trips    add column if not exists itinerary_pdf text;   -- one PDF for everyone on the trip
alter table bookings add column if not exists itinerary_url text;   -- a personal PDF for one booking

-- ───────────── hotels and cars per trip (fall back to the destination's lists when empty) ─────────────
alter table trips add column if not exists hotels jsonb not null default '[]';  -- [{name, place, tier, stars, note, image}]
alter table trips add column if not exists cars   jsonb not null default '[]';  -- [{name, kind, seats, note, image}]
alter table trips add column if not exists kind   text  not null default 'group'; -- 'group' | 'weekend'
do $$ begin
  alter table trips add constraint trips_kind_chk check (kind in ('group','weekend'));
exception when duplicate_object then null; end $$;

-- ───────────── the cab for each departure ─────────────
-- {vehicle, number, driver, driver_phone, pickup, note, image}. Shown to confirmed travellers.
alter table departures add column if not exists cab jsonb not null default '{}';

-- ───────────── travellers: date of birth, age and adult/child ─────────────
-- Each passenger is {name, gender, dob 'YYYY-MM-DD', id_checked boolean}. Age and adult/child are
-- worked out from the date of birth on the day the trip starts.
create or replace function age_on(p_dob date, p_day date) returns int language sql immutable as $$
  select extract(year from age(p_day, p_dob))::int
$$;

create or replace function clean_passengers(p jsonb) returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(
    jsonb_strip_nulls(jsonb_build_object(
      'name', left(trim(e->>'name'), 80),
      'gender', e->>'gender',
      'dob', case when coalesce(e->>'dob','') ~ '^\d{4}-\d{2}-\d{2}$' then e->>'dob' end,
      'id_checked', case when (e->>'id_checked') = 'true' then true end
    )) order by i), '[]'::jsonb)
  from jsonb_array_elements(p) with ordinality as x(e, i)
$$;

-- Website booking for a signed-in customer. Every traveller needs a date of birth; children
-- (age <= p_child_max_age on the start date) pay p_child_factor of the adult price. At least one
-- traveller must be an adult. Seat locking and abuse limits come from create_hold / create_hold_v2.
create or replace function create_hold_v3(
  p_departure uuid, p_user uuid, p_phone text, p_email text, p_passengers jsonb,
  p_ticket_by text, p_from_city text, p_hold_minutes int default 1440,
  p_child_max_age int default 11, p_child_factor numeric default 0.6
) returns bookings language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; d departures%rowtype; e jsonb; dob date; a int; adults int := 0; total numeric := 0;
begin
  if p_user is null then raise exception 'sign_in_required'; end if;
  if p_passengers is null or jsonb_typeof(p_passengers) <> 'array' then raise exception 'bad_travellers'; end if;
  select * into d from departures where id = p_departure;
  if not found then raise exception 'departure_not_found'; end if;

  for e in select * from jsonb_array_elements(p_passengers) loop
    if coalesce(e->>'dob','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'bad_dob'; end if;
    begin dob := (e->>'dob')::date; exception when others then raise exception 'bad_dob'; end;
    if dob > current_date then raise exception 'bad_dob'; end if;
    a := age_on(dob, d.depart_date);
    if a > 110 then raise exception 'bad_dob'; end if;
    if a > p_child_max_age then adults := adults + 1; total := total + d.price;
    else total := total + d.price * p_child_factor; end if;
  end loop;
  if adults = 0 then raise exception 'adult_required'; end if;

  select * into b from create_hold_v2(p_departure, p_phone, p_email, p_passengers, p_ticket_by, p_from_city, p_hold_minutes);
  update bookings set
    user_id = p_user,
    passengers = clean_passengers(p_passengers),
    amount_total = round(total),
    amount_advance = round(round(total) * 0.25)
  where id = b.id returning * into b;
  return b;
end $$;
revoke all on function create_hold_v3(uuid,uuid,text,text,jsonb,text,text,int,int,numeric) from public, anon, authenticated;
grant execute on function create_hold_v3(uuid,uuid,text,text,jsonb,text,text,int,int,numeric) to service_role;
grant execute on function age_on(date,date) to service_role;

-- ───────────── reviews of Lavigo ─────────────
-- Written by signed-in customers. The owner approves them before they appear on the website.
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  booking_id  uuid references bookings(id) on delete set null,
  trip_id     uuid references trips(id) on delete set null,
  name        text not null,
  city        text not null default '',
  rating      int  not null check (rating between 1 and 5),
  title       text not null default '',
  body        text not null,
  status      text not null default 'pending' check (status in ('pending','approved','hidden')),
  reply       text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists reviews_status_idx on reviews(status, created_at desc);
alter table reviews enable row level security;
drop policy if exists "public read approved reviews" on reviews;
create policy "public read approved reviews" on reviews for select to anon, authenticated using (status = 'approved');
grant select on reviews to anon, authenticated;

-- ───────────── enquiries (custom trips, questions) ─────────────
create table if not exists enquiries (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'question' check (kind in ('custom','question','trip')),
  user_id     uuid references auth.users(id) on delete set null,
  trip_id     uuid references trips(id) on delete set null,
  name        text not null,
  phone       text not null,
  email       text,
  message     text not null default '',
  details     jsonb not null default '{}',   -- {destination, start_city, dates, travellers, budget, ...}
  status      text not null default 'new' check (status in ('new','replied','closed')),
  admin_note  text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists enquiries_status_idx on enquiries(status, created_at desc);
alter table enquiries enable row level security;

-- ───────────── blog ─────────────
create table if not exists posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  excerpt       text not null default '',
  cover         text,
  body          text not null default '',           -- paragraphs separated by blank lines; "## " starts a heading
  media         jsonb not null default '[]',        -- [{type: 'photo'|'video', src, poster, caption}]
  place         text not null default '',
  trip_id       uuid references trips(id) on delete set null,
  published     boolean not null default false,
  published_at  date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table posts enable row level security;
drop policy if exists "public read published posts" on posts;
create policy "public read published posts" on posts for select to anon, authenticated using (published);
grant select on posts to anon, authenticated;

grant all on profiles, reviews, enquiries, posts to service_role;

-- Uploads from the admin go straight from the browser to Storage with a signed URL, so videos are
-- not held back by the website's 4.5 MB request limit. Cap single files at 200 MB.
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'file_size_limit') then
    execute 'update storage.buckets set file_size_limit = 209715200 where id = ''media'' and (file_size_limit is null or file_size_limit < 209715200)';
  end if;
end $$;

-- ───────────── first travel story, from the photos and videos of the last Nepal group trip ─────────────
-- Only added once (by slug). Edit or delete it in Admin → Travel stories.
insert into posts (slug, title, excerpt, cover, body, media, place, published, published_at, trip_id)
values (
  'nepal-group-trip-moments',
  'Nepal with the Lavigo group: lakes, temples and a cable car',
  'Photos and short videos from our last Nepal group trip, from the lunch stop in Hetauda to boating on Phewa Lake in Pokhara.',
  '/img/trips/nepal/phewa-group.webp',
  $body$Every Lavigo group trip leaves us with a phone full of moments. These are a few from our last journey to Nepal: the roads, the temples, the lake and the people who made it fun.

## On the road

The drive into Nepal is part of the trip. We stopped for lunch in Hetauda, and by the time the hills started the group already felt like old friends.

## Manakamana

The cable car up to Manakamana is one of the favourite parts of the trip: a long, quiet ride over green hills to the temple at the top.

> The best part of travelling in a group is the moments you never planned.

## Pokhara

In Pokhara we went boating on Phewa Lake, walked up to viewpoints in the morning and tried the sky swing, for those who dared. Gupteshwor Cave and the prayer wheels rounded off the days.

Want to see it for yourself? Our next Nepal departure is open for booking.$body$,
  '[
    {"type":"photo","src":"/img/trips/nepal/hetauda-group.webp","caption":"Lunch stop in Hetauda on the way into Nepal."},
    {"type":"video","src":"/video/cable-car.mp4","poster":"/video/cable-car.webp","caption":"The cable car ride up to Manakamana temple."},
    {"type":"photo","src":"/img/trips/nepal/manakamana-1.webp","caption":"Manakamana temple at the top of the ropeway."},
    {"type":"video","src":"/video/sky-swing.mp4","poster":"/video/sky-swing.webp","caption":"The sky swing: only for the brave ones in the group."},
    {"type":"photo","src":"/img/trips/nepal/phewa-boating.webp","caption":"Boating on Phewa Lake, Pokhara."},
    {"type":"video","src":"/video/prayer-wheels.mp4","poster":"/video/prayer-wheels.webp","caption":"Spinning the prayer wheels."},
    {"type":"photo","src":"/img/trips/nepal/phewa-group.webp","caption":"The whole group with the Lavigo banner at Phewa Lake."}
  ]'::jsonb,
  'Nepal', true, current_date,
  (select id from trips where slug = 'nepal-trip-from-ranchi')
)
on conflict (slug) do nothing;
