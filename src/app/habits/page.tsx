'use client'

import { todayStr, lastDays, pretty, weekdayLetter, clamp, cx } from '@/lib/util'
import { streak } from '@/lib/gamification'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, addTo, removeAt, toggleHabitDoc } from '@/lib/store'
import type { Habit, HabitLog } from '@/lib/types'
import {
  PageHeader, Card, Empty, Icon, Pill, Progress, Field, btnPrimary, inputCls, ACCENTS, accentOf, type Accent,
} from '@/components/ui'

const ACCENT_OPTIONS: { value: Accent; label: string }[] = [
  { value: 'sage', label: 'Sage' }, { value: 'sky', label: 'Sky' }, { value: 'lilac', label: 'Lilac' },
  { value: 'clay', label: 'Clay' }, { value: 'sand', label: 'Sand' }, { value: 'rose', label: 'Rose' },
]

const STARTERS: Habit[] = [
  { name: 'Drink a glass of water on waking', accent: 'sky', perWeek: 7 },
  { name: 'Move for 30 minutes', accent: 'clay', perWeek: 5 },
  { name: 'Read 10 pages', accent: 'sage', perWeek: 5 },
]

export default function HabitsPage() {
  return (
    <Shell>
      <Habits />
    </Shell>
  )
}

function Habits() {
  const uid = useAuth().user!.uid
  const today = todayStr()
  const week = lastDays(7)
  const weekSet = new Set(week)

  const habits = useDocs<Habit>(uid, 'habits')
  const logs = useDocs<HabitLog>(uid, 'habitLogs')
  if (habits === null || logs === null) return <PageLoader />

  const sorted = [...habits].sort((a: Habit & { id: string; createdAt?: number }, b) => ((a as any).createdAt ?? 0) - ((b as any).createdAt ?? 0))

  const addHabit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    if (!name) return
    void addTo(uid, 'habits', {
      name,
      accent: String(fd.get('accent') || 'sage'),
      perWeek: clamp(Number(fd.get('perWeek')) || 7, 1, 7),
      createdAt: Date.now(),
    })
    e.currentTarget.reset()
  }

  return (
    <div>
      <PageHeader title="Habits" sub="Small things, done often, become who you are." />

      <Card className="mb-5">
        <form onSubmit={addHabit} className="grid gap-3 md:grid-cols-[1fr_9rem_9rem_auto] md:items-end">
          <Field label="New habit">
            <input name="name" placeholder="e.g. Meditate for 5 minutes" className={inputCls} />
          </Field>
          <Field label="Colour">
            <select name="accent" className={inputCls} defaultValue="sage">
              {ACCENT_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Frequency">
            <select name="perWeek" className={inputCls} defaultValue="7">
              {[7, 6, 5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n === 7 ? 'Every day' : `${n}× per week`}</option>
              ))}
            </select>
          </Field>
          <button type="submit" className={btnPrimary}>
            <Icon name="plus" size={15} /> Plant habit
          </button>
        </form>
      </Card>

      {sorted.length === 0 ? (
        <Empty
          title="Nothing planted yet"
          hint="Habits are the seeds of your Life OS. Start with one or two — you can even begin with the classics."
        >
          <button
            onClick={() => STARTERS.forEach((s) => void addTo(uid, 'habits', { ...s, createdAt: Date.now() }))}
            className={btnPrimary}
          >
            <Icon name="spark" size={15} /> Plant three starter habits
          </button>
        </Empty>
      ) : (
        <div className="space-y-4">
          {sorted.map((h) => {
            const dates = new Set(logs.filter((l) => l.habitId === h.id).map((l) => l.date))
            const s = streak(dates, today)
            const doneThisWeek = logs.filter((l) => l.habitId === h.id && weekSet.has(l.date)).length
            const key = accentOf(h.accent)
            const acc = ACCENTS[key]
            return (
              <Card key={h.id}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={cx('size-2.5 rounded-full', acc.solid)} />
                  <h3 className="font-display text-lg">{h.name}</h3>
                  {s > 1 && (
                    <Pill accent="clay">
                      <Icon name="flame" size={11} /> {s}-day streak
                    </Pill>
                  )}
                  <button
                    onClick={() => removeAt(uid, `habits/${h.id}`)}
                    title="Delete habit"
                    className="ml-auto text-mist/60 transition-colors hover:text-rose"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex gap-1.5">
                    {week.map((d) => {
                      const done = dates.has(d)
                      return (
                        <button
                          key={d}
                          onClick={() => toggleHabitDoc(uid, h.id, d)}
                          title={`${pretty(d)} — tap to ${done ? 'uncheck' : 'check'}`}
                          className={cx(
                            'grid size-8 place-items-center rounded-full border text-[10px] transition-colors',
                            done ? cx(acc.solid, 'border-transparent text-white') : 'border-line text-mist hover:border-mist/50',
                            d === today && !done && 'border-mist/60'
                          )}
                        >
                          {done ? <Icon name="check" size={13} /> : weekdayLetter(d)}
                        </button>
                      )
                    })}
                  </div>
                  <div className="min-w-40 flex-1">
                    <Progress value={Math.min(1, doneThisWeek / h.perWeek) * 100} accent={key} />
                    <p className="mt-1 text-xs tabular-nums text-mist">{doneThisWeek}/{h.perWeek} this week</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
