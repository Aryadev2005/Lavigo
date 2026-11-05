// Generates supabase/migrations/002_seed.sql from data/seed.json (single source of truth for sample content).
import fs from 'node:fs'
const seed = JSON.parse(fs.readFileSync('data/seed.json','utf8'))
const q = v => v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g,"''")}'`
const j = v => `'${JSON.stringify(v).replace(/'/g,"''")}'::jsonb`
let sql = '-- Sample content from the prototype. Replace/edit from /admin after launch.\n-- Safe to run once on an empty database.\n\n'
for (const d of seed.destinations) {
  sql += `insert into destinations(slug,name,area,blurb,hero_image,gallery,default_nights,theme,places,rate_budget,rate_comfort,rate_premium,travel_train,travel_cab,travel_flight,activities,sort_order) values (${[q(d.slug),q(d.name),q(d.area),q(d.blurb),q(d.hero_image),j(d.gallery),d.default_nights,j(d.theme),j(d.places),d.rate_budget,d.rate_comfort,d.rate_premium,d.travel_train,d.travel_cab,d.travel_flight,j(d.activities),d.sort_order].join(',')}) on conflict (slug) do nothing;\n`
}
sql += '\n'
for (const t of seed.trips) {
  sql += `insert into trips(slug,destination_id,title,route,summary,nights,image,itinerary,inclusions,exclusions,faqs) values (${q(t.slug)},(select id from destinations where slug=${q(t.destination)}),${[q(t.title),q(t.route),q(t.summary),t.nights,q(t.image),j(t.itinerary),j(t.inclusions),j(t.exclusions),j(t.faqs)].join(',')}) on conflict (slug) do nothing;\n`
}
sql += '\n'
for (const d of seed.departures) {
  sql += `insert into departures(trip_id,depart_date,price,seats_total) select id,${q(d.depart_date)},${d.price},${d.seats_total} from trips where slug=${q(d.trip)} on conflict do nothing;\n`
}
fs.writeFileSync('supabase/migrations/002_seed.sql', sql)
console.log('wrote supabase/migrations/002_seed.sql', sql.length, 'bytes')
