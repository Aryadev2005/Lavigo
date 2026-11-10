'use client'
import { DepartureCard, type DepartureCardData } from './DepartureCard'
import { MonthChips } from './MonthChips'
import { monthLabel, monthsFromDates } from '@/lib/months'
import { useMonthFilter } from '@/lib/useMonthFilter'

/** Home page "Upcoming departures": month chips, instant client filter, ?month= kept in the URL. */
export function UpcomingDepartures({ departures }: { departures: DepartureCardData[] }) {
  const months = monthsFromDates(departures.map((d) => d.date))
  const [month, setMonth] = useMonthFilter()
  const list = month ? departures.filter((d) => d.date.slice(0, 7) === month) : departures

  return (
    <div>
      <MonthChips months={months} selected={month} onSelect={setMonth} />
      {month ? (
        <div className="m-g4">{list.map((d) => <DepartureCard key={d.key} d={d} />)}</div>
      ) : (
        months.map((m) => {
          const items = list.filter((d) => d.date.slice(0, 7) === m.key)
          if (!items.length) return null
          return (
            <div key={m.key}>
              <h3 className="m-mgroup-h">{monthLabel(m.key)}</h3>
              <div className="m-g4">{items.map((d) => <DepartureCard key={d.key} d={d} />)}</div>
            </div>
          )
        })
      )}
    </div>
  )
}
