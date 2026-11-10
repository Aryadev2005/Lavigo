-- 008: Trip story content (migration 007 schema). One UPDATE per published trip, by slug.
-- Safe to re-run: each statement replaces that trip's story content with the same text.
-- Needs 007_trip_story.sql run first. Run in Supabase: SQL Editor -> paste -> Run.
--
-- Facts the client should confirm before this goes live are listed as TODO(check) in the
-- hand-off notes, not in this copy itself — the copy below stays general wherever a specific
-- number (exact km, exact hours, a named tea estate, etc.) isn't already in Lavigo's own data.

-- ───────────────────────────── Nepal Trip from Ranchi ─────────────────────────────
update trips set
  story = $story$Nepal reaches India by road long before it reaches India by air, and the Lavigo route in from Raxaul keeps that feeling: a border town, a stamp at Birgunj, and then hills that keep climbing until Pokhara opens out around its lake. It is a different way to arrive than flying into Kathmandu, and it sets the tone for the whole trip — Nepal as a place next door, not a place far away.

Pokhara sits on the shore of Phewa Lake, with the Annapurna range standing behind it on a clear morning. Fishtail Mountain (Machhapuchhre) is the one everybody photographs, and Sarangkot, the hill above town, is where the group goes before sunrise to watch the light reach the snow first. The lake itself is unhurried — wooden boats, a small island temple, cafes along the shore — and after the drive in, it is the right place to slow down for a day.

Kathmandu is older again, and denser: a valley of Newar courtyards, brick temples and streets that have been markets for centuries. Pashupatinath stands on the banks of the Bagmati, one of the subcontinent's most important Shiva temples and a working cremation ghat, not a museum piece. Boudhanath's dome and painted eyes watch over a stupa that has been a stop on the Tibetan Buddhist pilgrimage route for generations, and Swayambhunath looks down on the whole valley from its hilltop, prayer flags running down the slope in every direction.

In between the two cities sits Manakamana, a hilltop temple to a wish-fulfilling goddess, reached by a cable car over a river gorge — one of those rare stops that is as much the journey as the destination.$story$,

  highlights = '["Sunrise over the Annapurna range from Sarangkot", "Boating on Phewa Lake", "The Manakamana cable car over the river gorge", "Pashupatinath and the ghats of the Bagmati", "Boudhanath stupa at dusk", "Crossing overland at the Raxaul–Birgunj border"]'::jsonb,

  places = $pl$[
    {"name": "Pokhara", "about": "A lakeside town under the Annapurna range, built around Phewa Lake. Boating, the sunrise view from Sarangkot and a slower pace than Kathmandu are the reasons groups usually enjoy this stop the most."},
    {"name": "Kathmandu", "about": "The valley''s old capital and its living centre of Newar architecture, Hindu and Buddhist shrines side by side. Pashupatinath, Boudhanath and Swayambhunath are all within a short drive of each other, with Thamel nearby for the evening."},
    {"name": "Manakamana", "about": "A hilltop temple reached by cable car between Pokhara and Kathmandu, dedicated to a goddess believed to grant wishes. The ride over the river valley is as memorable as the temple itself."}
  ]$pl$::jsonb,

  good_to_know = $gtk$[
    {"title": "Best time to visit", "text": "October to December and March to May give the clearest mountain views. Winter (December–February) is cold, especially mornings and evenings in Pokhara and at Sarangkot, but skies are usually clear. The monsoon (June–September) brings cloud that can hide the Annapurnas for days."},
    {"title": "Weather and clothing", "text": "Days are mild to warm in Pokhara and Kathmandu outside winter; mornings at Sarangkot before sunrise are genuinely cold. Carry a warm layer even in the plains months, and something warmer for December–February departures."},
    {"title": "Documents", "text": "Indian citizens do not need a visa for Nepal. Carry a passport or voter ID (original, not a photocopy) for every traveller — this is checked at the Raxaul–Birgunj border."},
    {"title": "Currency", "text": "Nepal uses the Nepalese rupee. It is easiest to change some cash at the border or in Pokhara; cards are accepted at larger hotels and shops in Pokhara and Kathmandu but not everywhere."},
    {"title": "Food", "text": "Hotel breakfast and dinner are included on this trip; most lunches on the road are at local restaurants and paid for separately. Nepali thali, momos and Tibetan food are easy to find in both cities."},
    {"title": "Network and SIM", "text": "Indian mobile networks do not work inside Nepal on a normal plan — check international roaming with your operator, or a local Nepali SIM is simple to buy in Pokhara or Kathmandu."},
    {"title": "Walking and altitude", "text": "This is a sightseeing trip, not a trek — walking is gentle (lake paths, temple courtyards, a short climb at Sarangkot). Pokhara and Kathmandu sit at a moderate altitude and altitude sickness is not a concern on this route."}
  ]$gtk$::jsonb,

  things_to_carry = '["Passport or voter ID (original)", "A warm layer, even outside winter", "Comfortable walking shoes", "Sunglasses and a cap for the lake and Sarangkot", "A light rain layer", "Power bank", "Cash in small denominations for the border and local markets"]'::jsonb,

  itinerary = $itin$[
    {
      "title": "Ranchi → Raxaul → Pokhara",
      "description": "The trip starts early from Ranchi, with the group travelling together to Raxaul on the India–Nepal border. The crossing at Birgunj is on foot — passports or voter IDs are checked, and the Lavigo trip leader handles the paperwork for the group.\n\nFrom Birgunj the road climbs steadily into the hills on the way to Pokhara, a long day of travel that is also the most dramatic: plains give way to terraced slopes and river valleys as the altitude rises. The group reaches Pokhara in the evening, with enough time to walk along Phewa Lake before dinner.",
      "highlights": ["Border crossing at Raxaul–Birgunj", "First views of the Nepal hills", "Evening by Phewa Lake"],
      "meals": "B/D",
      "stay": "Pokhara",
      "travel": "Full day overland, Ranchi to Pokhara via the Raxaul–Birgunj border"
    },
    {
      "title": "Pokhara sightseeing",
      "description": "An early start for the sunrise point above Sarangkot, where the Annapurna range and Machhapuchhre catch the first light — on a clear morning this is one of the best mountain views on the whole trip.\n\nBack in Pokhara, the day continues with boating on Phewa Lake, a visit to Davis Falls (where the Pardi stream disappears underground) and the connected Gupteshwor Cave. The evening is free to walk the lakeside road, with its cafes and shops.",
      "highlights": ["Sunrise at Sarangkot", "Boating on Phewa Lake", "Davis Falls and Gupteshwor Cave"],
      "meals": "B/D",
      "stay": "Pokhara",
      "travel": "Local sightseeing around Pokhara"
    },
    {
      "title": "Pokhara → Manakamana → Kathmandu",
      "description": "The group leaves Pokhara for Kathmandu, breaking the drive at Kurintar for the Manakamana cable car — a ride over the river gorge up to the hilltop temple of Manakamana, dedicated to a goddess believed to grant the wishes of true devotees.\n\nAfter the temple, the road continues on to Kathmandu, reaching the city by evening.",
      "highlights": ["Manakamana cable car and temple"],
      "meals": "B/D",
      "stay": "Kathmandu",
      "travel": "Pokhara to Kathmandu, with the Manakamana cable car en route"
    },
    {
      "title": "Kathmandu sightseeing",
      "description": "A full day across the valley's three defining sites: Pashupatinath, on the banks of the Bagmati, one of the most important Shiva temples in the subcontinent and a working cremation ghat; Boudhanath, whose painted dome is a major stop for Tibetan Buddhist pilgrims; and Swayambhunath, on its hilltop above the city, reached by a stepped climb lined with prayer wheels.\n\nThe evening is spent in Thamel, Kathmandu's tourist and shopping quarter, free for the group to explore on their own.",
      "highlights": ["Pashupatinath", "Boudhanath stupa", "Swayambhunath", "Evening in Thamel"],
      "meals": "B/D",
      "stay": "Kathmandu",
      "travel": "Local sightseeing around Kathmandu"
    },
    {
      "title": "Kathmandu → Raxaul → Ranchi",
      "description": "An early departure from Kathmandu for the drive back to the Birgunj–Raxaul border, with the same crossing procedure as the way in. From Raxaul, the group travels back to Ranchi, reaching home by night.",
      "highlights": [],
      "meals": "B",
      "travel": "Full day overland, Kathmandu to Ranchi via the Raxaul–Birgunj border"
    }
  ]$itin$::jsonb
where slug = 'nepal-trip-from-ranchi';


-- ───────────────────────────── Darjeeling Winter Escape ─────────────────────────────
update trips set
  story = $story$Darjeeling earned its name in tea and the British hill-station habit of running uphill from the summer plains, and both are still what the town feels like: steep lanes, old stone buildings, and tea gardens dropping away below the Mall. It sits in the same range as Kanchenjunga, the third-highest mountain in the world, and on a clear morning the whole point of coming here is to watch the sun reach that summit before anything else.

The Darjeeling Himalayan Railway, the "toy train", is the other reason the town is known the way it is — a narrow-gauge line built in the 1880s that still climbs and loops through the town itself, slow enough that you can watch the hillside from the footboard. The Batasia Loop, where the line spirals around a war memorial with the mountains behind it, is the most photographed stretch of track in the hills.

Beyond the town, the hills are planted end to end with tea — Darjeeling tea has its own protected name the way Champagne does, and a short walk through a working garden, with the pickers out on the slopes, is a different pace from the sightseeing in town. Mirik, a short drive further, centres on a quiet lake ringed by pine and cherry trees, a gentler stop to close the trip on.$story$,

  highlights = '["Sunrise over Kanchenjunga from Tiger Hill", "The Darjeeling toy train and the Batasia Loop", "A tea garden walk and tasting", "An evening on the Mall", "Mirik lake"]'::jsonb,

  places = $pl$[
    {"name": "Darjeeling", "about": "A hill station built on a ridge facing Kanchenjunga, known for the toy train, its tea gardens and the Mall, the pedestrian street at its centre. Tiger Hill, just outside town, is the usual sunrise point."},
    {"name": "Mirik", "about": "A smaller, quieter hill town built around Sumendu Lake, ringed by pine and cherry trees. A relaxed stop after the busier sightseeing in Darjeeling."}
  ]$pl$::jsonb,

  good_to_know = $gtk$[
    {"title": "Best time to visit", "text": "March to May and October to December give the clearest views of Kanchenjunga. Winter (December–February) is cold and views can still be excellent, but early mornings are the coldest part of the trip — worth knowing before the Tiger Hill sunrise."},
    {"title": "Weather and clothing", "text": "Darjeeling is noticeably cooler than Ranchi or the plains year-round. Carry woollens for a winter departure, and at least a warm layer at any time of year, especially for the pre-dawn Tiger Hill start."},
    {"title": "Documents", "text": "No special permits are needed for Darjeeling or Mirik — a government photo ID for every traveller is enough, as for any trip within India."},
    {"title": "Currency", "text": "Indian rupees, as anywhere else in India."},
    {"title": "Food", "text": "Hotel breakfast and dinner are included; lunches on the road are at local restaurants, paid for separately. Tibetan and Nepali-influenced food (momos, thukpa) is easy to find alongside Bengali and North Indian options."},
    {"title": "Network and SIM", "text": "Indian mobile networks work normally in Darjeeling and Mirik, though coverage can be patchy on the hill roads between stops."},
    {"title": "Walking and altitude", "text": "Darjeeling sits at a meaningful hill altitude (the town itself is well above sea level, with Tiger Hill higher still), so mornings are cold rather than thin on air — this is a sightseeing trip with easy walking, not a trek."}
  ]$gtk$::jsonb,

  things_to_carry = '["Woollens, especially for mornings", "A warm cap and gloves for the Tiger Hill sunrise", "Comfortable walking shoes", "A light rain layer", "Power bank", "Government photo ID"]'::jsonb,

  itinerary = $itin$[
    {
      "title": "Ranchi → NJP → Darjeeling",
      "description": "The group travels overnight by train from Ranchi to New Jalpaiguri (NJP), the railhead for the Darjeeling hills, arriving the next morning. From NJP it's a drive up into the hills, with the road climbing steadily until Darjeeling itself comes into view.\n\nAfter checking in, the evening is spent on the Mall, Darjeeling's pedestrian promenade, with its shops, cafes and the first proper views over the valley.",
      "highlights": ["Overnight train to NJP", "First drive up into the hills", "Evening on the Mall"],
      "meals": "D",
      "stay": "Darjeeling",
      "travel": "Overnight train Ranchi–NJP, then a hill drive from NJP to Darjeeling"
    },
    {
      "title": "Tiger Hill & toy train",
      "description": "A pre-dawn start for Tiger Hill, the viewpoint above Darjeeling where, on a clear morning, the sun reaches Kanchenjunga before it reaches the town below. It's cold at that hour, even outside winter, so this is the one morning on the trip to dress the warmest.\n\nBack in town, the group rides the Darjeeling Himalayan Railway's toy train on its short joyride route, which takes in the Batasia Loop — a spiral of track around a war memorial, with the mountains as a backdrop.",
      "highlights": ["Sunrise from Tiger Hill", "Toy train joyride", "Batasia Loop"],
      "meals": "B/D",
      "stay": "Darjeeling",
      "travel": "Early drive to Tiger Hill, then local sightseeing in Darjeeling"
    },
    {
      "title": "Tea estates & Mirik",
      "description": "A walk through a working tea garden, with pickers out on the slopes if the season is right, followed by a tasting to see the difference a Darjeeling tea's altitude and flush make.\n\nThe group then drives to Mirik, built around Sumendu Lake and known for its calmer pace — a walk around the lake, framed by pine and cherry trees, closes out the day before the drive back to Darjeeling.",
      "highlights": ["Tea garden walk and tasting", "Mirik lake"],
      "meals": "B/D",
      "stay": "Darjeeling",
      "travel": "Half-day trip to Mirik and back"
    },
    {
      "title": "Darjeeling → NJP → Ranchi",
      "description": "The group drives back down from the hills to NJP, retracing the climb of the first day in reverse, and boards the train home to Ranchi.",
      "highlights": [],
      "meals": "B",
      "travel": "Hill drive Darjeeling to NJP, then train to Ranchi"
    }
  ]$itin$::jsonb
where slug = 'darjeeling-winter-escape';


-- ───────────────────────────── North Sikkim Snow Trip ─────────────────────────────
update trips set
  story = $story$Sikkim is the smallest of the Himalayan states and, by most measures, the best organised for a traveller who wants real mountains without a long trek to reach them. Gangtok, the capital, sits on a ridge with MG Marg, its pedestrian high street, running through the middle — a relaxed town to arrive into before the real climbing starts.

North Sikkim is where the trip earns its name. Tsomgo Lake, a short but steep drive above Gangtok, is frozen for much of the winter and sits close enough to the Tibetan plateau that snow is the default rather than the exception on this route; Baba Mandir, dedicated to a soldier of the Indian Army who is still honoured as a protector of the area, is a short stop on the same road.

Further north again, past Chungthang, is Lachung — a village that is really just the gateway to the Yumthang Valley, known in summer for its rhododendrons and in winter for snow that can close the road for a season at a time. This is a permit area, and the Lavigo trip leader handles the paperwork so the group doesn't have to think about it.

On the way back to Gangtok, the group stops at Rumtek Monastery, one of the most important seats of Tibetan Buddhism outside Tibet itself, with the mountains behind it a last look at the range before the journey home.$story$,

  highlights = '["Tsomgo Lake, usually frozen in winter", "Baba Mandir", "The Yumthang Valley", "A snow point near Lachung, conditions permitting", "Rumtek Monastery", "MG Marg in Gangtok"]'::jsonb,

  places = $pl$[
    {"name": "Gangtok", "about": "Sikkim''s capital, built along a ridge with MG Marg, a pedestrian high street, at its centre. The usual base for both ends of the trip, and the stop for Rumtek Monastery on the way back."},
    {"name": "Tsomgo Lake", "about": "A high-altitude lake a short, steep drive from Gangtok, frozen for much of the winter. Baba Mandir, dedicated to a soldier still honoured as a protector of the area, sits close by on the same road."},
    {"name": "Lachung", "about": "A village in North Sikkim that serves as the gateway to the Yumthang Valley. This is a restricted area and needs a permit, which Lavigo arranges for the group."}
  ]$pl$::jsonb,

  good_to_know = $gtk$[
    {"title": "Best time to visit", "text": "This departure is timed for winter snow in North Sikkim. December to February gives the best chance of snow at Tsomgo Lake and around Lachung, though heavy snowfall can also close the road to Yumthang for a day or more — the itinerary allows for this."},
    {"title": "Weather and clothing", "text": "Genuinely cold: Gangtok is cool, but Tsomgo Lake and Lachung are well below freezing on winter mornings. Heavy woollens, a proper jacket and thermal layers are not optional on this trip."},
    {"title": "Documents", "text": "A Protected Area Permit is required for North Sikkim (Tsomgo Lake and Lachung/Yumthang); this is included and arranged by Lavigo using copies of each traveller's photo ID, so carry a passport or voter ID."},
    {"title": "Currency", "text": "Indian rupees, as anywhere else in India. ATMs are reliable in Gangtok but scarce beyond it, so carry enough cash for North Sikkim before leaving Gangtok."},
    {"title": "Food", "text": "Hotel breakfast and dinner are included; lunches on the road are at local restaurants. Expect simple, hot food in North Sikkim, where the choice of restaurants is more limited than in Gangtok."},
    {"title": "Network and SIM", "text": "Mobile coverage is reliable in Gangtok but patchy to absent in North Sikkim, including Lachung and Yumthang — tell family to expect to be out of reach for a day or two on this leg."},
    {"title": "Altitude and walking", "text": "Tsomgo Lake and the Yumthang area are both at meaningful altitude, enough that mild breathlessness is common; walking itself is easy (short stops by vehicle), but this isn't the trip for anyone who has had serious altitude problems before without checking with a doctor first."}
  ]$gtk$::jsonb,

  things_to_carry = '["Heavy woollens, thermals and a proper winter jacket", "Gloves, a warm cap and woollen socks", "Sturdy, closed walking shoes", "Sunglasses (snow glare)", "Any personal medication, including for altitude if advised by a doctor", "Power bank", "Passport or voter ID for the permit"]'::jsonb,

  itinerary = $itin$[
    {
      "title": "Ranchi → NJP → Gangtok",
      "description": "The group travels by train from Ranchi to NJP, then drives up into the hills to Gangtok. The road gains height steadily, with the Teesta river valley alongside it for much of the way.\n\nThe evening is free to walk MG Marg, Gangtok's pedestrian high street, lined with cafes and shops and usually busy even on a winter evening.",
      "highlights": ["Train to NJP, then the drive up to Gangtok", "Evening on MG Marg"],
      "meals": "D",
      "stay": "Gangtok",
      "travel": "Train Ranchi–NJP, then a hill drive from NJP to Gangtok"
    },
    {
      "title": "Tsomgo Lake & Baba Mandir",
      "description": "A permit-only road climbs from Gangtok to Tsomgo Lake, frozen over for much of the winter and sitting close enough to the Tibetan plateau that the landscape turns properly alpine. Baba Mandir, a short stop further along the same road, is dedicated to a soldier of the Indian Army still honoured by troops posted in the area.\n\nThe group returns to Gangtok for the night.",
      "highlights": ["Tsomgo Lake, frozen in winter", "Baba Mandir"],
      "meals": "B/D",
      "stay": "Gangtok",
      "travel": "Day trip from Gangtok to Tsomgo Lake and back"
    },
    {
      "title": "Gangtok → Lachung",
      "description": "The drive north to Lachung passes a string of waterfalls along the way, with the valley narrowing and the road climbing in stages. Lachung itself is a small village that exists mainly to serve travellers heading further into the Yumthang area.",
      "highlights": ["Waterfalls on the road north"],
      "meals": "B/D",
      "stay": "Lachung",
      "travel": "Gangtok to Lachung, a full day on hill roads"
    },
    {
      "title": "Yumthang Valley",
      "description": "A morning drive from Lachung into the Yumthang Valley, known for rhododendrons in spring and, on this winter departure, for snow instead. Conditions permitting, the group continues toward the snow point beyond Yumthang; when the road is closed by snowfall, the valley itself is still the highlight of the day.",
      "highlights": ["Yumthang Valley", "Snow point beyond Yumthang, conditions permitting"],
      "meals": "B/D",
      "stay": "Lachung",
      "travel": "Day trip from Lachung into the Yumthang Valley"
    },
    {
      "title": "Lachung → Gangtok",
      "description": "The group drives back from Lachung to Gangtok, breaking the return at Rumtek Monastery — one of the most important seats of Tibetan Buddhism outside Tibet, with the Sikkim hills as a backdrop.",
      "highlights": ["Rumtek Monastery"],
      "meals": "B/D",
      "stay": "Gangtok",
      "travel": "Lachung to Gangtok, with a stop at Rumtek"
    },
    {
      "title": "Gangtok → NJP → Ranchi",
      "description": "An early drive down from Gangtok to NJP, then the train journey home to Ranchi.",
      "highlights": [],
      "meals": "B",
      "travel": "Hill drive Gangtok to NJP, then train to Ranchi"
    }
  ]$itin$::jsonb
where slug = 'north-sikkim-snow-trip';


-- ───────────────────────────── Netarhat Weekend ─────────────────────────────
update trips set
  story = $story$Netarhat is the trip for a weekend that doesn't need a passport or a long train ride — a plateau in Jharkhand's own hills, a few hours out of Ranchi, known locally as the "Queen of Chotanagpur". It's a small, quiet hill station rather than a big destination, which is exactly its appeal for a short break.

Magnolia Point is where the group goes for sunset, a viewpoint over the forested valley below that has been Netarhat's signature view for generations of Jharkhand travellers. There's a matching sunrise point on the other side of the plateau for the following morning, a quieter, cooler start to the day.

The falls are the other reason to come: Lodh Falls, usually cited as Jharkhand's highest waterfall, and Upper Ghaghri Falls, both set in forest a short drive from the main town. Neither needs a long walk to reach, which keeps this trip easy even as a weekend plan.$story$,

  highlights = '["Sunset at Magnolia Point", "Sunrise point the next morning", "Lodh Falls", "Upper Ghaghri Falls"]'::jsonb,

  places = $pl$[
    {"name": "Netarhat", "about": "A plateau hill station in Jharkhand, known locally as the Queen of Chotanagpur. Magnolia Point and the sunrise point are its best-known viewpoints, with Lodh Falls and Upper Ghaghri Falls a short drive away."}
  ]$pl$::jsonb,

  good_to_know = $gtk$[
    {"title": "Best time to visit", "text": "October to February is the most pleasant, cool weather for a weekend break. The monsoon (June–September) makes the plateau lush and the falls fuller, but the roads can be slippery."},
    {"title": "Weather and clothing", "text": "Noticeably cooler than Ranchi, especially at the sunset and sunrise points — a light-to-medium jacket is enough for most of the year, warmer for a winter weekend."},
    {"title": "Documents", "text": "No special permits are needed — a government photo ID for every traveller, as for any trip within India."},
    {"title": "Currency", "text": "Indian rupees, as anywhere else in India. Netarhat is a small town, so it's worth carrying enough cash rather than relying on card payments or ATMs."},
    {"title": "Food", "text": "All meals are included on this trip — simple, home-style food is the norm in Netarhat rather than a wide choice of restaurants."},
    {"title": "Network and SIM", "text": "Indian mobile networks work in Netarhat town, though coverage can thin out on the roads to the falls and viewpoints."},
    {"title": "Walking and altitude", "text": "Easy walking throughout — short stops at viewpoints and waterfalls rather than any trekking. Not a high-altitude destination."}
  ]$gtk$::jsonb,

  things_to_carry = '["A light-to-medium jacket", "Comfortable walking shoes", "A torch for the sunset/sunrise points", "Government photo ID", "Personal toiletries"]'::jsonb,

  itinerary = $itin$[
    {
      "title": "Ranchi → Netarhat",
      "description": "A morning drive from Ranchi up onto the Netarhat plateau, reaching the hill station by afternoon. After checking in, the group heads out for sunset at Magnolia Point, the classic Netarhat view over the forested valley below.",
      "highlights": ["Drive up to the Netarhat plateau", "Sunset at Magnolia Point"],
      "meals": "L/D",
      "stay": "Netarhat",
      "travel": "Morning drive from Ranchi to Netarhat"
    },
    {
      "title": "Falls day",
      "description": "A day given over to Netarhat's two best-known waterfalls: Lodh Falls, usually cited as the highest in Jharkhand, and Upper Ghaghri Falls, both reached by a short drive and a short walk through forest.",
      "highlights": ["Lodh Falls", "Upper Ghaghri Falls"],
      "meals": "B/L/D",
      "stay": "Netarhat",
      "travel": "Local day trip to both waterfalls"
    },
    {
      "title": "Sunrise & back to Ranchi",
      "description": "An early start for Netarhat's sunrise point, a quieter counterpart to Magnolia Point on the other side of the plateau, before the group packs up and drives back to Ranchi.",
      "highlights": ["Sunrise point"],
      "meals": "B/L",
      "travel": "Morning drive back from Netarhat to Ranchi"
    }
  ]$itin$::jsonb
where slug = 'netarhat-weekend';
