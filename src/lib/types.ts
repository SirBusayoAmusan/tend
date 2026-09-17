/** Firestore document shapes (all live under users/{uid}/...). */

export type Doc<T> = T & { id: string }

export interface UserProfile {
  name: string
  stepsGoal: number
  pagesGoal: number
  /** ISO weekdays with fasting: 1 = Mon … 7 = Sun. Default Mon/Wed/Fri. */
  fastDays?: number[]
  /** Monthly soft cap for treats/snacks spending (₦) — drives health signals. */
  treatsBudget?: number
}

export interface Habit {
  name: string
  accent: string
  perWeek: number
}

export interface HabitLog {
  habitId: string
  date: string
}

export type TaskRecur = 'none' | 'daily' | 'weekdays' | 'weekly'

export interface Task {
  title: string
  due: string | null // YYYY-MM-DD
  priority: number // 0 low · 1 normal · 2 high
  done: boolean
  doneAt: number | null // epoch ms
  recur?: TaskRecur
  createdAt: number
}

export interface Goal {
  title: string
  why: string | null
  domain: string
  targetDate: string | null
  progress: number
  done: boolean
  createdAt: number
}

export interface Milestone {
  title: string
  done: boolean
}

export interface JournalEntry {
  date: string
  mood: number | null // 1..5
  title: string | null
  body: string
  updatedAt: number
}

export interface SleepLog {
  hours: number
  quality: number // 1..5
}

export interface WeightLog {
  kg: number
}

export interface Txn {
  date: string
  kind: 'in' | 'out'
  amount: number
  category: string
  note: string | null
  createdAt: number
}

export interface LearnItem {
  kind: string // course | skill | other
  title: string
  creator: string | null
  progress: number
  done: boolean
  note: string | null
  /** Target finish date (YYYY-MM-DD); defaults to +14 days. */
  deadline: string | null
  createdAt: number
}

/* ---- Library ---- */

export interface Book {
  title: string
  author: string | null
  format: 'epub' | 'pdf'
  size: number // bytes
  storagePath: string
  page: number | null // last page (pdf) / derived page (epub)
  cfi: string | null // last epub position
  pct: number // 0..100
  totalPages: number | null
  uploadedAt: number
  lastOpenedAt: number | null
}

/** Doc id = date. Tracks pages read toward the daily goal. */
export interface ReadingDaily {
  total: number
  byBook: Record<string, number>
}

/* ---- Fitness ---- */

/** Doc id = date. */
export interface StepLog {
  count: number
}

/** Doc id = date. A scheduled fast day that was kept. */
export interface FastLog {
  kept: boolean
}

export interface PlanExercise {
  name: string
  pose: string // Stickman pose key
  detail: string // e.g. "3×10–12, slow tempo"
}

export interface PlanDay {
  type: 'home' | 'gym' | 'rest'
  title: string
  focus: string
  done: boolean
  exercises?: PlanExercise[]
}

/** Doc id = Monday of the week (YYYY-MM-DD). */
export interface FitnessPlan {
  weekId: string
  choice: 'home' | 'gym' | 'both'
  days: Record<string, PlanDay> // key = date
}

/* ---- Business ---- */

export type VentureStage = 'idea' | 'validating' | 'building' | 'launched' | 'growing'

export interface Venture {
  name: string
  stage: VentureStage
  description: string | null
  nextAction: string | null
  createdAt: number
}

/** Subcollection ventures/{id}/metrics, doc id = date. */
export interface VentureMetric {
  revenue: number
  customers: number
}
