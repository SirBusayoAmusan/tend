'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { set as idbSet, del as idbDel } from 'idb-keyval'
import { uploadBookFile, deleteBookFile, estimateCloudBytes } from '@/lib/bookSync'
import { countBookPages, paceLine } from '@/lib/pageCount'
import { todayStr, cx } from '@/lib/util'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDocs, useDoc, addTo, setAt, updateAt, removeAt } from '@/lib/store'
import type { Book, ReadingDaily, UserProfile } from '@/lib/types'
import {
  PageHeader, Card, Empty, Icon, Pill, Progress, Field, inputCls, btnPrimary, ACCENTS, type Accent,
} from '@/components/ui'

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const COVER_ACCENTS: Accent[] = ['sky', 'sage', 'clay', 'lilac', 'sand', 'rose']

function coverAccent(title: string): Accent {
  let h = 0
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return COVER_ACCENTS[h % COVER_ACCENTS.length]
}

function fmtSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export default function LibraryPage() {
  return (
    <Shell>
      <Library />
    </Shell>
  )
}

function Library() {
  const uid = useAuth().user!.uid
  const today = todayStr()
  const books = useDocs<Book>(uid, 'books')
  const readingToday = useDoc<ReadingDaily>(uid, `readingDaily/${today}`)
  const profile = useDoc<UserProfile>(uid, '')

  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState<number | null>(null) // percent

  if (books === null || profile === undefined || readingToday === undefined) return <PageLoader />

  const pagesGoal = profile?.pagesGoal ?? 30
  const pagesRead = readingToday?.total ?? 0
  const goalDone = pagesRead >= pagesGoal

  const pickFile = (f: File | null) => {
    setError('')
    if (!f) return setFile(null)
    const ext = f.name.toLowerCase().split('.').pop()
    if (ext !== 'pdf' && ext !== 'epub') return setError('Only PDF and EPUB files, please.')
    if (f.size > MAX_BYTES) return setError(`“${f.name}” is ${fmtSize(f.size)} — the limit is 10 MB per book.`)
    setFile(f)
  }

  const upload = async (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    e.preventDefault()
    if (!file) return
    setError('')
    const fd = new FormData(form)
    const title =
      String(fd.get('title') || '').trim() ||
      file.name.replace(/\.(pdf|epub)$/i, '').replace(/[-_]+/g, ' ')
    const author = String(fd.get('author') || '').trim() || null
    const format = file.name.toLowerCase().endsWith('.epub') ? 'epub' : 'pdf'

    const docRef = await addTo(uid, 'books', {
      title, author, format,
      size: file.size,
      storagePath: 'local-only',
      page: format === 'pdf' ? 1 : null,
      cfi: null, pct: 0, totalPages: null,
      uploadedAt: Date.now(),
      lastOpenedAt: null,
    })

    // local copy for instant/offline reading on this device
    void idbSet(`bookFile_${docRef.id}`, file).catch(() => {})

    // count pages immediately so the 2-week pace math works before first open
    void (async () => {
      const totalPages = await countBookPages(file, format)
      if (totalPages) await updateAt(uid, `books/${docRef.id}`, { totalPages })
    })()

    // cloud copy through Firestore (free plan — no Storage engine needed)
    setUploading(0)
    try {
      await uploadBookFile(uid, docRef.id, file, format, setUploading)
      await updateAt(uid, `books/${docRef.id}`, { storagePath: 'firestore' })
    } catch (err) {
      console.error(err)
      setError('Saved to this device, but the cloud copy failed (is Firestore enabled? See FIREBASE_SETUP.md).')
    } finally {
      setUploading(null)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      form.reset()
    }
  }

  const deleteBook = async (b: Book & { id: string }) => {
    if (!confirm(`Remove “${b.title}” from your library?`)) return
    await removeAt(uid, `books/${b.id}`)
    void idbDel(`bookFile_${b.id}`).catch(() => {})
    void deleteBookFile(uid, b.id).catch(() => {})
  }

  const sorted = [...books].sort((a, b) => (b.lastOpenedAt ?? b.uploadedAt) - (a.lastOpenedAt ?? a.uploadedAt))

  return (
    <div>
      <PageHeader title="Library" sub="Your books, your pace — 30 pages a day keeps the mind in bloom." />

      {/* today's reading goal */}
      <Card className={cx('mb-5', goalDone && 'celebrate')}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-48">
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="font-medium">Today’s pages</span>
              <span className={cx('tabular-nums', goalDone ? 'font-semibold text-sage' : 'text-mist')}>
                {pagesRead}/{pagesGoal} {goalDone && '· goal met ✓'}
              </span>
            </div>
            <Progress value={Math.min(100, (pagesRead / pagesGoal) * 100)} accent="sky" />
            <p className="mt-1.5 text-xs text-mist">
              Progress counts automatically as you turn pages in the reader.
            </p>
          </div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const n = Math.round(Number(fd.get('pagesGoal')))
              if (n >= 5 && n <= 500) void setAt(uid, '', { pagesGoal: n })
            }}
          >
            <Field label="Daily goal (pages)">
              <input type="number" name="pagesGoal" defaultValue={pagesGoal} min={5} max={500} className={cx(inputCls, 'w-24')} />
            </Field>
            <button type="submit" className={cx(btnPrimary, 'px-3.5')}>Set</button>
          </form>
        </div>
      </Card>

      {/* upload */}
      <Card className="mb-5">
        <h2 className="mb-3 font-display text-lg">Add a book</h2>
        <form onSubmit={upload} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Field label="PDF or EPUB (max 10 MB)">
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.epub,application/pdf,application/epub+zip"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-1 items-center gap-2 truncate rounded-xl border border-dashed border-line bg-white px-3.5 py-2.5 text-sm text-mist transition-colors hover:border-sky hover:text-ink"
              >
                <Icon name="upload" size={15} className="shrink-0" />
                {file ? `${file.name} (${fmtSize(file.size)})` : 'Choose file…'}
              </button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title">
              <input name="title" placeholder={file ? file.name.replace(/\.(pdf|epub)$/i, '').replace(/[-_]+/g, ' ') : 'Book title'} className={inputCls} />
            </Field>
            <Field label="Author">
              <input name="author" placeholder="Optional" className={inputCls} />
            </Field>
          </div>
          <button type="submit" disabled={!file || uploading !== null} className={btnPrimary}>
            <Icon name="upload" size={15} />
            {uploading !== null ? `${uploading}%` : 'Add to shelf'}
          </button>
        </form>
        {uploading !== null && (
          <div className="mt-3">
            <Progress value={uploading} accent="sky" />
          </div>
        )}
        {error && <p className="mt-3 rounded-xl bg-rose-soft px-3.5 py-2.5 text-sm text-rose">{error}</p>}
        {sorted.length > 0 && (
          <p className="mt-3 text-[11px] text-mist">
            Cloud library ≈ {fmtSize(estimateCloudBytes(sorted.map((b) => b.size)))} of the free ~1,000 MB
            Firestore allowance. Files on every device are also kept for offline reading.
          </p>
        )}
      </Card>

      {/* shelf */}
      {sorted.length === 0 ? (
        <Empty title="An empty shelf" hint="Upload your first PDF or EPUB above and Pip will keep count of your pages." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((b) => {
            const acc = ACCENTS[coverAccent(b.title)]
            const todayPages = readingToday?.byBook?.[b.id] ?? 0
            const pace = paceLine({ totalPages: b.totalPages, pct: b.pct, uploadedAt: b.uploadedAt, today })
            return (
              <Card key={b.id} className="flex flex-col !p-0 overflow-hidden">
                {/* cover */}
                <Link
                  href={`/reader?book=${b.id}`}
                  className="flex h-40 flex-col justify-between p-4 transition-transform hover:scale-[1.01]"
                  style={{ background: `linear-gradient(135deg, ${acc.hex}26, ${acc.hex}4d)` }}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-display text-4xl" style={{ color: acc.hex }}>
                      {b.title.charAt(0).toUpperCase()}
                    </span>
                    <Pill accent={b.format === 'pdf' ? 'rose' : 'sky'} className="uppercase">
                      {b.format}
                    </Pill>
                  </div>
                  <div>
                    <p className="font-display text-lg leading-tight line-clamp-2">{b.title}</p>
                    {b.author && <p className="mt-0.5 text-xs text-mist">{b.author}</p>}
                  </div>
                </Link>
                {/* meta + actions */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1 flex justify-between text-xs text-mist">
                    <span>{b.totalPages ? `${b.totalPages} pages` : fmtSize(b.size)}</span>
                    <span className="tabular-nums">{b.pct}%</span>
                  </div>
                  <Progress value={b.pct} accent={coverAccent(b.title)} />
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs">
                    {pace ? (
                      <span className="text-mist">
                        <Icon name="calendar" size={11} className="mr-1 inline text-sky" />
                        {pace}
                      </span>
                    ) : (
                      <span className="text-mist">{b.pct >= 100 ? 'Finished ✓' : '…'}</span>
                    )}
                    {todayPages > 0 && <span className="text-sky">+{todayPages} today</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Link href={`/reader?book=${b.id}`} className={cx(btnPrimary, 'flex-1 !py-2 text-xs')}>
                      <Icon name="book" size={13} /> {b.pct > 0 ? 'Continue' : 'Start reading'}
                    </Link>
                    <button
                      onClick={() => deleteBook(b)}
                      title="Remove book"
                      className="grid size-9 place-items-center rounded-full text-mist/60 transition-colors hover:bg-rose-soft hover:text-rose"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
