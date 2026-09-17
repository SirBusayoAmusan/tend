'use client'

import { useState } from 'react'
import { todayStr, monthKey, pretty, money, cx } from '@/lib/util'
import { buildInsights } from '@/lib/insights'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, useDoc, setAt, addTo, removeAt } from '@/lib/store'
import type { Txn, UserProfile } from '@/lib/types'
import {
  PageHeader, Card, CardTitle, Icon, Pill, Field, inputCls, btnPrimary, Progress,
} from '@/components/ui'

const OUT_CATS = ['Food & dining', 'Groceries', 'Snacks & treats', 'Transport', 'Home & bills', 'Health', 'Fun', 'Shopping', 'Family', 'Business', 'Other']
const IN_CATS = ['Salary', 'Side hustle', 'Business revenue', 'Gift', 'Refund', 'Other income']

const TONE: Record<string, { border: string; icon: string }> = {
  sage: { border: 'border-sage/40 bg-sage-soft/50', icon: 'check' },
  sand: { border: 'border-sand/50 bg-sand-soft/60', icon: 'spark' },
  rose: { border: 'border-rose/40 bg-rose-soft/60', icon: 'heart' },
  sky: { border: 'border-sky/40 bg-sky-soft/60', icon: 'spark' },
}

export default function MoneyPage() {
  return (
    <Shell>
      <Money />
    </Shell>
  )
}

function Money() {
  const uid = useAuth().user!.uid
  const today = todayStr()
  const m = monthKey(today)
  const txns = useDocs<Txn>(uid, 'txns')
  const profile = useDoc<UserProfile>(uid, '')
  const [kind, setKind] = useState<'out' | 'in'>('out')

  if (txns === null || profile === undefined) return <PageLoader />

  const treatsBudget = profile?.treatsBudget ?? 15000
  const monthTxns = txns.filter((t) => t.date.startsWith(m))
  const inn = monthTxns.filter((t) => t.kind === 'in').reduce((s, t) => s + t.amount, 0)
  const out = monthTxns.filter((t) => t.kind === 'out').reduce((s, t) => s + t.amount, 0)

  const byCat = new Map<string, number>()
  for (const t of monthTxns) {
    if (t.kind !== 'out') continue
    byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount)
  }
  const topCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxCat = topCats[0]?.[1] ?? 1

  const recent = [...txns]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 20)

  const insights = buildInsights(txns, treatsBudget)

  const addTxn = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    e.preventDefault()
    const fd = new FormData(form)
    const amount = Math.round(Number(fd.get('amount')) * 100) / 100
    if (!(amount > 0)) return
    void addTo(uid, 'txns', {
      date: String(fd.get('date') || today),
      kind,
      amount,
      category: String(fd.get('category') || 'Other'),
      note: String(fd.get('note') || '').trim() || null,
      createdAt: Date.now(),
    })
    form.reset()
    setKind('out')
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Money" sub="Attention is a currency too. Track both." />

      {/* summary */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          { label: 'In this month', value: inn, cls: 'text-sage' },
          { label: 'Out this month', value: out, cls: 'text-rose' },
          { label: 'Net', value: inn - out, cls: 'text-ink' },
        ].map((s) => (
          <Card key={s.label} className="!p-3.5 md:!p-5">
            <p className="text-[11px] text-mist md:text-xs">{s.label}</p>
            <p className={cx('mt-1 font-display text-lg tabular-nums md:text-2xl', s.cls)}>{money(s.value)}</p>
          </Card>
        ))}
      </div>

      {/* add */}
      <Card>
        <CardTitle icon="plus" accent="sand" title="Log a transaction" />
        {/* kind toggle */}
        <div className="mb-4 flex gap-1.5 rounded-full border border-line bg-cream/50 p-1 w-fit">
          {(['out', 'in'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cx(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                kind === k
                  ? k === 'out' ? 'bg-rose-soft text-rose' : 'bg-sage-soft text-sage'
                  : 'text-mist hover:text-ink'
              )}
            >
              {k === 'out' ? 'Spending' : 'Income'}
            </button>
          ))}
        </div>
        <form key={kind} onSubmit={addTxn} className="grid gap-3 md:grid-cols-[8rem_1fr_9.5rem_1fr_auto] md:items-end">
          <Field label="Amount">
            <input type="number" name="amount" step="0.01" min="0" placeholder="5000" className={inputCls} />
          </Field>
          <Field label="Category">
            <select name="category" className={inputCls} defaultValue={kind === 'out' ? 'Food & dining' : 'Salary'}>
              {(kind === 'out' ? OUT_CATS : IN_CATS).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" name="date" defaultValue={today} max={today} className={inputCls} />
          </Field>
          <Field label="Note (optional)">
            <input name="note" placeholder={kind === 'out' ? 'e.g. Groceries at Spar' : 'e.g. October salary'} className={inputCls} />
          </Field>
          <button type="submit" className={btnPrimary}>
            <Icon name="check" size={15} /> Log {kind === 'out' ? 'expense' : 'income'}
          </button>
        </form>
      </Card>

      {/* insights */}
      <Card>
        <CardTitle
          icon="spark"
          accent="lilac"
          title="Where your money goes — and what to do better"
          right={
            <form
              className="flex items-center gap-2 text-xs text-mist"
              onSubmit={(e) => {
                e.preventDefault()
                const n = Math.round(Number(new FormData(e.currentTarget).get('treatsBudget')))
                if (n >= 1000) void setAt(uid, '', { treatsBudget: n })
              }}
            >
              <span>Treats cap</span>
              <input type="number" name="treatsBudget" defaultValue={treatsBudget} step={1000} className={cx(inputCls, 'w-24 !py-1 !px-2 text-xs')} />
              <button className="rounded-full border border-line px-2.5 py-1 font-medium hover:border-mist/50 hover:text-ink">Set</button>
            </form>
          }
        />
        {insights.length === 0 ? (
          <p className="text-sm text-mist">
            Log a few transactions and Tend starts coaching: biggest slices, trends, weekend leaks,
            and treats signals that also show up on your Health page.
          </p>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {insights.map((s) => {
              const tone = TONE[s.tone]
              return (
                <div key={s.id} className={cx('rounded-2xl border p-4', tone.border)}>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Icon name={tone.icon as 'check'} size={14} className="shrink-0" />
                    {s.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/70">{s.body}</p>
                  {s.health && (
                    <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-ink/40">
                      🔁 also shows in Health
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* spending by category */}
        <Card>
          <CardTitle icon="wallet" accent="sand" title="This month by category" />
          {topCats.length === 0 ? (
            <p className="text-sm text-mist">No spending logged yet this month.</p>
          ) : (
            <ul className="space-y-3">
              {topCats.map(([cat, amt]) => (
                <li key={cat}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{cat}</span>
                    <span className="tabular-nums text-mist">{money(amt)}</span>
                  </div>
                  <Progress value={(amt / maxCat) * 100} accent="sand" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* recent */}
        <Card>
          <CardTitle icon="calendar" accent="sky" title="Recent activity" />
          {recent.length === 0 ? (
            <p className="text-sm text-mist">Nothing logged yet. Start with today’s spending or this month’s income.</p>
          ) : (
            <ul className="space-y-1">
              {recent.map((t) => (
                <li key={t.id} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-cream/60">
                  <span className={cx(
                    'grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold',
                    t.kind === 'in' ? 'bg-sage-soft text-sage' : 'bg-rose-soft text-rose'
                  )}>
                    {t.kind === 'in' ? '+' : '−'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{t.note || t.category}</span>
                    <span className="block text-xs text-mist">{t.category} · {pretty(t.date)}</span>
                  </span>
                  <span className={cx('text-sm font-medium tabular-nums', t.kind === 'in' ? 'text-sage' : 'text-ink')}>
                    {t.kind === 'in' ? '+' : '−'}{money(t.amount)}
                  </span>
                  <button
                    onClick={() => removeAt(uid, `txns/${t.id}`)}
                    title="Delete"
                    className="text-mist opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {recent.length > 0 && (
            <p className="mt-3 text-center">
              <Pill accent="sand">
                {monthTxns.length} {monthTxns.length === 1 ? 'entry' : 'entries'} this month
              </Pill>
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
