'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import { downloadBookFile } from '@/lib/bookSync'
import { todayStr, clamp, cx } from '@/lib/util'
import { useAuth, PageLoader } from '@/components/Providers'
import Shell from '@/components/Shell'
import { useDoc, recordReading } from '@/lib/store'
import type { Book, ReadingDaily, UserProfile } from '@/lib/types'
import { Card, Icon, Pill, Progress, ACCENTS } from '@/components/ui'

export default function ReaderPage() {
  return (
    <Suspense fallback={<PageLoader line="Opening your book…" />}>
      <Shell>
        <ReaderInner />
      </Shell>
    </Suspense>
  )
}

function ReaderInner() {
  const uid = useAuth().user!.uid
  const today = todayStr()
  const bookId = useSearchParams().get('book') ?? ''
  const book = useDoc<Book>(uid, `books/${bookId}`)
  const readingToday = useDoc<ReadingDaily>(uid, `readingDaily/${today}`)
  const profile = useDoc<UserProfile>(uid, '')

  if (book === undefined || readingToday === undefined || profile === undefined) {
    return <PageLoader line="Opening your book…" />
  }
  if (book === null) {
    return (
      <Card className="py-12 text-center">
        <p className="font-display text-xl">This book isn’t on your shelf anymore.</p>
        <Link href="/library" className="mt-3 inline-block text-sm font-medium text-sky hover:underline">
          ← Back to Library
        </Link>
      </Card>
    )
  }
  return (
    <Reader
      key={book.id}
      uid={uid}
      today={today}
      book={book}
      pagesRead={readingToday?.total ?? 0}
      pagesGoal={profile?.pagesGoal ?? 30}
    />
  )
}

/* ================================================================== */

function Reader({
  uid, today, book, pagesRead, pagesGoal,
}: {
  uid: string
  today: string
  book: Book & { id: string }
  pagesRead: number
  pagesGoal: number
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [page, setPage] = useState(book.page ?? 1)
  const [totalPages, setTotalPages] = useState(book.totalPages ?? 0)
  const [flipClass, setFlipClass] = useState('')

  const bytesRef = useRef<ArrayBuffer | null>(null)
  const pdfRef = useRef<{ doc: any } | null>(null)
  const epubRef = useRef<{ rendition: any; book: any } | null>(null)
  const maxTrackedRef = useRef(book.page ?? 1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pageBoxRef = useRef<HTMLDivElement>(null)
  const flipTimer = useRef<number[]>([])

  /* ---------- load bytes (device copy → cloud fallback) ---------- */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let file = await idbGet(`bookFile_${book.id}`)
        if (!file) {
          const down = await downloadBookFile(uid, book.id)
          if (!down) throw new Error('no-cloud')
          file = down
          void idbSet(`bookFile_${book.id}`, file).catch(() => {})
        }
        if (cancelled) return
        bytesRef.current = await (file as Blob).arrayBuffer()
        setStatus('ready')
      } catch {
        if (cancelled) return
        setError(
          'This book file isn’t on this device and has no cloud copy yet. Re-upload the file here to read it (uploads now sync through Firestore for free).'
        )
        setStatus('error')
      }
    })()
    return () => {
      cancelled = true
      flipTimer.current.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id])

  /* ---------- init renderer ---------- */
  useEffect(() => {
    if (status !== 'ready') return
    let destroyed = false

    if (book.format === 'pdf') {
      ;(async () => {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        if (destroyed) return
        const doc = await pdfjs.getDocument({ data: bytesRef.current!.slice(0) }).promise
        if (destroyed) return
        pdfRef.current = { doc }
        setTotalPages(doc.numPages)
        setPage(clamp(book.page ?? 1, 1, doc.numPages))
        maxTrackedRef.current = clamp(book.page ?? 1, 1, doc.numPages)
      })().catch(() => {
        setError('Couldn’t read this PDF — it may be corrupted or encrypted.')
        setStatus('error')
      })
    } else {
      ;(async () => {
        const ePub = (await import('epubjs')).default
        if (destroyed || !pageBoxRef.current) return
        const epubBook = ePub(bytesRef.current!.slice(0))
        const rendition = epubBook.renderTo(pageBoxRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
        })
        rendition.themes.default({
          body: {
            color: '#2e2a26 !important',
            background: 'transparent !important',
            'font-family': 'Georgia, "Iowan Old Style", serif !important',
            'line-height': '1.75 !important',
            'font-size': '1.05em !important',
            padding: '8px 4px !important',
          },
          p: { 'margin-bottom': '0.9em !important' },
          'h1, h2, h3': { 'font-family': 'Georgia, serif !important', color: '#2e2a26 !important' },
          img: { 'max-width': '100% !important' },
        })
        epubRef.current = { rendition, book: epubBook }
        await epubBook.ready
        if (destroyed) return
        await rendition.display(book.cfi ?? undefined)
        if (destroyed) return
        const locations = await epubBook.locations.generate(1200)
        if (destroyed) return
        setTotalPages(locations.length)
        if (book.cfi) {
          const idx = epubBook.locations.locationFromCfi(book.cfi)
          if (typeof idx === 'number' && idx > 0) {
            setPage(idx + 1)
            maxTrackedRef.current = idx + 1
          }
        }
        rendition.on('relocated', (loc: any) => {
          const cfi: string | undefined = loc?.start?.cfi
          let idx = 0
          if (cfi) {
            const fromCfi = epubBook.locations.locationFromCfi(cfi)
            if (typeof fromCfi === 'number') idx = fromCfi
          }
          const pageNum = idx + 1
          setPage(pageNum)
          const total = epubBook.locations.length || 1
          const delta = pageNum - maxTrackedRef.current
          if (delta > 0) maxTrackedRef.current = pageNum
          void recordReading(uid, today, book.id, Math.max(0, delta), {
            cfi: cfi ?? undefined,
            page: pageNum,
            pct: (pageNum / total) * 100,
            totalPages: total,
          })
        })
      })().catch(() => {
        setError('Couldn’t read this EPUB — it may be corrupted or DRM-protected.')
        setStatus('error')
      })
    }

    return () => {
      destroyed = true
      if (epubRef.current) {
        try {
          epubRef.current.rendition?.destroy()
          epubRef.current.book?.destroy()
        } catch {}
        epubRef.current = null
      }
      if (pdfRef.current) {
        try { pdfRef.current.doc?.destroy() } catch {}
        pdfRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  /* ---------- render PDF page ---------- */
  useEffect(() => {
    if (status !== 'ready' || book.format !== 'pdf' || !pdfRef.current) return
    let cancelled = false
    ;(async () => {
      const doc = pdfRef.current!.doc
      const p = await doc.getPage(page)
      if (cancelled || !canvasRef.current) return
      const canvas = canvasRef.current
      const box = canvas.parentElement!
      const base = p.getViewport({ scale: 1 })
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const scale = ((box.clientWidth || 640) / base.width) * dpr
      const viewport = p.getViewport({ scale })
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = '100%'
      canvas.style.height = 'auto'
      await p.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
    })().catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status])

  /* ---------- navigation with flip animation ---------- */
  const go = useCallback(
    (dir: 'next' | 'prev') => {
      if (status !== 'ready') return
      if (book.format === 'pdf') {
        const target = page + (dir === 'next' ? 1 : -1)
        if (target < 1 || target > totalPages) return
      }
      setFlipClass(dir === 'next' ? 'flip-out-next' : 'flip-out-prev')
      flipTimer.current.push(
        window.setTimeout(() => {
          if (book.format === 'pdf') {
            const target = page + (dir === 'next' ? 1 : -1)
            setPage(target)
            const delta = target - maxTrackedRef.current
            if (delta > 0) maxTrackedRef.current = target
            if (delta !== 0) {
              void recordReading(uid, today, book.id, Math.max(0, delta), {
                page: target,
                pct: (target / Math.max(1, totalPages)) * 100,
                totalPages,
              })
            } else {
              void recordReading(uid, today, book.id, 0, { page: target })
            }
          } else {
            const r = epubRef.current?.rendition
            if (r) void (dir === 'next' ? r.next() : r.prev())
          }
          setFlipClass(dir === 'next' ? 'flip-in-next' : 'flip-in-prev')
          flipTimer.current.push(window.setTimeout(() => setFlipClass(''), 280))
        }, 180)
      )
    },
    [book.format, book.id, page, status, today, totalPages, uid]
  )

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go('next')
      if (e.key === 'ArrowLeft') go('prev')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  /* tap zones: right 40% = next, left 40% = prev (Apple-Books-like) */
  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const frac = (e.clientX - box.left) / box.width
    if (frac > 0.62) go('next')
    else if (frac < 0.38) go('prev')
  }

  const goalDone = pagesRead >= pagesGoal
  const pctText = totalPages > 0 ? Math.round((page / totalPages) * 100) : book.pct

  return (
    <div className="mx-auto max-w-3xl">
      {/* header */}
      <div className="mb-3 flex items-center gap-3">
        <Link
          href="/library"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-white text-mist transition-colors hover:text-ink"
          title="Back to Library"
        >
          <Icon name="arrow-left" size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg">{book.title}</h1>
          <p className="text-xs text-mist">
            {book.author ?? book.format.toUpperCase()}
            {totalPages > 0 && ` · page ${page} of ${totalPages} · ${pctText}%`}
          </p>
        </div>
        <Pill accent={goalDone ? 'sage' : 'sky'} className="shrink-0">
          <Icon name="book" size={11} /> {pagesRead}/{pagesGoal} today{goalDone ? ' ✓' : ''}
        </Pill>
      </div>

      {/* progress toward daily goal */}
      <div className={cx('mb-4', goalDone && 'celebrate')}>
        <Progress value={Math.min(100, (pagesRead / pagesGoal) * 100)} accent="sky" />
      </div>

      {/* page surface */}
      {status === 'loading' && <PageLoader line="Preparing your pages…" />}
      {status === 'error' && (
        <Card className="py-12 text-center">
          <p className="font-display text-xl">Can’t open this book here</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-mist">{error}</p>
          <Link href="/library" className="mt-4 inline-block text-sm font-medium text-sky hover:underline">
            ← Back to Library
          </Link>
        </Card>
      )}
      {status === 'ready' && (
        <>
          <div className="flip-stage">
            <div
              ref={book.format === 'epub' ? pageBoxRef : undefined}
              onClick={onTap}
              className={cx(
                'flip-leaf reader-paper relative min-h-[62vh] cursor-pointer select-none rounded-2xl border border-line',
                flipClass,
                book.format === 'epub' && 'h-[68vh] overflow-hidden'
              )}
            >
              {book.format === 'pdf' && (
                <div className="p-3 md:p-5">
                  <canvas ref={canvasRef} className="mx-auto rounded-md" />
                </div>
              )}
            </div>
          </div>
          {book.format === 'epub' && (
            <p className="mt-2 text-center text-[11px] text-mist">
              Tip: tap the left/right sides of the page (or use ← →) to flip
            </p>
          )}
        </>
      )}

      {/* bottom nav */}
      {status === 'ready' && (
        <div className="sticky bottom-4 mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => go('prev')}
            disabled={book.format === 'pdf' && page <= 1}
            className="grid size-11 place-items-center rounded-full border border-line bg-white text-mist shadow-sm transition-colors hover:text-ink disabled:opacity-40"
            aria-label="Previous page"
          >
            <Icon name="arrow-left" size={17} />
          </button>
          <span className="rounded-full border border-line bg-white px-4 py-2.5 text-xs tabular-nums text-mist shadow-sm">
            {totalPages > 0 ? `${page} / ${totalPages}` : '…'}
          </span>
          <button
            onClick={() => go('next')}
            disabled={book.format === 'pdf' && page >= totalPages}
            className="grid size-11 place-items-center rounded-full bg-ink text-paper shadow-sm transition hover:opacity-90 disabled:opacity-40"
            aria-label="Next page"
          >
            <Icon name="arrow-right" size={17} />
          </button>
        </div>
      )}
    </div>
  )
}
