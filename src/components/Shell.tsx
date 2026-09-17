'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { useAuth, PageLoader } from './Providers'
import { fb } from '@/lib/firebase'
import { NavLink } from './NavLink'
import { Icon, type IconName } from './ui'

const NAV: { href: string; icon: IconName; label: string }[] = [
  { href: '/', icon: 'home', label: 'Today' },
  { href: '/habits', icon: 'leaf', label: 'Habits' },
  { href: '/tasks', icon: 'square-check', label: 'Tasks' },
  { href: '/goals', icon: 'target', label: 'Goals' },
  { href: '/journal', icon: 'book', label: 'Journal' },
  { href: '/health', icon: 'heart', label: 'Health' },
  { href: '/fitness', icon: 'zap', label: 'Fitness' },
  { href: '/money', icon: 'wallet', label: 'Money' },
  { href: '/library', icon: 'library', label: 'Library' },
  { href: '/learn', icon: 'grad', label: 'Learn' },
  { href: '/business', icon: 'briefcase', label: 'Business' },
  { href: '/settings', icon: 'settings', label: 'Settings' },
]

/** Auth-gated app shell (sidebar + topbar). Wraps every private page. */
export default function Shell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  if (!user) return <PageLoader />

  const displayName = user.displayName?.trim() || user.email?.split('@')[0] || 'there'

  const logo = (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-2xl bg-sage-soft text-sage">
        <Icon name="leaf" size={18} />
      </span>
      <span className="font-display text-xl">Tend</span>
    </div>
  )

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-cream/40 p-5 md:flex">
        {logo}
        <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink key={n.href} {...n} />
          ))}
        </nav>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-line bg-white px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lilac-soft text-sm font-semibold text-lilac">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-sm font-medium">{displayName.split(' ')[0]}</span>
          </div>
          <button
            onClick={() => signOut(fb().auth)}
            title="Sign out"
            className="grid size-8 place-items-center rounded-full text-mist transition-colors hover:bg-rose-soft hover:text-rose"
          >
            <Icon name="logout" size={15} />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 md:min-w-0">
        <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur md:hidden">
          <div className="flex items-center gap-2 overflow-x-auto px-3 py-2.5">
            {logo}
            <span className="text-line">·</span>
            {NAV.map((n) => (
              <NavLink key={n.href} {...n} compact />
            ))}
            <button
              onClick={() => signOut(fb().auth)}
              title="Sign out"
              className="ml-auto grid size-9 shrink-0 place-items-center rounded-full text-mist transition-colors hover:bg-rose-soft hover:text-rose"
            >
              <Icon name="logout" size={15} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  )
}
