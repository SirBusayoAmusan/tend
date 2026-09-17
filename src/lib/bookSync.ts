'use client'

/**
 * Book file sync through Firestore — no Firebase Storage (and no Blaze plan) needed.
 *
 * Files are base64-encoded and split into chunks of ~933 KB, each stored as one
 * Firestore document (docs may be up to 1 MiB). Personal library scale makes this
 * comfortably free: 1 GiB free storage ≈ 75 books at the full 10 MB each,
 * far more at typical e-book sizes.
 */

import { getDoc, setDoc, getDocs, writeBatch } from 'firebase/firestore'
import { fb } from './firebase'
import { ucol, udoc } from './store'

/** binary bytes per chunk (≈933,336 chars of base64 → safely under the 1 MiB doc limit) */
const CHUNK_BYTES = 700_000
const CHARS_PER_CHUNK = Math.ceil(CHUNK_BYTES / 3) * 4 // 4-aligned so parts rejoin cleanly

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  epub: 'application/epub+zip',
}

function blobToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}

export async function uploadBookFile(
  uid: string,
  bookId: string,
  file: Blob,
  format: 'pdf' | 'epub',
  onProgress: (pct: number) => void
): Promise<void> {
  const b64 = await blobToBase64(file)
  const parts: string[] = []
  for (let i = 0; i < b64.length; i += CHARS_PER_CHUNK) {
    parts.push(b64.slice(i, i + CHARS_PER_CHUNK))
  }
  await setDoc(udoc(uid, `bookFiles/${bookId}`), {
    contentType: MIME[format] ?? 'application/octet-stream',
    chunks: parts.length,
    size: file.size,
    updatedAt: Date.now(),
  })
  for (let i = 0; i < parts.length; i++) {
    await setDoc(udoc(uid, `bookFiles/${bookId}/parts/${String(i).padStart(4, '0')}`), { data: parts[i] })
    onProgress(Math.round(((i + 1) / parts.length) * 100))
  }
}

/** Returns the reassembled file, or null if there is no cloud copy. */
export async function downloadBookFile(uid: string, bookId: string): Promise<Blob | null> {
  const metaSnap = await getDoc(udoc(uid, `bookFiles/${bookId}`))
  if (!metaSnap.exists()) return null
  const meta = metaSnap.data() as { contentType?: string }
  const partsSnap = await getDocs(ucol(uid, `bookFiles/${bookId}/parts`))
  const parts = partsSnap.docs
    .map((d) => ({ id: d.id, data: String((d.data() as Record<string, unknown>).data ?? '') }))
    .sort((a, b) => a.id.localeCompare(b.id))
  const b64 = parts.map((p) => p.data).join('')
  if (!b64) return null
  return base64ToBlob(b64, meta.contentType ?? 'application/octet-stream')
}

export async function deleteBookFile(uid: string, bookId: string): Promise<void> {
  const partsSnap = await getDocs(ucol(uid, `bookFiles/${bookId}/parts`))
  const batch = writeBatch(fb().db)
  partsSnap.docs.forEach((d) => batch.delete(d.ref))
  batch.delete(udoc(uid, `bookFiles/${bookId}`))
  await batch.commit()
}

/** Rough estimate of Firestore bytes used by synced books (base64 overhead included). */
export function estimateCloudBytes(bookSizes: number[]): number {
  return Math.round(bookSizes.reduce((s, n) => s + n, 0) * 4 / 3)
}
