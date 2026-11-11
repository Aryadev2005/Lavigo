import { CHILD_MAX_AGE } from './config'

/** Whole years between a date of birth and a day (both 'YYYY-MM-DD'). Null if the date is not valid. */
export function ageOn(dob: string | undefined | null, day: string): number | null {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null
  const [y, m, d] = dob.split('-').map(Number)
  const [Y, M, D] = day.split('-').map(Number)
  if (!y || !m || !d) return null
  let a = Y - y
  if (M < m || (M === m && D < d)) a--
  return a >= 0 && a <= 120 ? a : null
}

export const isChild = (age: number | null) => age !== null && age <= CHILD_MAX_AGE

/** "34 · Adult", "7 · Child", or "Age not given". */
export function ageLabel(dob: string | undefined | null, day: string) {
  const a = ageOn(dob, day)
  if (a === null) return 'Age not given'
  return `${a} · ${isChild(a) ? 'Child' : 'Adult'}`
}
