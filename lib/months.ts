import { fmtDate } from './format'

export type MonthOption = { key: string; label: string; count: number } // key = YYYY-MM

/** One chip per month present in `dates` (already future-only, open departures), soonest first. */
export function monthsFromDates(dates: string[]): MonthOption[] {
  const counts = new Map<string, number>()
  for (const d of dates) {
    if (!d) continue
    const key = d.slice(0, 7)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => ({ key, count, label: monthLabel(key) }))
}

export const monthLabel = (key: string) => fmtDate(`${key}-01`, { month: 'short', year: 'numeric' })

export const isMonthKey = (s: string | null): s is string => !!s && /^\d{4}-\d{2}$/.test(s)
