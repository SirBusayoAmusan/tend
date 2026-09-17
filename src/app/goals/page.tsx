'use client'

import { pretty, clamp, cx } from '@/lib/util'
import { downloadIcs, type IcsEvent } from '@/lib/ical'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, useDoc, addTo, setAt, updateAt, removeAt } from '@/lib/store'
import type { Goal, Milestone } from '@/lib/types'
import {
  PageHeader, Card, Empty, Icon, Pill, Field, inputCls, btnPrimary, btnGhost, GOAL_DOMAINS, domainAccent,
} from '@/components/ui'

export default function GoalsPage() {
  return (
    <Shell>
      <Goals />
    </Shell>
  )
}

function Goals() {
  const uid = useAuth().user!.uid
  const goals = useDocs<Goal>(uid, 'goals')
  if (goals === null) return <PageLoader />

  const sorted = [...goals].sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt)

  const addGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const title = String(fd.get('title') || '').trim()
    if (!title) return
    void addTo(uid, 'goals', {
      title,
      why: String(fd.get('why') || '').trim() || null,
      domain: String(fd.get('domain') || 'growth'),
      targetDate: String(fd.get('targetDate') || '') || null,
      progress: 0,
      done: false,
      createdAt: Date.now(),
    })
    e.currentTarget.reset()
  }

  const exportCalendar = () => {
    const events: IcsEvent[] = goals
      .filter((g) => !g.done && g.targetDate)
      .map((g) => ({
        uid: `goal-${g.id}`,
        title: `🎯 Goal: ${g.title}`,
        date: g.targetDate!,
        description: g.why ? `Why: ${g.why}` : 'Tend goal',
      }))
    if (events.length === 0) {
      alert('No goals with a target date yet.')
      return
    }
    downloadIcs('tend-goals.ics', events)
  }

  return (
    <div>
      <PageHeader
        title="Goals"
        sub="Direction, then small repeated steps. Write the why down — you’ll need it."
        action={
          <div className="flex flex-col items-end gap-1">
            <button onClick={exportCalendar} className={btnGhost}>
              <Icon name="calendar" size={15} /> Goals → calendar
            </button>
            <p className="text-[11px] text-mist">Open the .ics file on your phone to add them</p>
          </div>
        }
      />

      <Card className="mb-5">
        <form onSubmit={addGoal} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_9rem_10rem] md:items-end">
            <Field label="Goal">
              <input name="title" placeholder="e.g. Run a 10k, save ₦500k, finish my portfolio" className={inputCls} />
            </Field>
            <Field label="Domain">
              <select name="domain" className={inputCls} defaultValue="growth">
                {GOAL_DOMAINS.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Target date">
              <input type="date" name="targetDate" className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <Field label="Why it matters">
              <input name="why" placeholder="The reason you’ll keep going when it gets boring" className={inputCls} />
            </Field>
            <button type="submit" className={btnPrimary}>
              <Icon name="target" size={15} /> Set goal
            </button>
          </div>
        </form>
      </Card>

      {sorted.length === 0 ? (
        <Empty
          title="No goals yet"
          hint="A goal is a promise to your future self. Pick one that excites you a little and scares you a little."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sorted.map((g) => (
            <GoalCard key={g.id} goal={g} uid={uid} />
          ))}
        </div>
      )}
    </div>
  )
}

function GoalCard({ goal: g, uid }: { goal: Goal & { id: string }; uid: string }) {
  const milestones = useDocs<Milestone>(uid, `goals/${g.id}/milestones`)
  const dAcc = domainAccent(g.domain)
  const ms = milestones ?? []
  const doneMs = ms.filter((x) => x.done).length

  const saveProgress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const progress = clamp(Number(fd.get('progress')) || 0, 0, 100)
    void updateAt(uid, `goals/${g.id}`, { progress, done: progress >= 100 })
  }

  const addMilestone = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const title = String(fd.get('title') || '').trim()
    if (!title) return
    void addTo(uid, `goals/${g.id}/milestones`, { title, done: false })
    e.currentTarget.reset()
  }

  return (
    <Card className={cx(g.done && 'bg-sage-soft/40')}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill accent={dAcc}>{GOAL_DOMAINS.find((d) => d.id === g.domain)?.label ?? g.domain}</Pill>
        {g.targetDate && (
          <Pill accent="sand">
            <Icon name="calendar" size={11} /> {pretty(g.targetDate)}
          </Pill>
        )}
        {g.done && (
          <Pill accent="sage">
            <Icon name="check" size={11} /> Achieved
          </Pill>
        )}
        <button
          onClick={() => removeAt(uid, `goals/${g.id}`)}
          title="Delete goal"
          className="ml-auto text-mist/60 transition-colors hover:text-rose"
        >
          <Icon name="trash" size={15} />
        </button>
      </div>

      <h3 className="mt-3 font-display text-xl">{g.title}</h3>
      {g.why && <p className="mt-1 text-sm italic text-mist">“{g.why}”</p>}

      {ms.length > 0 && (
        <ul className="mt-4 space-y-1">
          {ms.map((x) => (
            <li key={x.id} className="flex items-center gap-2.5 text-sm">
              <button
                onClick={() => updateAt(uid, `goals/${g.id}/milestones/${x.id}`, { done: !x.done })}
                aria-label={x.done ? 'Uncheck milestone' : 'Check milestone'}
                className={cx(
                  'grid size-5 place-items-center rounded-full border transition-colors',
                  x.done ? 'border-transparent bg-sage text-white' : 'border-line text-transparent hover:border-sage'
                )}
              >
                <Icon name="check" size={11} />
              </button>
              <span className={cx(x.done && 'text-mist line-through')}>{x.title}</span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={addMilestone} className="mt-3 flex gap-2">
        <input name="title" placeholder="Add a milestone…" className={cx(inputCls, 'py-1.5 text-xs')} />
        <button type="submit" className={cx(btnGhost, 'px-3 py-1.5 text-xs')}>
          <Icon name="plus" size={13} />
        </button>
      </form>

      <form onSubmit={saveProgress} className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs text-mist">
          <span>
            Progress
            {ms.length > 0 && ` · ${doneMs}/${ms.length} milestones`}
          </span>
          <span className="tabular-nums">{g.progress}%</span>
        </div>
        <div className="flex items-center gap-3">
          <input type="range" name="progress" min={0} max={100} step={5} defaultValue={g.progress} className="min-w-0 flex-1" />
          <button type="submit" className={cx(btnGhost, 'px-3.5 py-1.5 text-xs')}>Save</button>
        </div>
      </form>
    </Card>
  )
}
