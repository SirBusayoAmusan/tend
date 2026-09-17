'use client'

/** Eagerly counts a book's pages at upload so pace math works before first open. */
export async function countBookPages(file: Blob, format: 'pdf' | 'epub'): Promise<number | null> {
  try {
    if (format === 'pdf') {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
      const n = doc.numPages
      await doc.destroy()
      return n
    }
    const ePub = (await import('epubjs')).default
    const book = ePub(await file.arrayBuffer())
    await book.ready
    const locations = await book.locations.generate(1200)
    book.destroy()
    return locations.length
  } catch (e) {
    console.warn('countBookPages failed', e)
    return null
  }
}

const DAY_MS = 86_400_000

/** The reading-pace story for a book: pages/day to finish inside the 2-week sprint. */
export function paceLine(input: {
  totalPages: number | null
  pct: number
  uploadedAt: number
  today: string
}): string | null {
  if (!input.totalPages || input.pct >= 100) return null
  const remaining = Math.max(1, Math.ceil(input.totalPages * (1 - input.pct / 100)))
  const finishBy = new Date(input.uploadedAt + 14 * DAY_MS)
  const finishStr = `${finishBy.getFullYear()}-${String(finishBy.getMonth() + 1).padStart(2, '0')}-${String(finishBy.getDate()).padStart(2, '0')}`
  const daysLeft = Math.ceil((new Date(finishStr + 'T12:00:00').getTime() - new Date(input.today + 'T12:00:00').getTime()) / DAY_MS)
  if (daysLeft > 0) {
    const pace = Math.ceil(remaining / daysLeft)
    return `~${pace} pages/day to finish by ${finishBy.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
  }
  const pace = Math.ceil(remaining / 14)
  return `2-week window passed — ~${pace} pages/day starts a fresh sprint`
}
