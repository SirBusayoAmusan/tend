import Link from 'next/link'
import type { ReactNode } from 'react'
import { cx } from '@/lib/util'
import { Mascot } from './Mascot'

/* ---------- Accent system ---------- */

export type Accent = 'sage' | 'sky' | 'lilac' | 'clay' | 'sand' | 'rose'

export const ACCENTS: Record<Accent, { text: string; softBg: string; solid: string; border: string; hex: string }> = {
  sage: { text: 'text-sage', softBg: 'bg-sage-soft', solid: 'bg-sage', border: 'border-sage', hex: '#7FA98B' },
  sky: { text: 'text-sky', softBg: 'bg-sky-soft', solid: 'bg-sky', border: 'border-sky', hex: '#7E9CC4' },
  lilac: { text: 'text-lilac', softBg: 'bg-lilac-soft', solid: 'bg-lilac', border: 'border-lilac', hex: '#9D92C7' },
  clay: { text: 'text-clay', softBg: 'bg-clay-soft', solid: 'bg-clay', border: 'border-clay', hex: '#C4836A' },
  sand: { text: 'text-sand', softBg: 'bg-sand-soft', solid: 'bg-sand', border: 'border-sand', hex: '#C7A96E' },
  rose: { text: 'text-rose', softBg: 'bg-rose-soft', solid: 'bg-rose', border: 'border-rose', hex: '#C98A8A' },
}

export const GOAL_DOMAINS: { id: string; label: string; accent: Accent }[] = [
  { id: 'body', label: 'Body', accent: 'clay' },
  { id: 'mind', label: 'Mind', accent: 'lilac' },
  { id: 'work', label: 'Work', accent: 'sky' },
  { id: 'money', label: 'Money', accent: 'sand' },
  { id: 'growth', label: 'Growth', accent: 'sage' },
  { id: 'other', label: 'Other', accent: 'rose' },
]

export function domainAccent(domain: string): Accent {
  return GOAL_DOMAINS.find((d) => d.id === domain)?.accent ?? 'sage'
}

/** Coerce an arbitrary DB string into a valid Accent. */
export function accentOf(a: string): Accent {
  return a in ACCENTS ? (a as Accent) : 'sage'
}

/* ---------- Primitives ---------- */

export const inputCls =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-mist/60 focus:border-sage'

export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-50'

export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-mist transition hover:border-mist/40 hover:text-ink'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-3xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(46,42,38,0.04)] md:p-6', className)}>
      {children}
    </div>
  )
}

export function CardTitle({
  icon,
  accent = 'sage',
  title,
  href,
  right,
}: {
  icon: IconName
  accent?: Accent
  title: string
  href?: string
  right?: ReactNode
}) {
  const a = ACCENTS[accent]
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className={cx('grid size-8 place-items-center rounded-xl', a.softBg, a.text)}>
          <Icon name={icon} size={16} />
        </span>
        <h2 className="font-display text-lg">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className={cx('text-xs font-medium hover:underline', a.text)}>
          Open →
        </Link>
      ) : (
        right
      )}
    </div>
  )
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {sub && <p className="mt-1.5 text-sm text-mist">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-xs font-medium text-mist">{label}</span>
      {children}
    </label>
  )
}

export function Pill({ children, accent = 'sage', className }: { children: ReactNode; accent?: Accent; className?: string }) {
  const a = ACCENTS[accent]
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', a.softBg, a.text, className)}>
      {children}
    </span>
  )
}

export function Progress({ value, accent = 'sage', className }: { value: number; accent?: Accent; className?: string }) {
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-line', className)}>
      <div
        className={cx('h-full rounded-full transition-all duration-500', ACCENTS[accent].solid)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Empty({ title, hint, children }: { title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <Mascot stage={1} mood="content" size={76} className="opacity-90" />
      <p className="mt-3 font-display text-lg">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-mist">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

/* ---------- Mood faces ---------- */

export function MoodFace({ level, size = 26, className }: { level: number; size?: number; className?: string }) {
  const mouths: Record<number, string> = {
    1: 'M7.5 15.8c1.5-2.4 7.5-2.4 9 0',
    2: 'M7.5 15.2c1.8-1.1 7.2-1.1 9 0',
    3: 'M8 14.6h8',
    4: 'M7.5 13.4c1.8 1.8 7.2 1.8 9 0',
    5: 'M7 13c2 3.6 8 3.6 10 0',
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.2" fill="currentColor" opacity="0.12" />
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.7" cy="10" r="1.05" fill="currentColor" />
      <circle cx="15.3" cy="10" r="1.05" fill="currentColor" />
      <path d={mouths[level] ?? mouths[3]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/* ---------- Icons ---------- */

export type IconName =
  | 'home' | 'leaf' | 'square-check' | 'target' | 'book' | 'heart' | 'wallet' | 'grad'
  | 'plus' | 'trash' | 'logout' | 'spark' | 'flame' | 'calendar' | 'check'
  | 'zap' | 'library' | 'briefcase' | 'upload' | 'download' | 'arrow-left' | 'arrow-right' | 'x'
  | 'settings' | 'menu' | 'repeat' | 'chev-down'

const PATHS: Record<IconName, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />,
  leaf: (
    <>
      <path d="M5 19C5 11 10 6 20 5c-1 10-6 14-14 14Z" />
      <path d="M5 19c3-4 7-8 11-10" />
    </>
  ),
  'square-check': (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.5C7 3.5 9.5 3.5 12 5.5c2.5-2 5-2 7-1V19c-2-1-4.5-1-7 1-2.5-2-5-2-7-1Z" />
      <path d="M12 5.5V20" />
    </>
  ),
  heart: (
    <path d="M12 20.5C7 16 3.5 12.8 3.5 9.3 3.5 6.9 5.4 5 7.8 5c1.7 0 3.2.9 4.2 2.4C13 5.9 14.5 5 16.2 5c2.4 0 4.3 1.9 4.3 4.3 0 3.5-3.5 6.7-8.5 11.2Z" />
  ),
  wallet: (
    <>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5Z" />
      <path d="M20 9.5h-4.5a2.5 2.5 0 0 0 0 5H20" />
    </>
  ),
  grad: (
    <>
      <path d="m3 9 9-4.5L21 9l-9 4.5Z" />
      <path d="M7 11.5V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M5 7h14M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M7 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4L17 7" />
    </>
  ),
  logout: <path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2M10 12h10m0 0-3-3m3 3-3 3" />,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />,
  flame: (
    <path d="M12 21c-3.9 0-6.5-2.5-6.5-6 0-2.4 1.4-4.2 2.8-5.9 1.3-1.5 2.7-3.1 2.7-5.6 2.6 1.4 4 3.8 4.2 6 .6-.4 1-1 1.3-1.9 1.4 1.6 2 3.5 2 5.4 0 5-2.6 8-6.5 8Z" />
  ),
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="3" />
      <path d="M8 3.5v4M16 3.5v4M4 11h16" />
    </>
  ),
  check: <path d="m5 12 5 5 9-10" />,
  zap: <path d="M13 2 5 13.5h5L10.5 22 19 10.5h-5.5L13 2Z" />,
  library: (
    <>
      <path d="M4 4.5v15" />
      <path d="M8 4.5v15" />
      <path d="M4 4.5h16v15H4" />
      <path d="M12 4.5v15" />
      <path d="M16 4.5v15" />
      <path d="M4 8.5h16M4 15.5h16" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
    </>
  ),
  upload: <path d="M12 16V4m0 0 4.5 4.5M12 4 7.5 8.5M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />,
  download: <path d="M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />,
  'arrow-left': <path d="M20 12H4m0 0 6-6m-6 6 6 6" />,
  'arrow-right': <path d="M4 12h16m0 0-6-6m6 6-6 6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  'chev-down': <path d="m6 9 6 6 6-6" />,
  repeat: (
    <>
      <path d="M17 2.5 21 6l-4 3.5" />
      <path d="M3 11V9a3 3 0 0 1 3-3h15" />
      <path d="m7 21.5-4-3.5L7 14.5" />
      <path d="M21 13v2a3 3 0 0 1-3 3H3" />
    </>
  ),
}

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  )
}
