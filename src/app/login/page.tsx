'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { fb } from '@/lib/firebase'
import { useAuth, PageLoader } from '@/components/Providers'
import { Mascot } from '@/components/Mascot'
import { inputCls } from '@/components/ui'

function friendlyError(code: string): string {
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'That email and password don’t match.'
  if (code.includes('too-many-requests')) return 'Too many tries — give it a minute and try again.'
  if (code.includes('invalid-email')) return 'That email doesn’t look right.'
  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) router.replace('/')
  }, [user, router])

  if (user) return <PageLoader line="Opening your corner…" />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signInWithEmailAndPassword(fb().auth, email.trim(), password)
    } catch (err) {
      setError(friendlyError((err as { code?: string })?.code ?? ''))
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Mascot stage={3} mood="happy" size={112} />
          <h1 className="mt-4 font-display text-3xl">Welcome back</h1>
          <p className="mt-1 text-sm text-mist">Your corner of calm is right where you left it.</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-mist">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-mist">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Your password"
              className={inputCls}
            />
          </div>
          {error && <p className="rounded-xl bg-rose-soft px-3.5 py-2.5 text-sm text-rose">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-ink py-3 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'One moment…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-mist">
          New here?{' '}
          <Link href="/register" className="font-medium text-sage hover:underline">
            Plant your corner
          </Link>
        </p>
      </div>
    </main>
  )
}
