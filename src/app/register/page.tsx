'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { fb } from '@/lib/firebase'
import { useAuth, PageLoader } from '@/components/Providers'
import { Mascot } from '@/components/Mascot'
import { inputCls } from '@/components/ui'

function friendlyError(code: string): string {
  if (code.includes('email-already-in-use')) return 'An account with this email already exists.'
  if (code.includes('weak-password')) return 'Use at least 6 characters for your password.'
  if (code.includes('invalid-email')) return 'That email doesn’t look right.'
  return 'Something went wrong. Please try again.'
}

export default function RegisterPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) router.replace('/')
  }, [user, router])

  if (user) return <PageLoader line="Growing your corner…" />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) return setError('Tell me your name — at least 2 characters.')
    setBusy(true)
    try {
      const cred = await createUserWithEmailAndPassword(fb().auth, email.trim(), password)
      await updateProfile(cred.user, { displayName: name.trim() })
      await setDoc(doc(fb().db, 'users', cred.user.uid), {
        name: name.trim(),
        stepsGoal: 20000,
        pagesGoal: 30,
        createdAt: Date.now(),
      })
      // onAuthStateChanged takes it from here
    } catch (err) {
      setError(friendlyError((err as { code?: string })?.code ?? ''))
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Mascot stage={0} mood="content" size={112} />
          <h1 className="mt-4 font-display text-3xl">Plant your corner</h1>
          <p className="mt-1 text-sm text-mist">One quiet place for your habits, goals, days and dreams.</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-mist">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="What should Pip call you?"
              className={inputCls}
            />
          </div>
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
              autoComplete="new-password"
              placeholder="At least 6 characters"
              className={inputCls}
            />
          </div>
          {error && <p className="rounded-xl bg-rose-soft px-3.5 py-2.5 text-sm text-rose">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-ink py-3 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'One moment…' : 'Create my space'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-mist">
          Already tending?{' '}
          <Link href="/login" className="font-medium text-sage hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
