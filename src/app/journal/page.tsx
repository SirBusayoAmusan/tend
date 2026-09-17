'use client'

import { useEffect, useRef, useState } from 'react'
import { todayStr, pretty, prettyFull, cx } from '@/lib/util'
import { promptFor } from '@/lib/prompts'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, useDoc, setAt, removeAt } from '@/lib/store'
import type { JournalEntry } from '@/lib/types'
import { PageHeader, Card, Icon, MoodFace, inputCls, btnPrimary } from '@/components/ui'

export default function JournalPage() {
  return (
    <Shell>
      <Journal />
    </Shell>
  )
}

function Journal() {
  const uid = useAuth().user!.uid
  const today = todayStr()
  const entry = useDoc<JournalEntry>(uid, `journal/${today}`)
  const entries = useDocs<JournalEntry>(uid, 'journal')

  const [mood, setMood] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)
  const initialised = useRef(false)

  useEffect(() => {
    if (!initialised.current && entry !== undefined) {
      initialised.current = true
      setMood(entry?.mood ?? null)
      setTitle(entry?.title ?? '')
      setBody(entry?.body ?? '')
    }
  }, [entry])

  if (entries === null || entry === undefined) return <PageLoader />

  const past = entries
    .filter((e) => e.id !== today)
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 31)

  const save = async () => {
    await setAt(uid, `journal/${today}`, { date: today, mood, title: title.trim() || null, body, updatedAt: Date.now() })
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  const pickMood = (l: number) => {
    setMood(l)
    void setAt(uid, `journal/${today}`, { date: today, mood: l, updatedAt: Date.now() })
  }

  return (
    <div>
      <PageHeader title="Journal" sub="One honest page a day. Write for you, not for an audience." />

      <Card className="mb-5">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg">Today’s page</h2>
          <span className="text-xs text-mist">{prettyFull(today)}</span>
        </div>
        <p className="mb-4 flex items-start gap-1.5 text-sm text-mist">
          <Icon name="spark" size={14} className="mt-0.5 shrink-0 text-lilac" />
          <span className="italic">“{promptFor(today)}”</span>
        </p>

        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-mist">How are you feeling?</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((l) => (
                <button
                  key={l}
                  onClick={() => pickMood(l)}
                  className={cx(
                    'grid size-10 place-items-center rounded-full border transition-colors',
                    mood === l ? 'border-lilac bg-lilac-soft text-lilac' : 'border-line text-mist hover:bg-cream'
                  )}
                >
                  <MoodFace level={l} size={24} />
                </button>
              ))}
            </div>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give today a title…"
            className={cx(inputCls, 'font-display text-base')}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={9}
            placeholder="Start anywhere. Nobody is grading this."
            className={cx(inputCls, 'resize-y leading-relaxed')}
          />
          <div className="flex items-center justify-end gap-3">
            {savedFlash && <span className="text-sm text-sage transition-opacity">Saved ✓</span>}
            <button onClick={save} className={btnPrimary}>
              <Icon name="check" size={15} /> Save today’s page
            </button>
          </div>
        </div>
      </Card>

      {past.length > 0 && (
        <>
          <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-mist">Previous pages</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {past.map((e) => (
              <Card key={e.id}>
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-lg">{pretty(e.id)}</span>
                  {e.mood && <MoodFace level={e.mood} size={20} className="text-lilac" />}
                  <button
                    onClick={() => removeAt(uid, `journal/${e.id}`)}
                    title="Delete entry"
                    className="ml-auto text-mist/50 transition-colors hover:text-rose"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
                {e.title && <h4 className="mt-2 font-medium">{e.title}</h4>}
                {e.body?.trim() ? (
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-mist line-clamp-5">{e.body}</p>
                ) : (
                  <p className="mt-1.5 text-sm italic text-mist/70">Mood check-in only.</p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
