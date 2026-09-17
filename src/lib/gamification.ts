import { shiftDays } from './util'

/**
 * Pip's growth stages — the "no-XP" gamification.
 * Your score comes from consistency, not points grinding:
 * habits kept (70%) + days you touched the app at all (30%).
 */
export const STAGES = ['Seed', 'Sprout', 'Bud', 'Bloom', 'Flourish'] as const
export const STAGE_FLOORS = [0, 10, 30, 55, 80]

export function streak(dates: ReadonlySet<string>, today: string): number {
  // A streak counts from today if done, otherwise from yesterday (still alive).
  let d = dates.has(today) ? today : shiftDays(today, -1)
  let n = 0
  while (dates.has(d)) {
    n++
    d = shiftDays(d, -1)
  }
  return n
}

export function bloomScore(
  habitDone: number,
  habitPossible: number,
  activeDays: number,
  windowDays: number
): number {
  const habitPart = habitPossible > 0 ? Math.min(1, habitDone / habitPossible) * 70 : 0
  const actPart = Math.min(1, activeDays / windowDays) * 30
  return Math.round(habitPart + actPart)
}

export function stageFor(score: number): number {
  for (let i = STAGE_FLOORS.length - 1; i >= 0; i--) {
    if (score >= STAGE_FLOORS[i]) return i
  }
  return 0
}

export function nextStage(score: number): { label: string; floor: number } | null {
  const s = stageFor(score)
  return s >= 4 ? null : { label: STAGES[s + 1], floor: STAGE_FLOORS[s + 1] }
}

export type MascotMood = 'happy' | 'content' | 'sleepy'

export function mascotMood(ringAverage: number): MascotMood {
  if (ringAverage >= 0.72) return 'happy'
  if (ringAverage >= 0.38) return 'content'
  return 'sleepy'
}

export const MOOD_LINES: Record<MascotMood, string[]> = {
  happy: [
    'Look at you bloom. Keep going!',
    'Everything you watered is growing.',
    'A lovely day of tending. I’m proud of you.',
  ],
  content: [
    'One leaf at a time. What’s next?',
    'A little more light today and I bloom.',
    'Good pace. Shall we close one more ring?',
  ],
  sleepy: [
    'A small start still counts. Water one habit.',
    'Even seeds rest. Then they rise.',
    'I get sleepy when the rings stay open… one tiny thing?',
  ],
}
