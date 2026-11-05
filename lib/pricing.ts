import { ADVANCE, CHILD_FACTOR, GST, SERVICE_PER_PERSON } from './config'
import { addDays } from './format'
import type { Destination } from './types'

export type Tier = 'budget' | 'comfort' | 'premium'
export type Mode = 'train' | 'cab' | 'flight'

export const TIERS: Record<Tier, { name: string; desc: string; meal: number }> = {
  budget: { name: 'Budget', desc: 'Clean, well-reviewed stays', meal: 350 },
  comfort: { name: 'Comfort', desc: '3-star, best locations', meal: 550 },
  premium: { name: 'Premium', desc: 'Resorts & view rooms', meal: 900 },
}
export const MODES: Record<Mode, { name: string; desc: string }> = {
  train: { name: 'Train + shared cab', desc: 'Sleeper/3AC + shared transfers' },
  cab: { name: 'Train + private cab', desc: 'Your own cab for sightseeing' },
  flight: { name: 'Flight + private cab', desc: 'Fly from Ranchi where possible' },
}

export type Builder = {
  dests: Record<string, number> // slug -> nights
  order: string[]
  start: string // YYYY-MM-DD
  adults: number
  kids: number
  tier: Tier
  mode: Mode
  acts: string[]
}

export type Quote = ReturnType<typeof quote>

export function quote(b: Builder, all: Destination[]) {
  const bySlug = new Map(all.map((d) => [d.slug, d]))
  const order = b.order.filter((k) => b.dests[k] && bySlug.has(k))
  const pax = b.adults + b.kids
  const paxEq = b.adults + b.kids * CHILD_FACTOR
  const rooms = Math.max(1, Math.ceil(b.adults / 2))
  const tier = TIERS[b.tier]
  const rate = (d: Destination) => d[`rate_${b.tier}` as const]
  const travelCost = (d: Destination) => d[`travel_${b.mode}` as const]

  let nights = 0, stays = 0, meals = 0, acts = 0, travel = 0
  if (order.length) travel = travelCost(bySlug.get(order[0])!) * paxEq + Math.max(0, order.length - 1) * 900 * paxEq

  const chosen: { id: string; n: string; p: number; where: string; dest: string }[] = []
  for (const k of order) {
    const D = bySlug.get(k)!
    const n = b.dests[k]
    nights += n
    stays += rate(D) * n * rooms
    meals += tier.meal * n * paxEq
    for (const a of D.activities) if (b.acts.includes(a.id)) { acts += a.p * paxEq; chosen.push({ ...a, dest: k }) }
  }

  const totalDays = nights + 1
  const cabPerDay = 3200 * Math.max(1, Math.ceil(pax / 6))
  const cabs = b.mode !== 'train' && order.length ? 3200 * totalDays * Math.max(1, Math.ceil(pax / 6)) : 0
  const service = SERVICE_PER_PERSON * b.adults + SERVICE_PER_PERSON * 0.5 * b.kids
  const sub = stays + meals + travel + cabs + acts + service
  const gst = sub * GST
  const total = sub + gst

  // day-by-day plan
  const days: { n: number; date: Date; title: string; text: string; cost: number }[] = []
  let di = 0
  order.forEach((k, i) => {
    const D = bySlug.get(k)!
    const n = b.dests[k]
    const myActs = chosen.filter((a) => a.dest === k)
    const places = D.places.length ? D.places : [D.name]
    for (let j = 0; j < n; j++) {
      let title: string, text: string
      if (j === 0) {
        title = (i === 0 ? 'Ranchi → ' : bySlug.get(order[i - 1])!.name + ' → ') + places[0]
        text = i === 0
          ? `Depart Ranchi by ${b.mode === 'flight' ? 'flight' : 'train'}, transfer to your ${tier.name.toLowerCase()} stay.`
          : 'Transfer day with stops on the way. Check in and rest.'
      } else {
        const pi = Math.min(places.length - 1, Math.floor((j * places.length) / n))
        const pp = Math.min(places.length - 1, Math.floor(((j - 1) * places.length) / n))
        if (pi !== pp) { title = `${places[pp]} → ${places[pi]}`; text = `Scenic drive to ${places[pi]}, check in and explore.` }
        else { title = `${places[pi]} sightseeing`; text = 'Local sightseeing at your pace.' }
      }
      const a = myActs.filter((_, ix) => ix % n === j)
      if (a.length) text += ' Includes: ' + a.map((x) => x.n).join(', ') + '.'
      const cost = rate(D) * rooms + tier.meal * paxEq + a.reduce((s, x) => s + x.p * paxEq, 0) + (b.mode !== 'train' ? cabPerDay : 0)
      days.push({ n: ++di, date: addDays(b.start, di - 1), title, text, cost })
    }
  })
  if (order.length) {
    const last = bySlug.get(order[order.length - 1])!
    const lp = last.places.length ? last.places : [last.name]
    days.push({ n: ++di, date: addDays(b.start, di - 1), title: `${lp[lp.length - 1]} → Ranchi`, text: 'Check out after breakfast and head home.', cost: 0 })
  }

  const lines: [string, number][] = [
    [`Stays · ${tier.name} · ${rooms} room${rooms > 1 ? 's' : ''} × ${nights} nights`, stays],
    ['Breakfast & dinner', meals],
    [`Travel from Ranchi · ${MODES[b.mode].name}`, travel],
  ]
  if (cabs) lines.push([`Private cab · ${totalDays} days`, cabs])
  if (acts) lines.push([`Activities · ${chosen.length}`, acts])
  lines.push(['Planning, support & trip leader', service])

  return { order, pax, nights, rooms, days, lines, sub, gst, total, perPerson: pax ? total / pax : 0, advance: total * ADVANCE, chosen }
}
