'use client'

import Link from 'next/link'
import {
  todayStr, hourNow, lastDays, prettyFull, greeting, firstName, money, monthKey, weekIdOf, cx,
} from '@/lib/util'
import {
  STAGES, STAGE_FLOORS, bloomScore, stageFor, nextStage, streak, mascotMood, MOOD_LINES,
} from '@/lib/gamification'
import { promptFor } from '@/lib/prompts'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, useDoc, toggleHabitDoc, toggleTaskDoc, saveMood, addTo } from '@/lib/store'
import type {
  Habit, HabitLog, Task, JournalEntry, SleepLog, Txn, StepLog, ReadingDaily, Book,
  FitnessPlan, LearnItem, Venture, UserProfile,
} from '@/lib/types'
import { Mascot } from '@/components/Mascot'
import { Ring } from '@/components/charts'
import {
  Card, CardTitle, Icon, MoodFace, Pill, Progress, inputCls, btnPrimary, ACCENTS, accentOf,
} from '@/components/ui'

export default function TodayPage() {
  return (
    <Shell>
      <Dashboard />
    </Shell>
  )
}

function Dashboard() {
  const user = useAuth().user!
  const uid = user.uid
  const today = todayStr()
  const hour = hourNow()
  const days14 = lastDays(14)
  const week = lastDays(7)
  const m = monthKey(today)

  const habits = useDocs<Habit>(uid, 'habits')
  const habitLogs = useDocs<HabitLog>(uid, 'habitLogs')
  const tasks = useDocs<Task>(uid, 'tasks')
  const entry = useDoc<JournalEntry>(uid, `journal/${today}`)
  const sleeps = useDocs<SleepLog>(uid, 'sleep')
  const txns = useDocs<Txn>(uid, 'txns')
  const stepsToday = useDoc<StepLog>(uid, `steps/${today}`)
  const readingToday = useDoc<ReadingDaily>(uid, `readingDaily/${today}`)
  const books = useDocs<Book>(uid, 'books')
  const plan = useDoc<FitnessPlan>(uid, `fitnessPlans/${weekIdOf(today)}`)
  const learns = useDocs<LearnItem>(uid, 'learn')
  const ventures = useDocs<Venture>(uid, 'ventures')
  const profile = useDoc<UserProfile>(uid, '')

  const loading =
    habits === null || habitLogs === null || tasks === null || sleeps === null || txns === null ||
    books === null || learns === null || ventures === null ||
    entry === undefined || stepsToday === undefined || readingToday === undefined ||
    plan === undefined || profile === undefined

  if (loading) return <PageLoader />

  /* ---- derived ---- */
  const name = profile?.name || user.displayName || 'friend'
  const stepsGoal = profile?.stepsGoal ?? 20000
  const pagesGoal = profile?.pagesGoal ?? 30

  const weekSet = new Set(week)
  const logs14 = (habitLogs ?? []).filter((l) => l.date >= days14[0])
  const logsThisWeekOf = (habitId: string) =>
    (habitLogs ?? []).filter((l) => l.habitId === habitId && weekSet.has(l.date)).length
  const doneToday = (habitId: string) =>
    (habitLogs ?? []).some((l) => l.habitId === habitId && l.date === today)

  const startTodayMs = new Date(today + 'T00:00:00').getTime()
  const tasksDoneToday = (tasks ?? []).filter((t) => t.done && t.doneAt !== null && t.doneAt >= startTodayMs).length
  const focusTasks = (tasks ?? [])
    .filter((t) => !t.done && t.due && t.due <= today)
    .sort((a, b) => (a.due! < b.due! ? -1 : 1) || b.priority - a.priority)
    .slice(0, 5)

  const stepsCount = stepsToday?.count ?? 0
  const planDoneToday = plan?.days?.[today]?.done ?? false

  const rings = [
    {
      label: 'Habits', color: ACCENTS.sage.hex,
      value: habits!.length
        ? habits!.reduce((s, h) => s + Math.min(1, logsThisWeekOf(h.id) / h.perWeek), 0) / habits!.length
        : 0,
    },
    { label: 'Tasks', color: ACCENTS.sky.hex, value: Math.min(1, tasksDoneToday / 3) },
    {
      label: 'Mind', color: ACCENTS.lilac.hex,
      value: (entry?.mood ? 0.5 : 0) + (entry?.body?.trim() ? 0.5 : 0),
    },
    {
      label: 'Body', color: ACCENTS.clay.hex,
      value: (sleeps!.some((s) => s.id === today) ? 0.4 : 0) + (stepsCount >= stepsGoal || planDoneToday ? 0.6 : 0),
    },
    { label: 'Money', color: ACCENTS.sand.hex, value: txns!.some((t) => t.date === today) ? 1 : 0 },
  ]
  const ringAvg = rings.reduce((s, r) => s + r.value, 0) / rings.length
  const mood = mascotMood(ringAvg)

  const done14 = logs14.length
  const activeDays = new Set(logs14.map((l) => l.date)).size
  const score = bloomScore(done14, habits!.length * 14, activeDays, 14)
  const stage = stageFor(score)
  const next = nextStage(score)
  const floorPct = next ? ((score - STAGE_FLOORS[stage]) / (next.floor - STAGE_FLOORS[stage])) * 100 : 100

  const streaks = habits!.map((h) => ({
    name: h.name,
    s: streak(new Set((habitLogs ?? []).filter((l) => l.habitId === h.id).map((l) => l.date)), today),
  }))
  const best = streaks.sort((a, b) => b.s - a.s)[0]
  const line = MOOD_LINES[mood][Number(today.replaceAll('-', '')) % MOOD_LINES[mood].length]

  /* snapshots */
  const lastSleep = sleeps!.filter((s) => s.id <= today).sort((a, b) => b.id.localeCompare(a.id))[0]
  const weekSleeps = sleeps!.filter((s) => s.id >= week[0])
  const avgSleep = weekSleeps.length
    ? Math.round((weekSleeps.reduce((s, x) => s + x.hours, 0) / weekSleeps.length) * 10) / 10
    : null
  const monthTxns = txns!.filter((t) => t.date.startsWith(m))
  const out = monthTxns.filter((t) => t.kind === 'out').reduce((s, t) => s + t.amount, 0)
  const inn = monthTxns.filter((t) => t.kind === 'in').reduce((s, t) => s + t.amount, 0)

  const pagesRead = readingToday?.total ?? 0
  const currentBook = [...books!].sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0))[0]
  const todayWorkout = plan?.days?.[today]
  const activeVentures = ventures!.filter((v) => v.stage !== 'idea')
  const course = learns!.filter((l) => !l.done)[0]

  return (
    <div className="space-y-4">
      {/* ---------- Hero ---------- */}
      <Card>
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm text-mist">{prettyFull(today)}</p>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">
              {greeting(hour)}, {firstName(name)}.
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Pill accent="sage">
                <Icon name="spark" size={12} /> {STAGES[stage]} stage · {score} pts
              </Pill>
              {best && best.s > 1 && (
                <Pill accent="clay">
                  <Icon name="flame" size={12} /> {best.s}-day streak · {best.name}
                </Pill>
              )}
            </div>
            {next ? (
              <div className="mt-4 max-w-xs">
                <div className="mb-1 flex justify-between text-xs text-mist">
                  <span>Path to {next.label}</span>
                  <span className="tabular-nums">{score}/{next.floor}</span>
                </div>
                <Progress value={floorPct} accent="sage" />
              </div>
            ) : (
              <p className="mt-4 text-sm font-medium text-sage">Fully in bloom. Beautiful work.</p>
            )}
          </div>
          <div className="relative justify-self-center">
            <div className="absolute -top-2 right-[92%] hidden w-52 rounded-2xl rounded-br-sm border border-line bg-cream px-4 py-3 text-sm text-ink/80 sm:block">
              {line}
            </div>
            <Mascot stage={stage} mood={mood} size={148} />
          </div>
        </div>
      </Card>

      {/* ---------- Rings ---------- */}
      <Card>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg">Today’s rings</h2>
          <span className="text-xs text-mist">Close all five and watch Pip bounce</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-4">
          {rings.map((r) => (
            <Ring key={r.label} {...r} />
          ))}
        </div>
      </Card>

      {/* ---------- Main grid ---------- */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Habits */}
        <Card>
          <CardTitle icon="leaf" accent="sage" title="Today’s habits" href="/habits" />
          {habits!.length === 0 ? (
            <p className="text-sm text-mist">
              No habits yet.{' '}
              <Link href="/habits" className="font-medium text-sage hover:underline">Plant your first</Link>{' '}
              — tiny ones count.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {habits!.map((h) => {
                const done = doneToday(h.id)
                const acc = ACCENTS[accentOf(h.accent)]
                const s = streaks.find((x) => x.name === h.name)?.s ?? 0
                return (
                  <li key={h.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-cream/60">
                    <button
                      onClick={() => toggleHabitDoc(uid, h.id, today)}
                      aria-label={`Toggle ${h.name}`}
                      className={cx(
                        'grid size-7 place-items-center rounded-full border transition-colors',
                        done ? acc.solid + ' border-transparent text-white' : 'border-line text-transparent hover:border-mist/50'
                      )}
                    >
                      <Icon name="check" size={14} />
                    </button>
                    <span className={cx('flex-1 text-sm', done && 'text-mist line-through')}>{h.name}</span>
                    {s > 1 && (
                      <span className="flex items-center gap-0.5 text-xs font-medium text-clay">
                        <Icon name="flame" size={12} />{s}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Mind check-in */}
        <Card>
          <CardTitle icon="book" accent="lilac" title="Mind check-in" href="/journal" />
          <p className="text-xs text-mist">How are you feeling right now?</p>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((l) => (
              <button
                key={l}
                onClick={() => saveMood(uid, today, l)}
                aria-label={`Mood ${l}`}
                className={cx(
                  'rounded-full p-1 transition-colors',
                  entry?.mood === l ? 'bg-lilac-soft text-lilac' : 'text-mist hover:bg-cream'
                )}
              >
                <MoodFace level={l} size={30} />
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-cream/70 px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-mist">
              <Icon name="spark" size={12} /> Prompt of the day
            </p>
            <p className="mt-1 text-sm italic text-ink/80">“{promptFor(today)}”</p>
          </div>
        </Card>

        {/* Focus */}
        <Card>
          <CardTitle icon="square-check" accent="sky" title="Today’s focus" href="/tasks" />
          <FocusAdd uid={uid} today={today} />
          {focusTasks.length === 0 ? (
            <p className="px-1 py-3 text-sm text-mist">Nothing due. Enjoy the calm.</p>
          ) : (
            <ul className="space-y-0.5">
              {focusTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-cream/60">
                  <button
                    onClick={() => toggleTaskDoc(uid, t)}
                    aria-label={`Complete ${t.title}`}
                    className="grid size-6 place-items-center rounded-full border border-line text-transparent transition-colors hover:border-sky"
                  >
                    <Icon name="check" size={12} />
                  </button>
                  <span className="flex-1 text-sm">{t.title}</span>
                  {t.due && t.due < today && <Pill accent="rose">Overdue</Pill>}
                  {t.priority === 2 && <Pill accent="sand">High</Pill>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Fitness */}
        <Card>
          <CardTitle icon="zap" accent="clay" title="Fitness" href="/fitness" />
          <div className="flex items-center gap-4">
            <Ring label="steps" value={Math.min(1, stepsCount / stepsGoal)} color={ACCENTS.clay.hex} size={72} />
            <div className="min-w-0">
              <p className="font-display text-2xl tabular-nums">{stepsCount.toLocaleString()}</p>
              <p className="text-xs text-mist">of {stepsGoal.toLocaleString()} steps</p>
              {todayWorkout && (
                <p className="mt-2 truncate text-xs">
                  <span className={cx('font-medium', todayWorkout.done ? 'text-sage' : 'text-clay')}>
                    {todayWorkout.done ? '✓ ' : ''}{todayWorkout.title}
                  </span>
                  <span className="text-mist">{todayWorkout.type !== 'rest' ? ` · ${todayWorkout.type}` : ''}</span>
                </p>
              )}
              {!plan && (
                <Link href="/fitness" className="mt-2 block text-xs font-medium text-clay hover:underline">
                  Set up this week’s plan →
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* Reading */}
        <Card>
          <CardTitle icon="library" accent="sky" title="Reading" href="/library" />
          <div className="mb-1.5 flex justify-between text-xs text-mist">
            <span>Today’s pages</span>
            <span className="tabular-nums">{pagesRead}/{pagesGoal}</span>
          </div>
          <Progress value={(pagesRead / pagesGoal) * 100} accent="sky" />
          {currentBook ? (
            <Link href={`/reader?book=${currentBook.id}`} className="mt-3 flex items-center gap-2 rounded-xl bg-sky-soft/60 px-3 py-2.5 text-sm transition-colors hover:bg-sky-soft">
              <Icon name="book" size={14} className="shrink-0 text-sky" />
              <span className="min-w-0 flex-1 truncate">Continue “{currentBook.title}”</span>
              <span className="text-xs tabular-nums text-mist">{currentBook.pct}%</span>
            </Link>
          ) : (
            <p className="mt-3 text-sm text-mist">
              Shelf is empty.{' '}
              <Link href="/library" className="font-medium text-sky hover:underline">Upload a book</Link> — 30 pages a day.
            </p>
          )}
        </Card>

        {/* Money */}
        <Card>
          <CardTitle icon="wallet" accent="sand" title="Money" href="/money" />
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-4xl">{money(out)}</span>
            <span className="text-sm text-mist">spent this month</span>
          </div>
          <p className="mt-1.5 text-xs text-mist">
            Net {money(inn - out)} · {monthTxns.length} {monthTxns.length === 1 ? 'entry' : 'entries'}
          </p>
        </Card>

        {/* Sleep */}
        <Card>
          <CardTitle icon="heart" accent="lilac" title="Sleep" href="/health" />
          {lastSleep ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl">{lastSleep.hours}</span>
                <span className="text-sm text-mist">hours last logged</span>
              </div>
              <p className="mt-1.5 text-xs text-mist">
                Quality: {['', 'Rough', 'Restless', 'Okay', 'Good', 'Deep'][lastSleep.quality]}
                {avgSleep ? ` · 7-day avg ${avgSleep}h` : ''}
              </p>
            </>
          ) : (
            <p className="text-sm text-mist">
              No sleep logged yet.{' '}
              <Link href="/health" className="font-medium text-clay hover:underline">Log last night</Link>.
            </p>
          )}
        </Card>

        {/* Learn */}
        <Card>
          <CardTitle icon="grad" accent="sage" title="Learning" href="/learn" />
          {course ? (
            <>
              <p className="truncate font-display text-lg">{course.title}</p>
              <p className="mb-3 text-xs text-mist">
                {course.kind}{course.creator ? ` · ${course.creator}` : ''}
                {course.deadline && ` · due ${course.deadline}`}
              </p>
              <Progress value={course.progress} accent="sage" />
              <p className="mt-1.5 text-xs tabular-nums text-mist">{course.progress}% complete</p>
            </>
          ) : (
            <p className="text-sm text-mist">
              Nothing in progress.{' '}
              <Link href="/learn" className="font-medium text-sage hover:underline">Add a course or skill</Link>.
            </p>
          )}
        </Card>

        {/* Business */}
        <Card>
          <CardTitle icon="briefcase" accent="rose" title="Business" href="/business" />
          {ventures!.length > 0 ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl">{activeVentures.length}</span>
                <span className="text-sm text-mist">active {activeVentures.length === 1 ? 'venture' : 'ventures'}</span>
              </div>
              <p className="mt-1.5 text-xs text-mist">
                {ventures!.length - activeVentures.length > 0 ? `${ventures!.length - activeVentures.length} in the idea bank · ` : ''}
                grown with intention
              </p>
            </>
          ) : (
            <p className="text-sm text-mist">
              No ventures yet.{' '}
              <Link href="/business" className="font-medium text-rose hover:underline">Plant your first one</Link>.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}

function FocusAdd({ uid, today }: { uid: string; today: string }) {
  return (
    <form
      className="mb-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const input = e.currentTarget.elements.namedItem('title') as HTMLInputElement
        const title = input.value.trim()
        if (!title) return
        void addTo(uid, 'tasks', { title, due: today, priority: 1, done: false, doneAt: null, createdAt: Date.now() })
        input.value = ''
      }}
    >
      <input name="title" placeholder="Add one meaningful thing…" className={inputCls} />
      <button type="submit" className={btnPrimary} aria-label="Add task">
        <Icon name="plus" size={15} />
      </button>
    </form>
  )
}
