'use client'

import { todayStr, pretty, clamp, cx } from '@/lib/util'
import { downloadIcs, type IcsEvent } from '@/lib/ical'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, addTo, removeAt, toggleTaskDoc } from '@/lib/store'
import type { Task, Goal, Doc, TaskRecur } from '@/lib/types'
import {
  PageHeader, Card, Empty, Icon, Pill, Field, inputCls, btnPrimary, btnGhost,
} from '@/components/ui'

const RECUR_LABEL: Record<string, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekly: 'Weekly',
}

const ICS_DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function rruleFor(t: Doc<Task>): string | undefined {
  if (!t.due) return undefined
  switch (t.recur) {
    case 'daily': return 'FREQ=DAILY'
    case 'weekdays': return 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
    case 'weekly': return `FREQ=WEEKLY;BYDAY=${ICS_DAY[new Date(t.due + 'T12:00:00').getDay()]}`
    default: return undefined
  }
}

function TaskRow({ t, today, uid }: { t: Doc<Task>; today: string; uid: string }) {
  const overdue = !t.done && t.due !== null && t.due < today
  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-cream/60">
      <button
        onClick={() => toggleTaskDoc(uid, t)}
        aria-label={t.done ? 'Reopen task' : 'Complete task'}
        className={cx(
          'grid size-6 shrink-0 place-items-center rounded-full border transition-colors',
          t.done ? 'border-transparent bg-sky text-white' : 'border-line text-transparent hover:border-sky'
        )}
      >
        <Icon name="check" size={12} />
      </button>
      <span className={cx('flex-1 text-sm', t.done && 'text-mist line-through')}>{t.title}</span>
      {t.recur && t.recur !== 'none' && (
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-sky" title={`Repeats ${RECUR_LABEL[t.recur].toLowerCase()} — completing it schedules the next one`}>
          <Icon name="repeat" size={12} /> {RECUR_LABEL[t.recur]}
        </span>
      )}
      {t.priority === 2 && !t.done && <Pill accent="rose">High</Pill>}
      {t.priority === 0 && !t.done && <Pill accent="sand">Low</Pill>}
      {t.due && (
        <span className={cx('shrink-0 text-xs tabular-nums', overdue ? 'font-medium text-rose' : 'text-mist')}>
          {t.due === today ? 'Today' : pretty(t.due)}
        </span>
      )}
      <button
        onClick={() => removeAt(uid, `tasks/${t.id}`)}
        title="Delete task"
        className="shrink-0 text-mist opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  )
}

function Group({ label, tasks, today, uid }: { label: string; tasks: Doc<Task>[]; today: string; uid: string }) {
  if (tasks.length === 0) return null
  return (
    <section>
      <h3 className="mb-1 mt-6 text-xs font-semibold uppercase tracking-wider text-mist first:mt-0">
        {label} <span className="tabular-nums">({tasks.length})</span>
      </h3>
      <div className="space-y-0.5">
        {tasks.map((t) => (
          <TaskRow key={t.id} t={t} today={today} uid={uid} />
        ))}
      </div>
    </section>
  )
}

export default function TasksPage() {
  return (
    <Shell>
      <Tasks />
    </Shell>
  )
}

function Tasks() {
  const uid = useAuth().user!.uid
  const today = todayStr()
  const tasks = useDocs<Task>(uid, 'tasks')
  const goals = useDocs<Goal>(uid, 'goals')
  if (tasks === null || goals === null) return <PageLoader />

  const dueSorted = [...tasks].sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || b.priority - a.priority)
  const overdue = dueSorted.filter((t) => !t.done && t.due && t.due < today)
  const dueToday = dueSorted.filter((t) => !t.done && t.due === today)
  const upcoming = dueSorted.filter((t) => !t.done && t.due && t.due > today)
  const anytime = dueSorted.filter((t) => !t.done && !t.due)
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)).slice(0, 12)

  const addTask = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    e.preventDefault()
    const fd = new FormData(form)
    const title = String(fd.get('title') || '').trim()
    if (!title) return
    void addTo(uid, 'tasks', {
      title,
      due: String(fd.get('due') || '') || null,
      priority: clamp(Number(fd.get('priority')) || 1, 0, 2),
      recur: (String(fd.get('recur') || 'none') as TaskRecur),
      done: false,
      doneAt: null,
      createdAt: Date.now(),
    })
    form.reset()
  }

  /** Calendar sync: open tasks (with true recurrence) + goals with target dates. */
  const exportCalendar = () => {
    const events: IcsEvent[] = []
    for (const t of tasks) {
      if (!t.done && t.due) {
        const rrule = rruleFor(t)
        events.push({
          uid: `task-${t.id}`,
          title: `☐ ${t.title}${rrule ? ' 🔄' : ''}`,
          date: t.due,
          rrule,
          description: `Tend task${t.priority === 2 ? ' · high priority' : ''}${t.recur && t.recur !== 'none' ? ` · repeats ${RECUR_LABEL[t.recur].toLowerCase()}` : ''}`,
        })
      }
    }
    for (const g of goals) {
      if (!g.done && g.targetDate) {
        events.push({
          uid: `goal-${g.id}`,
          title: `🎯 Goal: ${g.title}`,
          date: g.targetDate,
          description: g.why ? `Why: ${g.why}` : 'Tend goal',
        })
      }
    }
    if (events.length === 0) {
      alert('No dated tasks or goals yet — add due dates first.')
      return
    }
    downloadIcs('tend-lifeos.ics', events)
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        sub="Three meaningful things a day beats thirty busy ones."
        action={
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <button onClick={exportCalendar} className={btnGhost}>
              <Icon name="calendar" size={15} /> Sync to phone calendar
            </button>
            <p className="text-[11px] text-mist">Open the .ics file on your phone — recurring tasks repeat there too</p>
          </div>
        }
      />

      <Card className="mb-5">
        <form onSubmit={addTask} className="grid gap-3 md:grid-cols-[1fr_10rem_9rem_9rem_auto] md:items-end">
          <Field label="Task">
            <input name="title" placeholder="What needs doing?" className={inputCls} />
          </Field>
          <Field label="Due">
            <input type="date" name="due" className={inputCls} />
          </Field>
          <Field label="Priority">
            <select name="priority" className={inputCls} defaultValue="1">
              <option value="0">Low</option>
              <option value="1">Normal</option>
              <option value="2">High</option>
            </select>
          </Field>
          <Field label="Repeats">
            <select name="recur" className={inputCls} defaultValue="none">
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Weekly</option>
            </select>
          </Field>
          <button type="submit" className={btnPrimary}>
            <Icon name="plus" size={15} /> Add
          </button>
        </form>
        <p className="mt-2 text-[11px] text-mist">
          Completing a repeating task schedules its next occurrence automatically.
        </p>
      </Card>

      {tasks.length === 0 ? (
        <Empty title="A clear slate" hint="Add your first task above — or just enjoy a genuinely empty list." />
      ) : (
        <Card>
          <Group label="Overdue" tasks={overdue} today={today} uid={uid} />
          <Group label="Today" tasks={dueToday} today={today} uid={uid} />
          <Group label="Upcoming" tasks={upcoming} today={today} uid={uid} />
          <Group label="Anytime" tasks={anytime} today={today} uid={uid} />
          <Group label="Done" tasks={done} today={today} uid={uid} />
        </Card>
      )}
    </div>
  )
}
