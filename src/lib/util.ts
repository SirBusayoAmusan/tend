export const CURRENCY = '₦'

export const pad = (n: number) => String(n).padStart(2, '0')

/** Local "today" as YYYY-MM-DD — client-side, uses the device's own clock. */
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function hourNow(): number {
  return new Date().getHours()
}

export function shiftDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Last n dates ending today (default), oldest first. */
export function lastDays(n: number, end?: string): string[] {
  const e = end ?? todayStr()
  return Array.from({ length: n }, (_, i) => shiftDays(e, -(n - 1 - i)))
}

/** Monday-based week id ("YYYY-MM-DD" of the week's Monday). */
export function weekIdOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const mondayOffset = (d.getDay() + 6) % 7
  return shiftDays(dateStr, -mondayOffset)
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export function weekDates(weekId: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftDays(weekId, i))
}

export function pretty(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export function prettyFull(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function weekdayLetter(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'narrow' })
}

export function monthKey(dateStr: string) {
  return dateStr.slice(0, 7)
}

export function money(n: number): string {
  const abs = Math.abs(Math.round(n)).toLocaleString('en-NG')
  return `${n < 0 ? '−' : ''}${CURRENCY}${abs}`
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0]
}

export function greeting(hour: number): string {
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const cx = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ')

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))
