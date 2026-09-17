import type { Doc, Txn } from './types'
import { money, monthKey, shiftDays, todayStr } from './util'

export interface Insight {
  id: string
  tone: 'sage' | 'sand' | 'rose' | 'sky'
  title: string
  body: string
  /** when true, also surfaces on the Health page */
  health: boolean
}

const TREAT_WORDS = /chocolate|candy|candies|soda|coke|sprite|fanta|sweet|sweets|ice cream|alcohol|beer|wine|vape|cigarette|shawarma|junk|chips|cookies|biscuit/i

const fmt = money

export function buildInsights(txns: Doc<Txn>[], treatsBudget: number): Insight[] {
  const out: Insight[] = []
  const today = todayStr()
  const m = monthKey(today)
  const lastM = monthKey(shiftDays(today, -32))

  const month = txns.filter((t) => t.date.startsWith(m))
  const lastMonth = txns.filter((t) => t.date.startsWith(lastM))

  const spend = (list: Doc<Txn>[]) => list.filter((t) => t.kind === 'out').reduce((s, t) => s + t.amount, 0)
  const outTotal = spend(month)
  const lastTotal = spend(lastMonth)
  const inTotal = month.filter((t) => t.kind === 'in').reduce((s, t) => s + t.amount, 0)

  if (outTotal === 0 && inTotal === 0) return out

  /* ---- category share ---- */
  const byCat = new Map<string, number>()
  for (const t of month) {
    if (t.kind !== 'out') continue
    byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount)
  }
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0]
  if (top && outTotal > 0) {
    const share = Math.round((top[1] / outTotal) * 100)
    if (share >= 25) {
      out.push({
        id: 'top-cat',
        tone: share >= 40 ? 'sand' : 'sky',
        title: `${top[0]} is ${share}% of your spending`,
        body: `${fmt(top[1])} of ${fmt(outTotal)} this month. Even a small trim here (${share >= 40 ? 'say 20%' : 'say 10%'}) beats cutting three smaller categories.`,
        health: false,
      })
    }
  }

  /* ---- month-over-month ---- */
  if (lastTotal > 0 && outTotal > lastTotal * 1.15) {
    out.push({
      id: 'mom',
      tone: 'sand',
      title: `Tracking ${Math.round((outTotal / lastTotal - 1) * 100)}% above last month`,
      body: `${fmt(outTotal)} so far vs ${fmt(lastTotal)} in all of ${new Date(lastM + '-15T12:00:00').toLocaleDateString('en-GB', { month: 'long' })}. If nothing changed in your life, something crept — scan the biggest 3 transactions.`,
      health: false,
    })
  }

  /* ---- treats (chocolates, soda, junk…) → Health feed ---- */
  const treats = month.filter(
    (t) => t.kind === 'out' && (t.category === 'Snacks & treats' || (t.note && TREAT_WORDS.test(t.note)))
  )
  const treatsTotal = treats.reduce((s, t) => s + t.amount, 0)
  if (treatsTotal > 0) {
    const pct = Math.round((treatsTotal / treatsBudget) * 100)
    const tone = pct >= 100 ? 'rose' : pct >= 70 ? 'sand' : 'sage'
    out.push({
      id: 'treats',
      tone,
      title: tone === 'rose'
        ? `Treats passed your cap — ${fmt(treatsTotal)}`
        : `Treats at ${fmt(treatsTotal)} (${pct}% of your ${fmt(treatsBudget)} cap)`,
      body: tone === 'rose'
        ? `Chocolates, soda & co. have crossed your monthly cap. Your body keeps the receipts — consider this a gentle health alert, not a scolding. 🙂`
        : tone === 'sand'
          ? `Getting close to your monthly treats cap. Maybe switch the next craving to fruit for a week and watch the number hold.`
          : `Nice restraint — treats spending is well within your cap this month.`,
      health: true,
    })
  }

  /* ---- feeding (food spend) → Health feed ---- */
  const food = byCat.get('Food & dining') ?? 0
  const groceries = byCat.get('Groceries') ?? 0
  const foodTotal = food + groceries
  if (outTotal > 0 && foodTotal > 0) {
    const share = Math.round((foodTotal / outTotal) * 100)
    if (share >= 35 && food > groceries * 1.2) {
      out.push({
        id: 'food',
        tone: 'sand',
        title: `Eating out is ${share}% of your spending`,
        body: `${fmt(food)} on dining vs ${fmt(groceries)} on groceries this month. Two more home-cooked dinners a week is the cheapest diet plan that exists.`,
        health: true,
      })
    } else if (share >= 10) {
      out.push({
        id: 'food',
        tone: 'sage',
        title: `Feeding looks balanced (${share}% of spend)`,
        body: `${fmt(foodTotal)} on food this month with a healthy groceries mix. Your Health page sees the same signal Pip does.`,
        health: true,
      })
    }
  }

  /* ---- weekend bleeding ---- */
  const isWeekend = (d: string) => [0, 6].includes(new Date(d + 'T12:00:00').getDay())
  const weekendOut = month.filter((t) => t.kind === 'out' && isWeekend(t.date)).reduce((s, t) => s + t.amount, 0)
  const weekendDays = new Set(month.filter((t) => isWeekend(t.date)).map((t) => t.date)).size || 0
  const weekdayOut = outTotal - weekendOut
  const weekdayDays = new Set(month.filter((t) => !isWeekend(t.date)).map((t) => t.date)).size || 0
  if (weekendDays > 0 && weekdayDays > 0 && weekendOut / weekendDays > (weekdayOut / weekdayDays) * 2) {
    out.push({
      id: 'weekend',
      tone: 'sky',
      title: 'Weekends cost you 2× weekdays',
      body: `Per-day: ${fmt(weekendOut / weekendDays)} on weekends vs ${fmt(weekdayOut / weekdayDays)} midweek. A fixed “weekend envelope” (cash or card cap) usually fixes this in one month.`,
      health: false,
    })
  }

  /* ---- transport ---- */
  const transport = byCat.get('Transport') ?? 0
  if (outTotal > 0 && transport / outTotal >= 0.2) {
    out.push({
      id: 'transport',
      tone: 'sky',
      title: `Transport is ${Math.round((transport / outTotal) * 100)}% of spending`,
      body: `${fmt(transport)} this month. Batching errands into single trips, or off-peak rides, is the classic way to shave this down.`,
      health: false,
    })
  }

  /* ---- win ---- */
  if (inTotal > 0 && inTotal > outTotal) {
    out.push({
      id: 'win',
      tone: 'sage',
      title: `You're keeping ${fmt(inTotal - outTotal)} this month`,
      body: `More in than out — that's the whole game. If this holds, you've earned the right to raise a goal somewhere.`,
      health: false,
    })
  }

  return out
}
