import { shiftDays } from './util'

export interface IcsEvent {
  uid: string
  title: string
  /** All-day date YYYY-MM-DD */
  date: string
  description?: string
  /** Recurrence rule, e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR" */
  rrule?: string
}

function esc(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function ymd(dateStr: string): string {
  return dateStr.replaceAll('-', '')
}

export function buildIcs(events: IcsEvent[], calName = 'Tend — Life OS'): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tend Life OS//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(calName)}`,
  ]
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@tend-lifeos`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${ymd(e.date)}`,
      `DTEND;VALUE=DATE:${ymd(shiftDays(e.date, 1))}`,
      `SUMMARY:${esc(e.title)}`
    )
    if (e.rrule) lines.push(`RRULE:${e.rrule}`)
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(filename: string, events: IcsEvent[]) {
  const ics = buildIcs(events)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
