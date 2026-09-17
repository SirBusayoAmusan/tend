'use client'

import Link from 'next/link'
import { todayStr, lastDays, pretty, weekdayLetter, shiftDays, clamp, cx } from '@/lib/util'
import { Bars, Sparkline } from '@/components/charts'
import { buildInsights } from '@/lib/insights'
import { downloadIcs } from '@/lib/ical'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, useDoc, setAt, updateAt, removeAt } from '@/lib/store'
import type { SleepLog, WeightLog, FastLog, Txn, UserProfile } from '@/lib/types'
import {
  PageHeader, Card, CardTitle, Icon, Pill, Field, inputCls, btnPrimary, btnGhost,
} from '@/components/ui'
import { Mascot } from '@/components/Mascot'

const QUALITY = ['', 'Rough', 'Restless', 'Okay', 'Good', 'Deep']
const ISO = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ISO_ICS = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

export default function HealthPage() {
  return (
    <Shell>
      <Health />
    </Shell>
  )
}

const isoOf = (dateStr: string) => {
  const d = new Date(dateStr + 'T12:00:00').getDay()
  return d === 0 ? 7 : d
}

function Health() {
  const uid = useAuth().user!.uid
  const today = todayStr()
  const days14 = lastDays(14)
  const week = lastDays(7)

  const sleeps = useDocs<SleepLog>(uid, 'sleep')
  const weights = useDocs<WeightLog>(uid, 'weight')
  const fasts = useDocs<FastLog>(uid, 'fasts')
  const txns = useDocs<Txn>(uid, 'txns')
  const profile = useDoc<UserProfile>(uid, '')

  if (sleeps === null || weights === null || fasts === null || txns === null || profile === undefined) {
    return <PageLoader />
  }

  /* ---------------- sleep ---------------- */
  const sleepMap = new Map(sleeps.map((s) => [s.id, s]))
  const todaySleep = sleepMap.get(today)
  const weekSleeps = sleeps.filter((s) => s.id >= week[0])
  const avgSleep = weekSleeps.length
    ? Math.round((weekSleeps.reduce((s, x) => s + x.hours, 0) / weekSleeps.length) * 10) / 10
    : null

  /* ---------------- weight ---------------- */
  const wDesc = [...weights].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 30)
  const wAsc = [...wDesc].reverse()
  const latestW = wDesc[0]
  const oldestW = wDesc[wDesc.length - 1]
  const delta = latestW && oldestW && latestW.id !== oldestW.id
    ? Math.round((latestW.kg - oldestW.kg) * 10) / 10
    : null

  /* ---------------- fasting ---------------- */
  const fastDays = profile?.fastDays ?? [1, 3, 5]
  const fastSet = new Set(fastDays)
  const todayIso = isoOf(today)
  const isFastToday = fastSet.has(todayIso)
  const keptToday = fasts.find((f) => f.id === today)?.kept ?? false
  const keptSet = new Set(fasts.filter((f) => f.kept).map((f) => f.id))

  // streak of consecutive *scheduled* fast days kept
  let streakCount = 0
  {
    let d = today
    if (!fastSet.has(isoOf(d)) || !keptSet.has(d)) {
      // start from the most recent scheduled day strictly before today
      d = shiftDays(today, -1)
      while (!fastSet.has(isoOf(d))) d = shiftDays(d, -1)
    }
    while (fastSet.has(isoOf(d)) && keptSet.has(d)) {
      streakCount++
      d = shiftDays(d, -1)
      while (!fastSet.has(isoOf(d))) d = shiftDays(d, -1)
    }
  }
  // last 4 weeks: kept / scheduled (scheduled days that have arrived, incl today)
  let scheduledPassed = 0
  let keptPassed = 0
  for (let i = 0; i < 28; i++) {
    const d = shiftDays(today, -i)
    if (fastSet.has(isoOf(d))) {
      scheduledPassed++
      if (keptSet.has(d)) keptPassed++
    }
  }
  // next fast day
  let nextFast: string | null = null
  for (let i = isFastToday ? 1 : 0; i <= 7; i++) {
    const d = shiftDays(today, i)
    if (fastSet.has(isoOf(d))) { nextFast = d; break }
  }

  const toggleFastDay = (iso: number) => {
    const s = new Set(fastDays)
    if (s.has(iso)) s.delete(iso)
    else s.add(iso)
    if (s.size === 0) return
    void setAt(uid, '', { fastDays: [...s].sort() })
  }

  const fastCalendar = () => {
    const days = [...fastSet].sort().map((i) => ISO_ICS[i])
    let start = nextFast ?? today
    downloadIcs('tend-fast-days.ics', [{
      uid: 'tend-fast-schedule',
      title: '🌿 Fast day',
      date: start,
      rrule: `FREQ=WEEKLY;BYDAY=${days.join(',')}`,
      description: 'Fasting day from Tend (edit the days any time in Health).',
    }])
  }

  /* ---------------- money → health signals ---------------- */
  const treatsBudget = profile?.treatsBudget ?? 15000
  const healthSignals = buildInsights(txns, treatsBudget).filter((i) => i.health)
  const toneCls: Record<string, string> = {
    sage: 'border-sage/40 bg-sage-soft/50',
    sand: 'border-sand/50 bg-sand-soft/60',
    rose: 'border-rose/40 bg-rose-soft/60',
    sky: 'border-sky/40 bg-sky-soft/60',
  }

  /* ---------------- handlers ---------------- */
  const saveSleep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const date = String(fd.get('date') || today)
    const hours = Number(fd.get('hours'))
    const quality = clamp(Number(fd.get('quality')) || 3, 1, 5)
    if (!(hours > 0 && hours <= 16)) return
    void setAt(uid, `sleep/${date}`, { hours, quality })
  }

  const saveWeight = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    e.preventDefault()
    const kg = Number(new FormData(form).get('kg'))
    if (!(kg > 20 && kg < 400)) return
    void setAt(uid, `weight/${today}`, { kg })
    ;(form.elements.namedItem('kg') as HTMLInputElement).value = ''
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Health" sub="Your body is the soil everything else grows in." />

      {/* ---------- Fasting ---------- */}
      <Card>
        <CardTitle
          icon="heart"
          accent="sage"
          title="Fasting"
          right={
            streakCount > 1 ? (
              <Pill accent="clay"><Icon name="flame" size={11} /> {streakCount} kept in a row</Pill>
            ) : undefined
          }
        />

        {/* today banner */}
        <div className={cx(
          'flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3.5',
          isFastToday ? 'border-sage/40 bg-sage-soft/50' : 'border-line bg-cream/50'
        )}>
          <Mascot stage={isFastToday ? (keptToday ? 3 : 1) : 1} mood={isFastToday ? (keptToday ? 'happy' : 'content') : 'content'} size={54} />
          <div className="min-w-0 flex-1">
            {isFastToday ? (
              <>
                <p className="text-sm font-medium">Today is a fast day 🌿</p>
                <p className="text-xs text-mist">
                  {keptToday ? 'Fast kept — beautifully done. Your cells thank you.' : 'Keep it clean today — water, and the plan you chose.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">No fast today — eat well.</p>
                <p className="text-xs text-mist">
                  Next fast: {nextFast ? `${ISO[isoOf(nextFast)]} · ${pretty(nextFast)}` : 'none scheduled'}
                </p>
              </>
            )}
          </div>
          {isFastToday && (
            <button
              onClick={() => setAt(uid, `fasts/${today}`, { kept: !keptToday })}
              className={cx(
                'rounded-full px-4 py-2.5 text-sm font-medium transition',
                keptToday ? 'bg-sage text-white' : 'bg-ink text-paper hover:opacity-90'
              )}
            >
              {keptToday ? '✓ Fast kept' : 'Mark fast as kept'}
            </button>
          )}
        </div>

        {/* day chooser + stats + calendar */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-mist">My fasting days <span className="font-normal">(tap to change)</span></p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((iso) => (
                <button
                  key={iso}
                  onClick={() => toggleFastDay(iso)}
                  className={cx(
                    'grid size-9 place-items-center rounded-full border text-[11px] font-medium transition-colors',
                    fastSet.has(iso)
                      ? 'border-transparent bg-sage text-white'
                      : 'border-line text-mist hover:border-sage hover:text-ink'
                  )}
                >
                  {ISO[iso]}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-mist">
            <p>
              Last 4 weeks: <span className="font-medium text-ink">{keptPassed}/{scheduledPassed}</span> kept
            </p>
            <button onClick={fastCalendar} className="mt-1.5 inline-flex items-center gap-1.5 font-medium text-sage hover:underline">
              <Icon name="calendar" size={13} /> Add fast days to my calendar
            </button>
          </div>
        </div>
      </Card>

      {/* ---------- Sleep ---------- */}
      <Card>
        <CardTitle
          icon="heart"
          accent="lilac"
          title="Sleep"
          right={avgSleep !== null ? <Pill accent="lilac">7-day avg · {avgSleep}h</Pill> : undefined}
        />
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <Bars
            data={days14.map((d) => ({ label: weekdayLetter(d), value: sleepMap.get(d)?.hours ?? 0 }))}
            color="#9D92C7"
            title={(v) => (v > 0 ? `${v}h` : 'Not logged')}
          />
          <form onSubmit={saveSleep} className="space-y-3">
            <Field label="Date">
              <input type="date" name="date" defaultValue={today} max={today} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hours">
                <input type="number" name="hours" step="0.5" min="0" max="16" placeholder="7.5" className={inputCls} />
              </Field>
              <Field label="Quality">
                <select name="quality" className={inputCls} defaultValue={String(todaySleep?.quality ?? 3)}>
                  {[1, 2, 3, 4, 5].map((q) => (
                    <option key={q} value={q}>{QUALITY[q]}</option>
                  ))}
                </select>
              </Field>
            </div>
            <button type="submit" className={cx(btnPrimary, 'w-full')}>
              <Icon name="check" size={15} /> Log sleep
            </button>
            {todaySleep && (
              <p className="text-center text-xs text-mist">
                Today: {todaySleep.hours}h · {QUALITY[todaySleep.quality]}{' '}
                <button type="button" onClick={() => removeAt(uid, `sleep/${today}`)} className="underline hover:text-rose">
                  remove
                </button>
              </p>
            )}
          </form>
        </div>
      </Card>

      {/* ---------- Wallet → health signals ---------- */}
      <Card>
        <CardTitle
          icon="wallet"
          accent="sand"
          title="Signals from your wallet"
          right={<Link href="/money" className="text-xs font-medium text-sand hover:underline">Tune rules in Money →</Link>}
        />
        {healthSignals.length === 0 ? (
          <p className="text-sm text-mist">
            Log this month’s spending in Money and I’ll watch the nutrition side — treats,
            eating-out balance, snack habits — and report back here.
          </p>
        ) : (
          <div className="space-y-2.5">
            {healthSignals.map((s) => (
              <div key={s.id} className={cx('rounded-2xl border px-4 py-3', toneCls[s.tone])}>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/70">{s.body}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------- Weight ---------- */}
        <Card>
          <CardTitle icon="target" accent="sage" title="Weight" />
          <form onSubmit={saveWeight} className="mb-4 flex items-end gap-3">
            <Field label="Today’s weight (kg)" className="flex-1">
              <input type="number" name="kg" step="0.1" min="20" max="400" placeholder="72.5" className={inputCls} />
            </Field>
            <button type="submit" className={btnPrimary}>
              <Icon name="check" size={15} /> Log
            </button>
          </form>
          {latestW ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl">{latestW.kg}</span>
                <span className="text-sm text-mist">kg</span>
                {delta !== null && delta !== 0 && (
                  <span className="text-xs tabular-nums text-mist">
                    {delta > 0 ? `+${delta}` : delta} kg since {pretty(oldestW.id)}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <Sparkline data={wAsc.map((w) => w.kg)} color="#7FA98B" />
              </div>
            </>
          ) : (
            <p className="text-sm text-mist">Log today’s weight to start your trend line.</p>
          )}
        </Card>

        {/* ---------- Movement lives in Fitness now ---------- */}
        <Card className="flex flex-col justify-between">
          <CardTitle icon="zap" accent="clay" title="Movement & workouts" />
          <p className="text-sm leading-relaxed text-mist">
            Steps, weekly workout plans (home / gym / both) with stickman exercise guides,
            and daily sessions live on the Fitness page.
          </p>
          <Link href="/fitness" className={cx(btnPrimary, 'mt-4 self-start')}>
            <Icon name="zap" size={15} /> Open Fitness
          </Link>
        </Card>
      </div>
    </div>
  )
}
