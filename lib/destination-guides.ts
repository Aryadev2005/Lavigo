// Written guides for each destination page (/destinations/[slug]).
// The admin panel holds the live parts (name, blurb, photos, activities, hotels, trips, prices);
// this file holds the travel guide text that changes rarely: when to go, how to get there,
// what to see, documents. A destination added in the admin panel without an entry here still
// gets a page, built from its admin data alone.
//
// Keep facts conservative and general. Rules that can change (ID documents, permits) say so and
// point travellers to Lavigo to confirm before they travel.

export type Season = { label: string; months: string; text: string }
export type Place = { name: string; about: string }
export type Guide = {
  /** <title> for the page, without the brand (about 60 characters including " | Lavigo") */
  title: string
  /** meta description, about 150 characters */
  description: string
  /** the H1 */
  h1: string
  intro: string[]
  bestTime: Season[]
  bestTimeShort: string
  gettingThere: string[]
  places: Place[]
  goodToKnow: { title: string; text: string }[]
  faqs: { q: string; a: string }[]
}

export const GUIDES: Record<string, Guide> = {
  nepal: {
    title: 'Nepal Tour Package from Ranchi: Pokhara & Kathmandu',
    description: 'Nepal group trips from Ranchi to Pokhara, Manakamana and Kathmandu, plus private Nepal tours from any city. Best time, documents, places and prices.',
    h1: 'Nepal trips from Ranchi',
    intro: [
      'Nepal is the easiest foreign trip for Indian travellers: no visa, no flight needed, and the Himalaya in view from the hotel window. Our group trips leave Ranchi by road, cross the border at Raxaul, and take in Pokhara, the Manakamana cable car and Kathmandu.',
      'Pokhara is the slow half of the trip: boating on Phewa Lake, an early drive up to Sarangkot for sunrise on the Annapurna range, caves and waterfalls. Kathmandu is the busy half, with the temples and stupas the valley is known for.',
    ],
    bestTimeShort: 'Oct to Nov, Mar to May',
    bestTime: [
      { label: 'Autumn', months: 'October to November', text: 'The clearest mountain views of the year, dry roads and comfortable days. The busiest season, so seats fill early.' },
      { label: 'Spring', months: 'March to May', text: 'Warm days and rhododendrons in bloom. Afternoons can be hazy, so go to viewpoints early.' },
      { label: 'Winter', months: 'December to February', text: 'Cold mornings and nights, but often crisp, clear skies. Pack proper warm layers.' },
      { label: 'Monsoon', months: 'June to September', text: 'Green and quiet, but clouds hide the peaks and landslides can slow the roads.' },
    ],
    gettingThere: [
      'Our group trips go overland: from Ranchi to the border at Raxaul (Bihar), across to Birgunj, then by road through the hills to Pokhara and on to Kathmandu.',
      'On a private trip you can also fly into Kathmandu from cities such as Delhi, Kolkata and Varanasi, and we plan the rest from there.',
    ],
    places: [
      { name: 'Phewa Lake, Pokhara', about: 'Boating on the lake to the island Tal Barahi temple, with the lakeside promenade for evenings.' },
      { name: 'Sarangkot', about: 'A hilltop above Pokhara for sunrise over the Annapurna range and Machhapuchhre.' },
      { name: 'Manakamana', about: 'A temple on a ridge reached by a long cable car ride over the hills.' },
      { name: 'Pashupatinath', about: 'One of the holiest Shiva temples, on the banks of the Bagmati in Kathmandu.' },
      { name: 'Boudhanath & Swayambhunath', about: 'Kathmandu\'s two great stupas, ringed with prayer wheels and monasteries.' },
      { name: 'Davis Falls & Gupteshwor Cave', about: 'A waterfall that drops into a gorge and the cave temple across the road, both in Pokhara.' },
    ],
    goodToKnow: [
      { title: 'ID for Indian citizens', text: 'No visa is needed. Carry a valid Indian passport or your original Voter ID card (not a print-out). Aadhaar, PAN and driving licences are not accepted as travel documents. Rules for children and seniors differ, so ask us before you travel.' },
      { title: 'Money', text: 'The local currency is the Nepali rupee. Indian rupees are accepted in many places in tourist areas, but carry some Nepali cash for small shops and ask us what to bring.' },
      { title: 'Phones', text: 'Indian SIMs may not work in Nepal unless international roaming is on. A local SIM or hotel Wi-Fi is the simple option.' },
    ],
    faqs: [
      { q: 'Do Indians need a passport or visa for Nepal?', a: 'No visa is needed. Indian citizens can travel with a valid passport or an original Voter ID card. Aadhaar is not accepted as a travel document. Rules can change, so we confirm documents with every traveller before the trip.' },
      { q: 'What is the best time for a Nepal trip?', a: 'October and November give the clearest Himalayan views. March to May is also good, with warm days and flowers. The monsoon (June to September) brings cloud and slower roads.' },
      { q: 'How many days do I need for Pokhara and Kathmandu?', a: 'Five days is enough for Pokhara, Manakamana and Kathmandu on an overland trip from Ranchi. Add a day or two for a slower pace or for Chitwan or Nagarkot.' },
    ],
  },

  darjeeling: {
    title: 'Darjeeling Trip from Ranchi: Tiger Hill, Toy Train, Mirik',
    description: 'Darjeeling group trips from Ranchi and private Darjeeling tours from any city: Tiger Hill sunrise, the toy train, tea estates and Mirik. Best time and prices.',
    h1: 'Darjeeling trips from Ranchi',
    intro: [
      'Darjeeling is the classic hill-station holiday: sunrise over Kanchenjunga from Tiger Hill, the little toy train looping through town, and tea gardens running down every slope.',
      'Our trips travel by train from Ranchi to New Jalpaiguri (NJP) and up by road, with a day for Mirik\'s lake and tea estates on the way.',
    ],
    bestTimeShort: 'Mar to May, Oct to Dec',
    bestTime: [
      { label: 'Spring', months: 'March to May', text: 'Pleasant days, flowers in town and the first-flush tea season.' },
      { label: 'Autumn', months: 'October to December', text: 'Clear skies and the best chance of seeing Kanchenjunga at sunrise.' },
      { label: 'Winter', months: 'December to February', text: 'Cold, sometimes below freezing at night, with crisp views. Warm clothing is a must.' },
      { label: 'Monsoon', months: 'June to September', text: 'Heavy rain, mist and occasional landslides on the hill roads.' },
    ],
    gettingThere: [
      'Trains from Ranchi and Hatia reach New Jalpaiguri (NJP), the railhead for the hills. From NJP it is about three to four hours by road to Darjeeling.',
      'The nearest airport is Bagdogra, close to NJP, if you are joining a private trip by air.',
    ],
    places: [
      { name: 'Tiger Hill', about: 'An early-morning drive for sunrise over Kanchenjunga and, on clear days, the peaks beyond.' },
      { name: 'Toy train & Batasia Loop', about: 'The Darjeeling Himalayan Railway, a UNESCO World Heritage line, and its famous spiral loop with a war memorial and mountain views.' },
      { name: 'Tea estates', about: 'Walks through working tea gardens with a tasting of Darjeeling\'s own tea.' },
      { name: 'Peace Pagoda & Ghoom Monastery', about: 'A white Japanese pagoda on the hillside and one of the oldest monasteries in the area.' },
      { name: 'Mall Road & Chowrasta', about: 'The town square for evening walks, cafes and shopping for woollens and tea.' },
      { name: 'Mirik', about: 'A quieter lake town among tea gardens and orange orchards, on the hill route between Siliguri and Darjeeling.' },
    ],
    goodToKnow: [
      { title: 'Early starts', text: 'Tiger Hill means leaving the hotel around 4 am. It is worth it on a clear day.' },
      { title: 'Warm clothes', text: 'Even in spring and autumn, mornings and nights are cold. In winter pack a heavy jacket, gloves and a cap.' },
      { title: 'Toy train', text: 'Joyride tickets sell out in season, so book them early. Tell us when you book if you want the ride included.' },
    ],
    faqs: [
      { q: 'How do I reach Darjeeling from Ranchi?', a: 'Take a train from Ranchi or Hatia to New Jalpaiguri (NJP), then drive about three to four hours up to Darjeeling. Our group trips include the train and the cab.' },
      { q: 'When can I see Kanchenjunga from Tiger Hill?', a: 'October to December gives the best chance of a clear view, followed by March to May. During the monsoon the peaks are usually in cloud.' },
      { q: 'Is Darjeeling good for a family trip?', a: 'Yes. The pace is easy, the sightseeing is short drives and walks, and hotels range from simple to premium. On a private trip we can plan around children and older travellers.' },
    ],
  },

  sikkim: {
    title: 'Sikkim Tour Package from Ranchi: Gangtok & North Sikkim',
    description: 'Sikkim group trips from Ranchi and private tours from any city: Gangtok, Tsomgo Lake, Lachung and Yumthang Valley. Permits, best time and prices explained.',
    h1: 'Sikkim trips from Ranchi',
    intro: [
      'Sikkim packs a lot into a small state: Gangtok\'s monasteries and MG Marg, the frozen Tsomgo Lake near the Chinese border, and in North Sikkim the snow and flower valleys around Lachung and Yumthang.',
      'Our group trips travel by train from Ranchi to New Jalpaiguri and on by road to Gangtok and North Sikkim, with the permits for the protected areas arranged as part of the trip.',
    ],
    bestTimeShort: 'Mar to May, Oct to Dec',
    bestTime: [
      { label: 'Spring', months: 'March to May', text: 'Rhododendrons and primulas in Yumthang Valley, mild days in Gangtok.' },
      { label: 'Autumn', months: 'October to December', text: 'Clear skies and mountain views, cool days and cold nights.' },
      { label: 'Snow season', months: 'December to February', text: 'The best chance of snow at Tsomgo Lake and in North Sikkim. Very cold, and some roads can close after heavy snowfall.' },
      { label: 'Monsoon', months: 'June to September', text: 'Heavy rain and landslides; North Sikkim roads are often disrupted.' },
    ],
    gettingThere: [
      'Trains from Ranchi and Hatia reach New Jalpaiguri (NJP). From NJP it is about four to five hours by road to Gangtok, and a further long day\'s drive to Lachung in North Sikkim.',
      'Bagdogra is the nearest major airport for private trips by air.',
    ],
    places: [
      { name: 'Gangtok & MG Marg', about: 'Sikkim\'s capital, with a pedestrian main street for evening walks and viewpoints over the valley.' },
      { name: 'Tsomgo Lake & Baba Mandir', about: 'A high-altitude glacial lake, often frozen in winter, and the shrine of Baba Harbhajan Singh nearby.' },
      { name: 'Rumtek Monastery', about: 'One of the largest monasteries in Sikkim, a short drive from Gangtok.' },
      { name: 'Lachung', about: 'A mountain village in North Sikkim and the overnight base for Yumthang.' },
      { name: 'Yumthang Valley', about: 'The "valley of flowers" above Lachung: rhododendrons in spring, snow in winter.' },
      { name: 'Zero Point', about: 'The end of the road beyond Yumthang, deep in the snow for much of the year. Usually an optional extra.' },
    ],
    goodToKnow: [
      { title: 'Permits', text: 'Indian citizens need no permit to enter Sikkim, but a Protected Area Permit is required for Tsomgo Lake, Nathu La and North Sikkim. It is issued only through registered local operators, so it is arranged as part of the trip. Carry your original photo ID and a few passport-size photos.' },
      { title: 'Altitude', text: 'Tsomgo Lake and Yumthang are high. Take it slow, drink water and tell us about any heart or breathing condition before booking.' },
      { title: 'Road conditions', text: 'Mountain roads in North Sikkim can close after landslides or snow. Plans may shift by a day, and we keep a buffer for that.' },
    ],
    faqs: [
      { q: 'Do Indians need a permit for Sikkim?', a: 'Not to enter the state. A Protected Area Permit is needed for Tsomgo Lake, Nathu La and North Sikkim (Lachung, Yumthang, Lachen). It is issued only through registered operators, so it is arranged as part of your Lavigo trip. Carry your original photo ID.' },
      { q: 'When is there snow in Sikkim?', a: 'December to February gives the best chance of snow at Tsomgo Lake, Yumthang and Zero Point. Snow can stay at Zero Point into spring.' },
      { q: 'How many days do I need for Gangtok and North Sikkim?', a: 'Plan at least five to six nights from NJP: two or three in Gangtok and two in North Sikkim, plus travel days.' },
    ],
  },

  netarhat: {
    title: 'Netarhat Trip from Ranchi: Weekend Package & Guide',
    description: 'Netarhat weekend trips from Ranchi: Magnolia Point sunset, Upper Ghaghri and Lodh Falls, pine forests. Best time to visit, how to get there and prices.',
    h1: 'Netarhat trips from Ranchi',
    intro: [
      'Netarhat, the "Queen of Chotanagpur", is Jharkhand\'s hill-station escape: a cool plateau of pine and sal forest in Latehar district, known for its sunsets and the waterfalls around it.',
      'It is close enough to Ranchi for a weekend. Our group weekends leave Ranchi by AC cab and come back two nights later.',
    ],
    bestTimeShort: 'Oct to Mar; Jul to Sep for waterfalls',
    bestTime: [
      { label: 'Winter', months: 'October to March', text: 'Cool, clear days and good sunsets. Nights get cold in December and January.' },
      { label: 'Monsoon', months: 'July to September', text: 'The waterfalls are at their fullest and the forest is green, but roads can be slippery.' },
      { label: 'Summer', months: 'April to June', text: 'Cooler than Ranchi, though middays are warm. Sunsets are still the highlight.' },
    ],
    gettingThere: [
      'Netarhat is about 150 km from Ranchi by road, roughly four to five hours by car through the hills. There is no railway station or airport on the plateau.',
    ],
    places: [
      { name: 'Magnolia Point', about: 'The famous sunset point, with views over the forested valleys.' },
      { name: 'Sunrise point', about: 'An early-morning viewpoint on the plateau.' },
      { name: 'Upper Ghaghri Falls', about: 'A waterfall a short drive from the town, best after the rains.' },
      { name: 'Lodh Falls', about: 'The highest waterfall in Jharkhand, a longer trip from Netarhat through the forest.' },
      { name: 'Pine forests', about: 'Quiet walks under the pines, a rare sight in this part of India.' },
    ],
    goodToKnow: [
      { title: 'Simple stays', text: 'Hotels on the plateau are simple and few, so book ahead for winter weekends and holidays.' },
      { title: 'Mobile network', text: 'Coverage can be patchy. Download maps and tickets before you leave Ranchi.' },
    ],
    faqs: [
      { q: 'How far is Netarhat from Ranchi?', a: 'About 150 km, or four to five hours by road. Our weekend trips include an AC cab from Ranchi and back.' },
      { q: 'Is Netarhat good for a weekend?', a: 'Yes. Two nights is enough for the sunset and sunrise points and a waterfall or two.' },
      { q: 'When are the Netarhat waterfalls best?', a: 'From July to September, during and just after the monsoon, when the falls are full.' },
    ],
  },

  puri: {
    title: 'Puri Trip from Ranchi: Jagannath, Konark & Chilika',
    description: 'Private Puri trips from Ranchi and any city in India: Jagannath Temple, Konark Sun Temple, Chilika Lake and the beach. Best time, how to reach and prices.',
    h1: 'Puri trips from Ranchi',
    intro: [
      'Puri brings together a pilgrimage and a beach holiday: darshan at the Jagannath Temple, a day at the Konark Sun Temple, and boats out on Chilika Lake to look for dolphins.',
      'We plan Puri as a private trip on your own dates, from Ranchi or any city, with hotels, cabs and sightseeing arranged.',
    ],
    bestTimeShort: 'Oct to Feb',
    bestTime: [
      { label: 'Winter', months: 'October to February', text: 'The most comfortable weather for temples and the beach.' },
      { label: 'Rath Yatra', months: 'June or July', text: 'The great chariot festival. Unforgettable, but very crowded; hotels must be booked months ahead.' },
      { label: 'Summer', months: 'March to June', text: 'Hot and humid. Plan sightseeing for mornings and evenings.' },
    ],
    gettingThere: [
      'Trains run from Ranchi and Hatia to Puri. The nearest airport is Bhubaneswar, about 60 km away, for travellers joining by air.',
    ],
    places: [
      { name: 'Jagannath Temple', about: 'One of the Char Dham, and the heart of Puri. Only Hindus are allowed inside the temple.' },
      { name: 'Konark Sun Temple', about: 'The 13th-century temple built as a giant stone chariot, a UNESCO World Heritage Site about an hour from Puri.' },
      { name: 'Chilika Lake', about: 'Asia\'s largest brackish-water lagoon; boats from Satapada go out to spot Irrawaddy dolphins.' },
      { name: 'Puri beach', about: 'The long golden beach for evening walks and sunrise.' },
      { name: 'Raghurajpur', about: 'A heritage crafts village known for pattachitra paintings.' },
    ],
    goodToKnow: [
      { title: 'Temple rules', text: 'Mobile phones, cameras and leather items are not allowed inside the Jagannath Temple. Dress modestly and expect queues.' },
      { title: 'Sea safety', text: 'The surf at Puri can be strong. Swim only where lifeguards are on duty.' },
    ],
    faqs: [
      { q: 'How many days are enough for Puri, Konark and Chilika?', a: 'Three nights covers Puri, a day trip to Konark and a morning at Chilika. Add a night for Bhubaneswar\'s temples.' },
      { q: 'What is the best time to visit Puri?', a: 'October to February has the most comfortable weather. Rath Yatra in June or July is special but very crowded.' },
      { q: 'Can Lavigo plan a Puri trip from my city?', a: 'Yes. Puri is a private trip on your dates, starting from Ranchi or any city in India. Build a plan on the website or send us an enquiry.' },
    ],
  },

  goa: {
    title: 'Goa Trip from Ranchi: Beaches, Forts & Cruise Package',
    description: 'Private Goa holidays from Ranchi and any city in India: North and South Goa beaches, forts, old churches, Dudhsagar Falls and a river cruise.',
    h1: 'Goa trips from Ranchi',
    intro: [
      'Goa is two holidays in one: the busy beaches, cafes and nightlife of North Goa, and the quieter sands of the south. In between are Portuguese-era churches, hilltop forts and the Mandovi river at sunset.',
      'We plan Goa as a private trip on your own dates, from Ranchi or any city, with hotels, a car and the sightseeing you want.',
    ],
    bestTimeShort: 'Nov to Feb',
    bestTime: [
      { label: 'Peak season', months: 'November to February', text: 'Dry, sunny and lively, with Christmas and New Year at the busy peak. Book early.' },
      { label: 'Shoulder', months: 'October, March to May', text: 'Fewer crowds and better hotel rates; April and May are hot.' },
      { label: 'Monsoon', months: 'June to September', text: 'Lush and green but rough seas; most water sports and beach shacks pause.' },
    ],
    gettingThere: [
      'Most travellers from Ranchi fly to Goa, usually with one stop, into Dabolim (South Goa) or Mopa (North Goa) airport. Trains to Goa take well over a day from Ranchi.',
    ],
    places: [
      { name: 'North Goa beaches', about: 'Calangute, Baga, Anjuna and Vagator: the lively side of Goa, with shacks, markets and nightlife.' },
      { name: 'South Goa beaches', about: 'Colva, Benaulim and Palolem: quieter, cleaner beaches for a slower pace.' },
      { name: 'Old Goa churches', about: 'The Basilica of Bom Jesus and Se Cathedral, part of a UNESCO World Heritage Site.' },
      { name: 'Fort Aguada & Chapora Fort', about: 'Portuguese forts above the sea, best visited near sunset.' },
      { name: 'Dudhsagar Falls', about: 'A tall four-tiered waterfall on the Goa–Karnataka border, reached by jeep safari when the season allows.' },
      { name: 'Mandovi river cruise', about: 'An evening boat ride from Panjim with music and the city lights.' },
    ],
    goodToKnow: [
      { title: 'Getting around', text: 'Distances between North and South Goa are longer than they look. A private car with a driver saves a lot of time.' },
      { title: 'Water sports', text: 'Parasailing, jet skis and banana rides run in the dry season and stop during the monsoon.' },
    ],
    faqs: [
      { q: 'How many days are enough for Goa?', a: 'Four nights is a good first trip: two in North Goa, one day for Old Goa and Panjim, and a day in South Goa or at Dudhsagar.' },
      { q: 'What is the best time to visit Goa?', a: 'November to February for beach weather and the festive season. October and March are quieter with good rates.' },
      { q: 'Can Lavigo plan a Goa trip from my city?', a: 'Yes. Goa is a private trip on your dates from Ranchi or any city in India, with flights or trains booked by us if you want.' },
    ],
  },
}
