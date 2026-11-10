'use client'
import type { MonthOption } from '@/lib/months'

/** Horizontally-scrolling month filter. Purely presentational: the parent owns the selection and URL sync. */
export function MonthChips({ months, selected, onSelect, totalLabel = 'All months' }: { months: MonthOption[]; selected: string | null; onSelect: (key: string | null) => void; totalLabel?: string }) {
  if (!months.length) return null
  return (
    <div className="m-mchips" role="group" aria-label="Filter by month">
      <button type="button" aria-pressed={selected === null} className={selected === null ? 'on' : undefined} onClick={() => onSelect(null)}>{totalLabel}</button>
      {months.map((m) => (
        <button key={m.key} type="button" aria-pressed={selected === m.key} className={selected === m.key ? 'on' : undefined} onClick={() => onSelect(m.key)}>
          {m.label} <small>· {m.count}</small>
        </button>
      ))}
    </div>
  )
}
