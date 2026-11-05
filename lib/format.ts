export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

// Dates are stored as YYYY-MM-DD. Parse as local noon to avoid timezone day-shifts.
export const parseDate = (s: string) => new Date(s + 'T12:00:00+05:30')

export const fmtDate = (
  s: string | Date,
  o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
) => (typeof s === 'string' ? parseDate(s) : s).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', ...o })

export const addDays = (s: string, n: number) => {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return d
}

export const isoDate = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d) // YYYY-MM-DD

export const todayISO = () => isoDate(new Date())

export const daysTo = (s: string) => Math.ceil((parseDate(s).getTime() - Date.now()) / 864e5)

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
