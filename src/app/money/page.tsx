'use client'

import { todayStr, monthKey, pretty, money, cx } from '@/lib/util'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, addTo, removeAt } from '@/lib/store'
import type { Txn } from '@/lib/types'
import {
  PageHeader, Card, CardTitle, Icon, Pill, Field, inputCls, btnPrimary, Progress,
} from '@/components/ui'

const OUT_CATS = ['Food & dining', 'Transport', 'Home & bills', 'Health', 'Fun', 'Shopping', 'Family', 'Business', 'Other']
const IN_CATS = ['Salary', 'Side hustle', 'Business revenue', 'Gift', 'Refund', 'Other income']

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
  if (txns === null) return <PageLoader />

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

  const addTxn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const [kind, category] = String(fd.get('category') || '').split('|')
    if (kind !== 'in' && kind !== 'out') return
    const amount = Math.round(Number(fd.get('amount')) * 100) / 100
    if (!(amount > 0)) return
    void addTo(uid, 'txns', {
      date: String(fd.get('date') || today),
      kind,
      amount,
      category: category || 'Other',
      note: String(fd.get('note') || '').trim() || null,
      createdAt: Date.now(),
    })
    e.currentTarget.reset()
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Money" sub="Attention is a currency too. Track both." />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'In this month', value: inn, cls: 'text-sage' },
          { label: 'Out this month', value: out, cls: 'text-rose' },
          { label: 'Net', value: inn - out, cls: 'text-ink' },
        ].map((s) => (
          <Card key={s.label} className="!p-4 md:!p-5">
            <p className="text-xs text-mist">{s.label}</p>
            <p className={cx('mt-1 font-display text-xl tabular-nums md:text-2xl', s.cls)}>{money(s.value)}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle icon="plus" accent="sand" title="Log a transaction" />
        <form onSubmit={addTxn} className="grid gap-3 md:grid-cols-[8rem_1fr_9.5rem_1fr_auto] md:items-end">
          <Field label="Amount">
            <input type="number" name="amount" step="0.01" min="0" placeholder="5000" className={inputCls} />
          </Field>
          <Field label="Category">
            <select name="category" className={inputCls} defaultValue="out|Food & dining">
              <optgroup label="Spending">
                {OUT_CATS.map((c) => (
                  <option key={c} value={`out|${c}`}>{c}</option>
                ))}
              </optgroup>
              <optgroup label="Income">
                {IN_CATS.map((c) => (
                  <option key={c} value={`in|${c}`}>{c}</option>
                ))}
              </optgroup>
            </select>
          </Field>
          <Field label="Date">
            <input type="date" name="date" defaultValue={today} max={today} className={inputCls} />
          </Field>
          <Field label="Note (optional)">
            <input name="note" placeholder="e.g. Groceries at Spar" className={inputCls} />
          </Field>
          <button type="submit" className={btnPrimary}>
            <Icon name="check" size={15} /> Log
          </button>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardTitle icon="wallet" accent="sand" title="Where it went this month" />
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

        <Card>
          <CardTitle icon="calendar" accent="sky" title="Recent activity" />
          {recent.length === 0 ? (
            <p className="text-sm text-mist">Nothing logged yet. Start with today’s spending.</p>
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
