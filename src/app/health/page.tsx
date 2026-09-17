'use client'

import Link from 'next/link'
import { todayStr, lastDays, pretty, weekdayLetter, clamp, cx } from '@/lib/util'
import { Bars, Sparkline } from '@/components/charts'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, setAt, removeAt } from '@/lib/store'
import type { SleepLog, WeightLog } from '@/lib/types'
import {
  PageHeader, Card, CardTitle, Icon, Pill, Field, inputCls, btnPrimary,
} from '@/components/ui'

const QUALITY = ['', 'Rough', 'Restless', 'Okay', 'Good', 'Deep']

export default function HealthPage() {
  return (
    <Shell>
      <Health />
    </Shell>
  )
}

function Health() {
  const uid = useAuth().user!.uid
  const today = todayStr()
  const days14 = lastDays(14)
  const week = lastDays(7)

  const sleeps = useDocs<SleepLog>(uid, 'sleep')
  const weights = useDocs<WeightLog>(uid, 'weight')
  if (sleeps === null || weights === null) return <PageLoader />

  const sleepMap = new Map(sleeps.map((s) => [s.id, s]))
  const todaySleep = sleepMap.get(today)
  const weekSleeps = sleeps.filter((s) => s.id >= week[0])
  const avgSleep = weekSleeps.length
    ? Math.round((weekSleeps.reduce((s, x) => s + x.hours, 0) / weekSleeps.length) * 10) / 10
    : null

  const wDesc = [...weights].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 30)
  const wAsc = [...wDesc].reverse()
  const latestW = wDesc[0]
  const oldestW = wDesc[wDesc.length - 1]
  const delta = latestW && oldestW && latestW.id !== oldestW.id
    ? Math.round((latestW.kg - oldestW.kg) * 10) / 10
    : null

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
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const kg = Number(fd.get('kg'))
    if (!(kg > 20 && kg < 400)) return
    void setAt(uid, `weight/${today}`, { kg })
      ;(e.currentTarget.elements.namedItem('kg') as HTMLInputElement).value = ''
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Health" sub="Your body is the soil everything else grows in." />

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
            Steps, weekly workout plans (home / gym / both) and daily sessions now live on the
            Fitness page — built around your 20,000-step goal.
          </p>
          <Link href="/fitness" className={cx(btnPrimary, 'mt-4 self-start')}>
            <Icon name="zap" size={15} /> Open Fitness
          </Link>
        </Card>
      </div>
    </div>
  )
}
