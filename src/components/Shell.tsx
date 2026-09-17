'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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

/** Auth-gated app shell (desktop sidebar + mobile hamburger drawer). */
export default function Shell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  // close drawer on navigation + lock body scroll while open
  useEffect(() => setDrawerOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

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

      {/* Mobile top bar + hamburger */}
      <div className="flex-1 md:min-w-0">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            {logo}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="grid size-10 place-items-center rounded-full border border-line bg-white text-ink transition-colors hover:bg-cream"
            >
              <Icon name="menu" size={19} />
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        <div
          className={`fixed inset-0 z-50 md:hidden ${drawerOpen ? '' : 'pointer-events-none'}`}
          aria-hidden={!drawerOpen}
        >
          {/* backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 ${
              drawerOpen ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {/* panel */}
          <div
            className={`absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-paper p-5 shadow-2xl transition-transform duration-300 ease-out ${
              drawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between">
              {logo}
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="grid size-9 place-items-center rounded-full text-mist transition-colors hover:bg-cream hover:text-ink"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto">
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
          </div>
        </div>

        <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  )
}
