'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { fb, initFirebase, isPlaceholderConfig } from '@/lib/firebase'
import { Mascot } from './Mascot'

type AuthCtx = { user: User | null }

const Ctx = createContext<AuthCtx>({ user: null })
export const useAuth = () => useContext(Ctx)

export function PageLoader({ line = 'Tending your garden…' }: { line?: string }) {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Mascot stage={2} mood="content" size={90} />
        <p className="text-sm text-mist">{line}</p>
      </div>
    </div>
  )
}

function ConfigErrorScreen() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-[0_1px_2px_rgba(46,42,38,0.04)]">
        <Mascot stage={1} mood="sleepy" size={90} className="mx-auto" />
        <h1 className="mt-4 font-display text-2xl">One small step before we bloom</h1>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          Tend needs your free Firebase project to store your data. It takes about 5 minutes:
        </p>
        <ol className="mt-5 space-y-2.5 text-left text-sm leading-relaxed">
          {[
            'Go to console.firebase.google.com → “Add project”',
            'Build → Authentication → enable Email/Password',
            'Build → Firestore Database → Create database (production mode)',
            'Build → Storage → Get started',
            'Project settings → “Add app” → Web → copy the config values',
            'Paste them into public/firebase-config.json, rebuild, and re-drag to Netlify',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sage-soft text-xs font-semibold text-sage">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-xs text-mist">
          Full walkthrough (rules, CORS, security): see <b>FIREBASE_SETUP.md</b> in the project.
        </p>
      </div>
    </div>
  )
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'config-error'>('loading')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let unsub: (() => void) | undefined
    fetch('/firebase-config.json')
      .then((r) => r.json())
      .then((cfg) => {
        if (isPlaceholderConfig(cfg) || !initFirebase(cfg)) {
          setStatus('config-error')
          return
        }
        unsub = onAuthStateChanged(fb().auth, (u) => {
          setUser(u)
          setStatus('ready')
        })
      })
      .catch(() => setStatus('config-error'))
    return () => unsub?.()
  }, [])

  if (status === 'loading') return <PageLoader />
  if (status === 'config-error') return <ConfigErrorScreen />

  return <Ctx.Provider value={{ user }}>{children}</Ctx.Provider>
}
