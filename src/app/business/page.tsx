'use client'

import { todayStr, monthKey, money, pretty, cx } from '@/lib/util'
import { Sparkline } from '@/components/charts'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, addTo, setAt, updateAt, removeAt } from '@/lib/store'
import type { Venture, VentureMetric, VentureStage } from '@/lib/types'
import {
  PageHeader, Card, Empty, Icon, Pill, Field, inputCls, btnPrimary, type Accent,
} from '@/components/ui'

const STAGES: { id: VentureStage; label: string; accent: Accent }[] = [
  { id: 'idea', label: 'Idea', accent: 'sand' },
  { id: 'validating', label: 'Validating', accent: 'lilac' },
  { id: 'building', label: 'Building', accent: 'sky' },
  { id: 'launched', label: 'Launched', accent: 'clay' },
  { id: 'growing', label: 'Growing', accent: 'sage' },
]

export default function BusinessPage() {
  return (
    <Shell>
      <Business />
    </Shell>
  )
}

function Business() {
  const uid = useAuth().user!.uid
  const ventures = useDocs<Venture>(uid, 'ventures')
  if (ventures === null) return <PageLoader />

  const sorted = [...ventures].sort(
    (a, b) => STAGES.findIndex((s) => s.id === b.stage) - STAGES.findIndex((s) => s.id === a.stage) || b.createdAt - a.createdAt
  )

  const addVenture = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    if (!name) return
    void addTo(uid, 'ventures', {
      name,
      stage: String(fd.get('stage') || 'idea'),
      description: String(fd.get('description') || '').trim() || null,
      nextAction: String(fd.get('nextAction') || '').trim() || null,
      createdAt: Date.now(),
    })
    e.currentTarget.reset()
  }

  return (
    <div>
      <PageHeader title="Business" sub="Grow things. Then grow them more. Every venture gets tended like a plant." />

      <Card className="mb-5">
        <form onSubmit={addVenture} className="grid gap-3 md:grid-cols-[1fr_10rem_1fr_auto] md:items-end">
          <Field label="Venture">
            <input name="name" placeholder="e.g. Thrift store, SaaS idea, content brand" className={inputCls} />
          </Field>
          <Field label="Stage">
            <select name="stage" className={inputCls} defaultValue="idea">
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="What it is (one line)">
            <input name="description" placeholder="Who it serves and what it sells" className={inputCls} />
          </Field>
          <button type="submit" className={btnPrimary}>
            <Icon name="plus" size={15} /> Plant venture
          </button>
        </form>
      </Card>

      {sorted.length === 0 ? (
        <Empty
          title="No ventures yet"
          hint="Ideas count. Plant your first one above — give it a stage and watch it move right."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sorted.map((v) => (
            <VentureCard key={v.id} venture={v} uid={uid} />
          ))}
        </div>
      )}
    </div>
  )
}

function VentureCard({ venture: v, uid }: { venture: Venture & { id: string }; uid: string }) {
  const metrics = useDocs<VentureMetric>(uid, `ventures/${v.id}/metrics`)
  const today = todayStr()
  const m = monthKey(today)

  const ms = metrics ?? []
  const sorted = [...ms].sort((a, b) => a.id.localeCompare(b.id))
  const monthRevenue = ms.filter((x) => x.id.startsWith(m)).reduce((s, x) => s + x.revenue, 0)
  const monthCustomers = ms.filter((x) => x.id.startsWith(m)).reduce((s, x) => s + x.customers, 0)
  const todayMetric = ms.find((x) => x.id === today)

  const setStage = (stage: VentureStage) => void updateAt(uid, `ventures/${v.id}`, { stage })

  const saveNextAction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    void updateAt(uid, `ventures/${v.id}`, { nextAction: String(fd.get('nextAction') || '').trim() || null })
    e.currentTarget.reset()
  }

  const logMetrics = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const revenue = Math.max(0, Number(fd.get('revenue')) || 0)
    const customers = Math.max(0, Math.round(Number(fd.get('customers')) || 0))
    void setAt(uid, `ventures/${v.id}/metrics/${today}`, { revenue, customers })
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl">{v.name}</h3>
          {v.description && <p className="mt-0.5 text-sm text-mist">{v.description}</p>}
        </div>
        <button
          onClick={() => removeAt(uid, `ventures/${v.id}`)}
          title="Remove venture"
          className="shrink-0 text-mist/60 transition-colors hover:text-rose"
        >
          <Icon name="trash" size={15} />
        </button>
      </div>

      {/* stage pipeline */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStage(s.id)}
            className={cx(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              v.stage === s.id
                ? 'border-transparent bg-ink text-paper'
                : 'border-line bg-white text-mist hover:border-mist/50 hover:text-ink'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* metrics */}
      <div className="mt-5 rounded-2xl bg-cream/60 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-mist">This month so far</p>
          <div className="flex gap-3 text-sm">
            <span className="tabular-nums text-sage">{money(monthRevenue)}</span>
            <span className="tabular-nums text-mist">{monthCustomers} customers</span>
          </div>
        </div>
        {sorted.length > 0 && (
          <div className="mt-2">
            <Sparkline data={sorted.slice(-14).map((x) => x.revenue)} color="#C98A8A" height={44} />
          </div>
        )}
        <form onSubmit={logMetrics} className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <Field label={`Revenue today${todayMetric ? ` (logged: ${money(todayMetric.revenue)})` : ''}`}>
            <input type="number" name="revenue" min={0} step={100} placeholder="₦ 0" className={cx(inputCls, '!py-1.5 text-xs')} />
          </Field>
          <Field label="Customers today">
            <input type="number" name="customers" min={0} placeholder="0" className={cx(inputCls, '!py-1.5 text-xs')} />
          </Field>
          <button type="submit" className={cx(btnPrimary, '!px-3.5 !py-1.5 text-xs')}>Log</button>
        </form>
        {sorted.length > 0 && (
          <p className="mt-2 text-[11px] text-mist">
            Last log {pretty(sorted[sorted.length - 1].id)} · {sorted.length} {sorted.length === 1 ? 'day' : 'days'} tracked
          </p>
        )}
      </div>

      {/* next action */}
      <form onSubmit={saveNextAction} className="mt-4">
        <Field label={`Next action${v.nextAction ? ` — current: “${v.nextAction}”` : ''}`}>
          <input name="nextAction" placeholder="The one thing that moves this forward next" className={cx(inputCls, '!py-1.5 text-xs')} />
        </Field>
      </form>
    </Card>
  )
}
