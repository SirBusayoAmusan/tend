'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cx } from '@/lib/util'
import { Icon, type IconName } from './ui'

export function NavLink({
  href,
  icon,
  label,
  compact,
}: {
  href: string
  icon: IconName
  label: string
  compact?: boolean
}) {
  const pathname = usePathname()
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)

  if (compact) {
    return (
      <Link
        href={href}
        className={cx(
          'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
          active ? 'bg-ink text-paper' : 'text-mist hover:bg-cream'
        )}
      >
        <Icon name={icon} size={15} />
        {label}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cx(
        'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
        active ? 'bg-sage-soft text-ink' : 'text-mist hover:bg-cream hover:text-ink'
      )}
    >
      <Icon name={icon} size={17} className={active ? 'text-sage' : ''} />
      {label}
    </Link>
  )
}
