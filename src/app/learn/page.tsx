'use client'

import { clamp, cx } from '@/lib/util'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, addTo, updateAt, removeAt } from '@/lib/store'
import type { LearnItem } from '@/lib/types'
import {
  PageHeader, Card, Empty, Icon, Pill, Progress, Field, inputCls, btnPrimary, btnGhost,
} from '@/components/ui'

const KIND_LABEL: Record<string, string> = {
  course: 'Course',
  skill: 'Skill',
  other: 'Other',
}

export default function LearnPage() {
  return (
    <Shell>
      <Learn />
    </Shell>
  )
}

function Learn() {
  const uid = useAuth().user!.uid
  const items = useDocs<LearnItem>(uid, 'learn')
  if (items === null) return <PageLoader />

  const active = items.filter((i) => !i.done).sort((a, b) => b.createdAt - a.createdAt)
  const finished = items.filter((i) => i.done).sort((a, b) => b.createdAt - a.createdAt)

  const addItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const title = String(fd.get('title') || '').trim()
    if (!title) return
    void addTo(uid, 'learn', {
      title,
      kind: String(fd.get('kind') || 'course'),
      creator: String(fd.get('creator') || '').trim() || null,
      progress: 0,
      done: false,
      note: null,
      createdAt: Date.now(),
    })
    e.currentTarget.reset()
  }

  const saveItem = (id: string) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const progress = clamp(Number(fd.get('progress')) || 0, 0, 100)
    void updateAt(uid, `learn/${id}`, {
      progress,
      note: String(fd.get('note') || '').trim() || null,
      done: progress >= 100,
    })
  }

  return (
    <div>
      <PageHeader title="Learn" sub="Courses, skills and everything beyond books. (Books live in your Library.)" />

      <Card className="mb-5">
        <form onSubmit={addItem} className="grid gap-3 md:grid-cols-[1fr_9rem_1fr_auto] md:items-end">
          <Field label="What are you learning?">
            <input name="title" placeholder="e.g. Figma course, CSS grid, public speaking" className={inputCls} />
          </Field>
          <Field label="Type">
            <select name="kind" className={inputCls} defaultValue="course">
              {Object.entries(KIND_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Source (optional)">
            <input name="creator" placeholder="e.g. Coursera, YouTube" className={inputCls} />
          </Field>
          <button type="submit" className={btnPrimary}>
            <Icon name="plus" size={15} /> Add
          </button>
        </form>
      </Card>

      {active.length === 0 && finished.length === 0 ? (
        <Empty title="Nothing in progress" hint="Add the course or skill you’re currently working on." />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {active.map((i) => (
              <Card key={i.id}>
                <div className="flex items-center gap-2">
                  <Pill accent="sky">{KIND_LABEL[i.kind] ?? i.kind}</Pill>
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => updateAt(uid, `learn/${i.id}`, { done: true, progress: 100 })}
                      title="Mark finished"
                      className="grid size-7 place-items-center rounded-full text-mist/70 transition-colors hover:bg-sage-soft hover:text-sage"
                    >
                      <Icon name="check" size={14} />
                    </button>
                    <button
                      onClick={() => removeAt(uid, `learn/${i.id}`)}
                      title="Remove"
                      className="grid size-7 place-items-center rounded-full text-mist/70 transition-colors hover:bg-rose-soft hover:text-rose"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </span>
                </div>
                <h3 className="mt-2.5 font-display text-xl">{i.title}</h3>
                {i.creator && <p className="mt-0.5 text-sm text-mist">{i.creator}</p>}

                <div className="mt-4 mb-1 flex justify-between text-xs text-mist">
                  <span>Progress</span>
                  <span className="tabular-nums">{i.progress}%</span>
                </div>
                <Progress value={i.progress} accent="sky" />

                <form onSubmit={saveItem(i.id)} className="mt-4 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <input type="range" name="progress" min={0} max={100} step={5} defaultValue={i.progress} className="min-w-0 flex-1" />
                    <button type="submit" className={cx(btnGhost, 'px-3.5 py-1.5 text-xs')}>Save</button>
                  </div>
                  <input name="note" defaultValue={i.note ?? ''} placeholder="Where did you stop? One-line note…" className={cx(inputCls, 'py-2 text-xs')} />
                </form>
              </Card>
            ))}
          </div>

          {finished.length > 0 && (
            <>
              <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-mist">Finished shelf</h3>
              <Card>
                <ul className="divide-y divide-line">
                  {finished.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 py-2.5">
                      <span className="grid size-7 place-items-center rounded-full bg-sage-soft text-sage">
                        <Icon name="check" size={13} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{i.title}</span>
                        <span className="text-xs text-mist">
                          {KIND_LABEL[i.kind] ?? i.kind}{i.creator ? ` · ${i.creator}` : ''}
                        </span>
                      </span>
                      <button onClick={() => updateAt(uid, `learn/${i.id}`, { done: false })} className="text-xs text-mist hover:text-ink">
                        Reopen
                      </button>
                      <button
                        onClick={() => removeAt(uid, `learn/${i.id}`)}
                        title="Remove"
                        className="grid size-7 place-items-center rounded-full text-mist/70 transition-colors hover:bg-rose-soft hover:text-rose"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
