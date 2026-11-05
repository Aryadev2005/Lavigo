-- Fix for departures duplicated by running the seed twice, and make it impossible to repeat.
-- Safe to run more than once. Bookings on a duplicate are moved to the departure we keep.
with ranked as (
  select id, first_value(id) over (partition by trip_id, depart_date order by created_at, id) as keep_id
  from departures
)
update bookings b set departure_id = r.keep_id
from ranked r where b.departure_id = r.id and r.id <> r.keep_id;

delete from departures d using (
  select id, first_value(id) over (partition by trip_id, depart_date order by created_at, id) as keep_id from departures
) r where d.id = r.id and r.id <> r.keep_id;

create unique index if not exists departures_trip_date_uidx on departures(trip_id, depart_date);
