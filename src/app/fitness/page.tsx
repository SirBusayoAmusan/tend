'use client'

import { useState } from 'react'
import { todayStr, lastDays, pretty, weekIdOf, weekdayLetter, shiftDays, cx } from '@/lib/util'
import { buildPlan } from '@/lib/workouts'
import { Ring } from '@/components/charts'
import { Mascot } from '@/components/Mascot'
import { Stickman } from '@/components/Stickman'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, useDoc, setAt, updateAt } from '@/lib/store'
import type { StepLog, FitnessPlan, PlanDay, UserProfile } from '@/lib/types'
import {
  PageHeader, Card, CardTitle, Icon, Pill, Field, inputCls, btnGhost, ACCENTS, type IconName,
} from '@/components/ui'

export default function FitnessPage() {
  return (
    <Shell>
      <Fitness />
    </Shell>
  )
}

const TYPE_STYLE: Record<string, { label: string; badge: string }> = {
  home: { label: 'Home', badge: 'bg-sage-soft text-sage' },
  gym: { label: 'Gym', badge: 'bg-sky-soft text-sky' },
  rest: { label: 'Rest', badge: 'bg-cream text-mist' },
}

function Fitness() {
  const uid = useAuth().user!.uid
  const today = todayStr()
  const week = lastDays(7)
  const weekId = weekIdOf(today)

  const steps = useDocs<StepLog>(uid, 'steps')
  const plan = useDoc<FitnessPlan>(uid, `fitnessPlans/${weekId}`)
  const profile = useDoc<UserProfile>(uid, '')
  const [choosing, setChoosing] = useState(false)

  if (steps === null || plan === undefined || profile === undefined) return <PageLoader />

  const stepsGoal = profile?.stepsGoal ?? 20000
  const countToday = steps.find((s) => s.id === today)?.count ?? 0
  const weekTotal = steps.filter((s) => s.id >= week[0] && s.id <= today).reduce((s, x) => s + x.count, 0)
  const stepDates = new Set(steps.filter((s) => s.count >= stepsGoal).map((s) => s.id))
  // streak of goal-hit days (today if hit, otherwise from yesterday)
  let st = 0
  let d = stepDates.has(today) ? today : shiftDays(today, -1)
  while (stepDates.has(d)) {
    st++
    d = shiftDays(d, -1)
  }

  const addSteps = (n: number) => {
    void setAt(uid, `steps/${today}`, { count: Math.max(0, countToday + n) })
  }

  const workoutsDoneThisWeek = plan
    ? Object.entries(plan.days).filter(([date, day]) => date <= today && day.done && day.type !== 'rest').length
    : 0

  const choose = (choice: 'home' | 'gym' | 'both') => {
    void setAt(uid, `fitnessPlans/${weekId}`, { ...buildPlan(weekId, choice) })
    setChoosing(false)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Fitness" sub="20,000 steps a day, a plan that fits your week. No excuses, no chaos." />

      {/* ---------- Steps ---------- */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle
            icon="zap"
            accent="clay"
            title="Steps today"
            right={st > 1 ? <Pill accent="clay"><Icon name="flame" size={11} /> {st}-day streak</Pill> : undefined}
          />
          <div className="flex items-center gap-5">
            <Ring label={`/ ${Math.round(stepsGoal / 1000)}k`} value={Math.min(1, countToday / stepsGoal)} color={ACCENTS.clay.hex} size={104} />
            <div className="flex-1">
              <p className="font-display text-3xl tabular-nums">{countToday.toLocaleString()}</p>
              <p className="text-xs text-mist">of {stepsGoal.toLocaleString()} steps</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[1000, 2500, 5000].map((n) => (
                  <button
                    key={n}
                    onClick={() => addSteps(n)}
                    className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-mist transition-colors hover:border-clay hover:text-ink"
                  >
                    +{(n / 1000).toLocaleString()}k
                  </button>
                ))}
              </div>
              <form
                className="mt-2 flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  const fd = new FormData(e.currentTarget)
                  const n = Math.round(Number(fd.get('count')))
                  if (n >= 0) void setAt(uid, `steps/${today}`, { count: n })
                  ;(e.currentTarget.elements.namedItem('count') as HTMLInputElement).value = ''
                }}
              >
                <Field label="Set exact count">
                  <input type="number" name="count" min={0} placeholder="e.g. 14320" className={cx(inputCls, 'w-32 !py-1.5 text-xs')} />
                </Field>
                <button className={cx(btnGhost, '!px-3 !py-1.5 text-xs')}>Save</button>
              </form>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle icon="calendar" accent="sky" title="This week" right={<Pill accent="sky">{weekTotal.toLocaleString()} steps</Pill>} />
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {week.map((date) => {
              const c = steps.find((s) => s.id === date)?.count ?? 0
              const hit = c >= stepsGoal
              return (
                <div key={date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className={cx('w-full max-w-6 rounded-t-md', hit ? 'bg-clay' : 'bg-clay/35')}
                    style={{ height: `${Math.max(c > 0 ? 3 : 0, Math.min(100, (c / stepsGoal) * 100))}%`, opacity: c > 0 ? 1 : 0.15 }}
                    title={`${c.toLocaleString()} steps`}
                  />
                  <span className={cx('text-[10px]', date === today ? 'font-semibold text-ink' : 'text-mist')}>
                    {weekdayLetter(date)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-mist">
            <span>Workouts done: {workoutsDoneThisWeek}</span>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const n = Math.round(Number(fd.get('stepsGoal')))
                if (n >= 1000 && n <= 100000) void setAt(uid, '', { stepsGoal: n })
              }}
            >
              <span>Daily goal</span>
              <input type="number" name="stepsGoal" defaultValue={stepsGoal} step={1000} className={cx(inputCls, 'w-24 !py-1 !px-2 text-xs')} />
              <button className={cx(btnGhost, '!px-2.5 !py-1 text-xs')}>Set</button>
            </form>
          </div>
        </Card>
      </div>

      {/* ---------- Weekly plan ---------- */}
      {!plan || choosing ? (
        <Card className="rise-in">
          <div className="flex flex-col items-center py-4 text-center">
            <Mascot stage={2} mood="happy" size={96} />
            <h2 className="mt-3 font-display text-2xl">What does this week look like?</h2>
            <p className="mt-1 max-w-sm text-sm text-mist">
              Pick your arena and I’ll build a 7-day plan around it — workouts on training days,
              rest where you need it. The steps goal stays every day.
            </p>
            <div className="mt-6 grid w-full gap-3 sm:grid-cols-3">
              {(
                [
                  { id: 'home', title: 'Home workouts', desc: 'No equipment. Circuits, core, yoga — living-room friendly.', icon: 'home', accent: ACCENTS.sage.hex },
                  { id: 'gym', title: 'Gym workouts', desc: 'Push / pull / legs with barbells and machines. Full-send week.', icon: 'zap', accent: ACCENTS.sky.hex },
                  { id: 'both', title: 'Both', desc: 'Gym anchors your week, home sessions fill the gaps. Best of each.', icon: 'briefcase', accent: ACCENTS.clay.hex },
                ] as { id: 'home' | 'gym' | 'both'; title: string; desc: string; icon: IconName; accent: string }[]
              ).map((c) => (
                <button
                  key={c.id}
                  onClick={() => choose(c.id)}
                  className="group rounded-2xl border border-line bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span
                    className="grid size-10 place-items-center rounded-xl text-white transition-transform group-hover:scale-110"
                    style={{ backgroundColor: c.accent }}
                  >
                    <Icon name={c.icon} size={18} />
                  </span>
                  <p className="mt-3 font-display text-lg">{c.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-mist">{c.desc}</p>
                </button>
              ))}
            </div>
            {choosing && (
              <button onClick={() => setChoosing(false)} className="mt-4 text-xs text-mist hover:text-ink">
                Keep my current plan instead
              </button>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <CardTitle
            icon="calendar"
            accent="clay"
            title={`This week’s plan · ${plan.choice === 'both' ? 'Home + Gym' : plan.choice === 'home' ? 'Home' : 'Gym'}`}
            right={
              <button onClick={() => setChoosing(true)} className={cx(btnGhost, '!px-3.5 !py-1.5 text-xs')}>
                Re-pick week
              </button>
            }
          />
          <ul className="divide-y divide-line">
            {Object.entries(plan.days).map(([date, day]) => (
              <DayRow key={date} date={date} day={day} today={today} weekId={weekId} uid={uid} />
            ))}
          </ul>
          <p className="mt-3 text-xs text-mist">
            New week, new choice — I’ll ask again on Monday. Steps goal stays daily.
          </p>
        </Card>
      )}
    </div>
  )
}

/* ================================================================== */

function DayRow({
  date, day, today, weekId, uid,
}: {
  date: string
  day: PlanDay
  today: string
  weekId: string
  uid: string
}) {
  const [open, setOpen] = useState(false)
  const style = TYPE_STYLE[day.type]
  const isToday = date === today
  const hasGuide = (day.exercises?.length ?? 0) > 0

  return (
    <li className={cx('py-1', isToday && 'rounded-xl bg-cream/60 px-2 -mx-2')}>
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={() => updateAt(uid, `fitnessPlans/${weekId}`, { [`days.${date}.done`]: !day.done })}
          aria-label={day.done ? 'Mark not done' : 'Mark done'}
          className={cx(
            'grid size-7 shrink-0 place-items-center rounded-full border transition-colors',
            day.done ? 'border-transparent bg-clay text-white' : 'border-line text-transparent hover:border-clay'
          )}
        >
          <Icon name="check" size={13} />
        </button>
        <span className="w-14 shrink-0 text-xs tabular-nums text-mist">
          {weekdayLetter(date)} {pretty(date).split(' ')[0]}
        </span>
        <span className={cx('hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline', style.badge)}>
          {style.label}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cx('block truncate text-sm font-medium', day.done && 'text-mist line-through')}>
            {day.title}
          </span>
          <span className="block truncate text-xs text-mist">{day.focus}</span>
        </span>
        {isToday && <Pill accent="clay">Today</Pill>}
        {hasGuide && (
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Hide exercise guide' : 'Show exercise guide'}
            className={cx(
              'grid size-8 shrink-0 place-items-center rounded-full border border-line text-mist transition-all hover:text-ink',
              open && 'rotate-180 border-clay text-clay'
            )}
          >
            <Icon name="chev-down" size={15} />
          </button>
        )}
      </div>

      {/* exercise guide with stickman diagrams */}
      {open && hasGuide && (
        <div className="rise-in grid gap-2 pb-3 sm:grid-cols-2">
          {day.exercises!.map((e, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5">
              <span
                className={cx(
                  'grid size-14 shrink-0 place-items-center rounded-xl',
                  day.type === 'gym' ? 'bg-sky-soft text-sky' : day.type === 'rest' ? 'bg-cream text-mist' : 'bg-sage-soft text-sage'
                )}
              >
                <Stickman pose={e.pose} size={46} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{e.name}</span>
                <span className="block text-xs text-mist">{e.detail}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </li>
  )
}
