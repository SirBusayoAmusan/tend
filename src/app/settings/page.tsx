'use client'

import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { fb } from '@/lib/firebase'
import { todayStr, cx } from '@/lib/util'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDoc, setAt, exportAllData } from '@/lib/store'
import type { UserProfile } from '@/lib/types'
import {
  PageHeader, Card, CardTitle, Icon, Field, inputCls, btnPrimary, btnGhost,
} from '@/components/ui'

export default function SettingsPage() {
  return (
    <Shell>
      <Settings />
    </Shell>
  )
}

function Settings() {
  const user = useAuth().user!
  const uid = user.uid
  const profile = useDoc<UserProfile>(uid, '')
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [saved, setSaved] = useState(false)

  if (profile === undefined) return <PageLoader />

  const saveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const stepsGoal = Math.round(Number(fd.get('stepsGoal')) || 20000)
    const pagesGoal = Math.round(Number(fd.get('pagesGoal')) || 30)
    void setAt(uid, '', {
      ...(name ? { name } : {}),
      stepsGoal: Math.max(1000, Math.min(100000, stepsGoal)),
      pagesGoal: Math.max(5, Math.min(500, pagesGoal)),
    }).then(() => {
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    })
  }

  const doExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const data = await exportAllData(uid)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tend-backup-${todayStr()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      setExported(true)
      setTimeout(() => setExported(false), 3000)
    } catch (err) {
      console.error(err)
      alert('Export failed — is Firestore enabled in your Firebase project? (See FIREBASE_SETUP.md)')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Settings" sub="Your corner, your rules. Everything here is yours to keep." />

      {/* Profile & goals */}
      <Card>
        <CardTitle icon="settings" accent="sage" title="Profile & daily goals" />
        <form key={profile?.name ?? 'x'} onSubmit={saveProfile} className="grid gap-3 md:grid-cols-[1fr_8rem_8rem_auto] md:items-end">
          <Field label="Your name">
            <input name="name" defaultValue={profile?.name ?? user.displayName ?? ''} className={inputCls} />
          </Field>
          <Field label="Steps goal">
            <input type="number" name="stepsGoal" defaultValue={profile?.stepsGoal ?? 20000} step={1000} className={inputCls} />
          </Field>
          <Field label="Pages goal">
            <input type="number" name="pagesGoal" defaultValue={profile?.pagesGoal ?? 30} className={inputCls} />
          </Field>
          <button type="submit" className={btnPrimary}>
            {saved ? 'Saved ✓' : 'Save'}
          </button>
        </form>
        <p className="mt-3 text-xs text-mist">Signed in as {user.email}</p>
      </Card>

      {/* Data backup */}
      <Card>
        <CardTitle icon="download" accent="sky" title="Your data is safe — and yours" />
        <div className="space-y-3 text-sm leading-relaxed text-mist">
          <p>
            <span className="font-medium text-ink">Firestore does not auto-delete your data.</span>{' '}
            Nothing in your Tend database expires after 7 or 30 days — records stay until you delete them.
            (That 7/30-day expiry idea applies to other services' free tiers, not Firestore.)
          </p>
          <p>
            Your login session stays signed in on each device until you sign out — no forced re-login.
          </p>
          <p>
            For total peace of mind, download a full backup anytime — every habit, page, step,
            journal entry, transaction, goal and venture in one JSON file:
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={doExport} disabled={exporting} className={btnPrimary}>
            <Icon name="download" size={15} />
            {exporting ? 'Gathering everything…' : exported ? 'Backup downloaded ✓' : 'Download full backup (.json)'}
          </button>
          <p className="text-xs text-mist">
            Book <i>metadata</i> is included; the actual PDF/EPUB files live in your Firebase Storage
            (grab them any time from the Storage console).
          </p>
        </div>
      </Card>

      {/* Account */}
      <Card>
        <CardTitle icon="logout" accent="rose" title="Account" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-mist">Sign out of Tend on this device. Your data stays in your cloud.</p>
          <button onClick={() => signOut(fb().auth)} className={cx(btnGhost, 'text-rose hover:!border-rose/50 hover:!text-rose')}>
            <Icon name="logout" size={15} /> Sign out
          </button>
        </div>
      </Card>
    </div>
  )
}
