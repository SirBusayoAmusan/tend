'use client'

import { useEffect, useState } from 'react'
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc,
  onSnapshot, increment, type DocumentData,
} from 'firebase/firestore'
import { fb } from './firebase'
import { shiftDays } from './util'
import type { Doc, Task } from './types'

/* ---------------------------------------------------------------- */
/* path helpers — everything lives under users/{uid}/...            */
/* ---------------------------------------------------------------- */

const segs = (path: string) => path.split('/').filter(Boolean)

export function ucol(uid: string, path: string) {
  return collection(fb().db, 'users', uid, ...segs(path))
}

export function udoc(uid: string, path: string) {
  return doc(fb().db, 'users', uid, ...segs(path))
}

export const userDocRef = (uid: string) => doc(fb().db, 'users', uid)

/* ---------------------------------------------------------------- */
/* hooks                                                             */
/* ---------------------------------------------------------------- */

/** Subscribe to a collection (or subcollection) under the user. null = loading. */
export function useDocs<T>(uid: string | null, path: string): Doc<T>[] | null {
  const [docs, setDocs] = useState<Doc<T>[] | null>(null)
  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(
      ucol(uid, path),
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) }) as Doc<T>))
      },
      // Firestore not created yet / offline → render empty states, not a spinner forever
      (err) => {
        console.warn(`useDocs(${path})`, err)
        setDocs([])
      }
    )
    return unsub
  }, [uid, path])
  useEffect(() => { if (!uid) setDocs(null) }, [uid])
  return docs
}

/** Subscribe to a single document. undefined = loading, null = doesn't exist. */
export function useDoc<T>(uid: string | null, path: string): Doc<T> | null | undefined {
  const [value, setValue] = useState<Doc<T> | null | undefined>(undefined)
  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(
      udoc(uid, path),
      (snap) => {
        setValue(snap.exists() ? ({ id: snap.id, ...(snap.data() as DocumentData) } as Doc<T>) : null)
      },
      (err) => {
        console.warn(`useDoc(${path})`, err)
        setValue(null)
      }
    )
    return unsub
  }, [uid, path])
  useEffect(() => { if (!uid) setValue(undefined) }, [uid])
  return value
}

/* ---------------------------------------------------------------- */
/* generic mutations                                                 */
/* ---------------------------------------------------------------- */

export async function addTo(uid: string, path: string, data: Record<string, unknown>) {
  return addDoc(ucol(uid, path), data)
}

export async function setAt(uid: string, path: string, data: Record<string, unknown>) {
  return setDoc(udoc(uid, path), data, { merge: true })
}

export async function updateAt(uid: string, path: string, data: Record<string, unknown>) {
  return updateDoc(udoc(uid, path), data)
}

export async function removeAt(uid: string, path: string) {
  return deleteDoc(udoc(uid, path))
}

/* ---------------------------------------------------------------- */
/* full backup — one JSON file with everything the user owns        */
/* ---------------------------------------------------------------- */

const BACKUP_COLLECTIONS = [
  'habits', 'habitLogs', 'tasks', 'goals', 'journal', 'sleep', 'weight',
  'txns', 'learn', 'books', 'readingDaily', 'steps', 'fitnessPlans', 'ventures',
]

/** Dumps every user collection (+ subcollections) into a plain object. */
export async function exportAllData(uid: string): Promise<Record<string, unknown>> {
  const dump: Record<string, unknown> = {
    app: 'tend-lifeos',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: (await getDoc(userDocRef(uid))).data() ?? null,
  }
  const snapshot = async (path: string) => {
    const { getDocs } = await import('firebase/firestore')
    const snap = await getDocs(ucol(uid, path))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }
  for (const c of BACKUP_COLLECTIONS) dump[c] = await snapshot(c)

  const goals = dump.goals as { id: string }[]
  const goalMilestones: Record<string, unknown[]> = {}
  for (const g of goals) goalMilestones[g.id] = await snapshot(`goals/${g.id}/milestones`)
  dump.goalMilestones = goalMilestones

  const ventures = dump.ventures as { id: string }[]
  const ventureMetrics: Record<string, unknown[]> = {}
  for (const v of ventures) ventureMetrics[v.id] = await snapshot(`ventures/${v.id}/metrics`)
  dump.ventureMetrics = ventureMetrics

  return dump
}

/* ---------------------------------------------------------------- */
/* domain-specific helpers                                           */
/* ---------------------------------------------------------------- */

export async function toggleHabitDoc(uid: string, habitId: string, date: string) {
  const ref = udoc(uid, `habitLogs/${habitId}_${date}`)
  const snap = await getDoc(ref)
  if (snap.exists()) await deleteDoc(ref)
  else await setDoc(ref, { habitId, date })
}

export async function toggleTaskDoc(uid: string, task: Doc<Task>) {
  const done = !task.done
  await updateAt(uid, `tasks/${task.id}`, { done, doneAt: done ? Date.now() : null })
  // recurring tasks live forever: completing one spawns the next occurrence
  const recur = task.recur ?? 'none'
  if (done && recur !== 'none' && task.due) {
    await addTo(uid, 'tasks', {
      title: task.title,
      due: nextOccurrence(task.due, recur),
      priority: task.priority,
      recur,
      done: false,
      doneAt: null,
      createdAt: Date.now(),
    })
  }
}

export function nextOccurrence(due: string, recur: 'daily' | 'weekdays' | 'weekly'): string {
  if (recur === 'weekly') return shiftDays(due, 7)
  let d = shiftDays(due, 1)
  if (recur === 'weekdays') {
    while ([0, 6].includes(new Date(d + 'T12:00:00').getDay())) d = shiftDays(d, 1)
  }
  return d
}

export async function saveMood(uid: string, date: string, mood: number) {
  await setAt(uid, `journal/${date}`, { date, mood, updatedAt: Date.now() })
}

export async function saveSteps(uid: string, date: string, count: number) {
  await setAt(uid, `steps/${date}`, { count: Math.max(0, Math.round(count)) })
}

/** Record pages read (positive deltas only) + persist reading position. */
export async function recordReading(
  uid: string,
  date: string,
  bookId: string,
  deltaPages: number,
  position: { page?: number; cfi?: string; pct?: number; totalPages?: number }
) {
  const writes: Promise<unknown>[] = []
  if (deltaPages > 0) {
    writes.push(
      setAt(uid, `readingDaily/${date}`, {
        total: increment(deltaPages),
        [`byBook.${bookId}`]: increment(deltaPages),
      })
    )
  }
  const bookUpdate: Record<string, unknown> = { lastOpenedAt: Date.now() }
  if (position.page !== undefined) bookUpdate.page = position.page
  if (position.cfi !== undefined) bookUpdate.cfi = position.cfi
  if (position.pct !== undefined) bookUpdate.pct = Math.round(position.pct)
  if (position.totalPages !== undefined) bookUpdate.totalPages = position.totalPages
  writes.push(updateAt(uid, `books/${bookId}`, bookUpdate))
  await Promise.all(writes)
}
