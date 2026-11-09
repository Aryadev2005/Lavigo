-- 005: All-India trips, traveller genders, ticket choice, hotels and cars.
-- Run once in Supabase: SQL Editor -> paste -> Run. Safe to run more than once.
-- The website keeps working before this runs; these features switch on after it.

-- ───────────── hotels and cars per destination ─────────────
alter table destinations add column if not exists hotels jsonb not null default '[]';  -- [{name, place, tier, stars, note}]
alter table destinations add column if not exists cars   jsonb not null default '[]';  -- [{name, kind, seats, note}]

-- ───────────── where each group departure starts ─────────────
alter table departures add column if not exists start_city text not null default 'Ranchi';

-- departures_public gains start_city (new columns go at the end of the view)
create or replace view departures_public as
select d.id, d.trip_id, d.depart_date, d.price, d.seats_total, d.status,
       greatest(d.seats_total - seats_taken(d.id), 0) as seats_left,
       d.start_city
from departures d
join trips t on t.id = d.trip_id and t.published;
grant select on departures_public to anon, authenticated;

-- ───────────── travellers, genders and tickets on each booking ─────────────
alter table bookings add column if not exists passengers jsonb not null default '[]';   -- [{name, gender}]
alter table bookings add column if not exists ticket_by  text  not null default 'agency';
alter table bookings add column if not exists from_city  text;
do $$ begin
  alter table bookings add constraint bookings_ticket_by_chk check (ticket_by in ('agency','self'));
exception when duplicate_object then null; end $$;

-- create_hold_v2: same seat locking and abuse limits as create_hold, plus one
-- {name, gender} entry per traveller and who books the train/flight tickets.
create or replace function create_hold_v2(
  p_departure uuid, p_phone text, p_email text, p_passengers jsonb,
  p_ticket_by text, p_from_city text, p_hold_minutes int default 1440
) returns bookings language plpgsql security definer set search_path = public as $$
declare b bookings%rowtype; n int; p jsonb; others text;
begin
  if p_passengers is null or jsonb_typeof(p_passengers) <> 'array' then raise exception 'bad_travellers'; end if;
  n := jsonb_array_length(p_passengers);
  if n < 1 or n > 20 then raise exception 'bad_travellers'; end if;
  for p in select * from jsonb_array_elements(p_passengers) loop
    if length(trim(coalesce(p->>'name',''))) < 2 then raise exception 'bad_name'; end if;
    if coalesce(p->>'gender','') not in ('male','female') then raise exception 'bad_gender'; end if;
  end loop;
  if coalesce(p_ticket_by,'') not in ('agency','self') then raise exception 'bad_ticket_by'; end if;

  select string_agg(trim(e->>'name') || ' (' || initcap(e->>'gender') || ')', ', ' order by i)
    into others from jsonb_array_elements(p_passengers) with ordinality as x(e, i) where i > 1;

  select * into b from create_hold(p_departure, trim(p_passengers->0->>'name'), p_phone, p_email, n, others, p_hold_minutes);

  update bookings set
    passengers = (select jsonb_agg(jsonb_build_object('name', left(trim(e->>'name'), 80), 'gender', e->>'gender') order by i)
                  from jsonb_array_elements(p_passengers) with ordinality as x(e, i)),
    ticket_by  = p_ticket_by,
    from_city  = nullif(left(trim(coalesce(p_from_city,'')), 60), '')
  where id = b.id returning * into b;
  return b;
end $$;
revoke all on function create_hold_v2(uuid,text,text,jsonb,text,text,int) from public, anon, authenticated;

-- ───────────── starting hotel and car lists (only fills destinations that have none yet) ─────────────
update destinations set hotels = '[{"name":"Lakeside guesthouse","place":"Pokhara","tier":"budget","stars":2,"note":"Walk to Phewa Lake, hot water, Wi-Fi"},{"name":"Lakeside hotel","place":"Pokhara","tier":"comfort","stars":3,"note":"Lake or garden view rooms, breakfast buffet"},{"name":"Lake-view resort","place":"Pokhara","tier":"premium","stars":4,"note":"Mountain-facing rooms, pool, spa"},{"name":"Thamel guesthouse","place":"Kathmandu","tier":"budget","stars":2,"note":"Central Thamel, walk to shops and cafes"},{"name":"Thamel hotel","place":"Kathmandu","tier":"comfort","stars":3,"note":"Quiet lane in Thamel, rooftop restaurant"},{"name":"Heritage boutique hotel","place":"Kathmandu","tier":"premium","stars":4,"note":"Courtyard rooms, garden, airport transfers"}]'::jsonb where slug = 'nepal' and hotels = '[]'::jsonb;
update destinations set cars = '[{"name":"Toyota Hiace","kind":"Van","seats":12,"note":"Group transfers and the Pokhara–Kathmandu drive"},{"name":"Mahindra Scorpio","kind":"SUV","seats":6,"note":"Hill roads and sunrise point"},{"name":"Hyundai sedan","kind":"Sedan","seats":4,"note":"City sightseeing for couples"}]'::jsonb where slug = 'nepal' and cars = '[]'::jsonb;
update destinations set hotels = '[{"name":"Mall Road homestay","place":"Darjeeling","tier":"budget","stars":2,"note":"Near the Mall, heaters in winter"},{"name":"Hill-view hotel","place":"Darjeeling","tier":"comfort","stars":3,"note":"Kanchenjunga-view rooms, 5 minutes to the Mall"},{"name":"Colonial heritage hotel","place":"Darjeeling","tier":"premium","stars":4,"note":"Fireplace rooms, high tea, valley views"}]'::jsonb where slug = 'darjeeling' and hotels = '[]'::jsonb;
update destinations set cars = '[{"name":"Tata Sumo / Mahindra Bolero","kind":"Hill jeep","seats":9,"note":"NJP pick-up and Tiger Hill"},{"name":"Toyota Innova Crysta","kind":"SUV","seats":6,"note":"Private sightseeing"},{"name":"Swift Dzire","kind":"Sedan","seats":4,"note":"Couples and small families"}]'::jsonb where slug = 'darjeeling' and cars = '[]'::jsonb;
update destinations set hotels = '[{"name":"MG Marg guesthouse","place":"Gangtok","tier":"budget","stars":2,"note":"Walk to MG Marg"},{"name":"Gangtok city hotel","place":"Gangtok","tier":"comfort","stars":3,"note":"Valley-view rooms, lift, room heaters"},{"name":"Mountain-view resort","place":"Gangtok","tier":"premium","stars":4,"note":"Kanchenjunga views, spa, restaurant"},{"name":"Lachung lodge","place":"Lachung","tier":"budget","stars":2,"note":"Simple rooms, hot meals, heaters"},{"name":"Lachung riverside hotel","place":"Lachung","tier":"comfort","stars":3,"note":"River-facing rooms, heated blankets"},{"name":"Lachung valley resort","place":"Lachung","tier":"premium","stars":4,"note":"Cottages with valley views"}]'::jsonb where slug = 'sikkim' and hotels = '[]'::jsonb;
update destinations set cars = '[{"name":"Mahindra Xylo / Bolero","kind":"Hill SUV","seats":7,"note":"North Sikkim permit vehicle"},{"name":"Toyota Innova Crysta","kind":"SUV","seats":6,"note":"Gangtok sightseeing and NJP transfers"},{"name":"Tempo Traveller","kind":"Mini coach","seats":12,"note":"Large groups on the NJP road"}]'::jsonb where slug = 'sikkim' and cars = '[]'::jsonb;
update destinations set hotels = '[{"name":"Forest-side guesthouse","place":"Netarhat","tier":"budget","stars":2,"note":"Walk to the sunset point"},{"name":"Plateau hotel","place":"Netarhat","tier":"comfort","stars":3,"note":"Garden, bonfire area, home-style meals"},{"name":"Netarhat cottage resort","place":"Netarhat","tier":"premium","stars":3,"note":"Private cottages among the pines"}]'::jsonb where slug = 'netarhat' and hotels = '[]'::jsonb;
update destinations set cars = '[{"name":"Toyota Innova Crysta","kind":"SUV","seats":6,"note":"AC, door-to-door from Ranchi"},{"name":"Tempo Traveller","kind":"Mini coach","seats":12,"note":"Group departures"},{"name":"Swift Dzire","kind":"Sedan","seats":4,"note":"Couples"}]'::jsonb where slug = 'netarhat' and cars = '[]'::jsonb;
update destinations set hotels = '[{"name":"Swargadwar beach lodge","place":"Puri","tier":"budget","stars":2,"note":"Near the beach and the temple road"},{"name":"Sea-facing hotel","place":"Puri","tier":"comfort","stars":3,"note":"Sea-view rooms, restaurant"},{"name":"Beach resort","place":"Puri","tier":"premium","stars":4,"note":"Pool, private beach access"}]'::jsonb where slug = 'puri' and hotels = '[]'::jsonb;
update destinations set cars = '[{"name":"Toyota Innova Crysta","kind":"SUV","seats":6,"note":"Konark and Chilika day trips"},{"name":"Swift Dzire","kind":"Sedan","seats":4,"note":"Temple and city runs"},{"name":"Tempo Traveller","kind":"Mini coach","seats":12,"note":"Large families and groups"}]'::jsonb where slug = 'puri' and cars = '[]'::jsonb;
update destinations set hotels = '[{"name":"Baga/Calangute guesthouse","place":"North Goa","tier":"budget","stars":2,"note":"5 minutes to the beach"},{"name":"North Goa hotel","place":"North Goa","tier":"comfort","stars":3,"note":"Pool, near Candolim beach"},{"name":"Beachfront resort","place":"South Goa","tier":"premium","stars":5,"note":"On the beach, pools and spa"}]'::jsonb where slug = 'goa' and hotels = '[]'::jsonb;
update destinations set cars = '[{"name":"Toyota Innova Crysta","kind":"SUV","seats":6,"note":"Airport transfers and sightseeing"},{"name":"Swift Dzire","kind":"Sedan","seats":4,"note":"Couples"},{"name":"Tempo Traveller","kind":"Mini coach","seats":12,"note":"Groups"}]'::jsonb where slug = 'goa' and cars = '[]'::jsonb;
