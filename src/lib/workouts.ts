import type { FitnessPlan, PlanDay } from './types'
import { weekDates } from './util'

interface Template {
  title: string
  focus: string
}

export const HOME_WORKOUTS: Template[] = [
  { title: 'Bodyweight circuit', focus: '3 rounds · push-ups, squats, lunges, plank (40s each)' },
  { title: 'HIIT burner', focus: '20 min · 40s on / 20s rest · jumping jacks, burpees, high knees, mountain climbers' },
  { title: 'Core & posture', focus: 'Plank series, glute bridges, dead bugs, bird dogs · 25 min' },
  { title: 'Yoga flow', focus: '30 min · sun salutations, hip openers, deep stretching' },
  { title: 'Lower-body strength', focus: 'Squats, Bulgarian split squats, calf raises, wall sit · 4 sets' },
  { title: 'Push & core', focus: 'Push-up ladder, pike push-ups, dips (chair), hollow hold' },
]

export const GYM_WORKOUTS: Template[] = [
  { title: 'Push day', focus: 'Bench press, overhead press, incline dumbbell, triceps · 4×8–10' },
  { title: 'Pull day', focus: 'Rows, lat pulldown, face pulls, curls · 4×8–12' },
  { title: 'Leg day', focus: 'Squats, Romanian deadlift, leg press, calves · 4×8–10' },
  { title: 'Upper strength', focus: 'Bench, barbell row, OHP, pull-ups · 5×5' },
  { title: 'Cardio engine', focus: '30 min · treadmill intervals or rower · zone 2 finish' },
  { title: 'Full body', focus: 'Deadlift, bench, squat, plank · 3×8' },
]

const REST_DAY: PlanDay = { type: 'rest', title: 'Rest & walk', focus: 'Recovery — still chase those steps', done: false }

function buildWeek(choice: 'home' | 'gym' | 'both'): PlanDay[] {
  if (choice === 'home') {
    return [
      { type: 'home', ...HOME_WORKOUTS[0], done: false },
      { type: 'home', ...HOME_WORKOUTS[1], done: false },
      { ...REST_DAY },
      { type: 'home', ...HOME_WORKOUTS[4], done: false },
      { type: 'home', ...HOME_WORKOUTS[2], done: false },
      { type: 'home', ...HOME_WORKOUTS[5], done: false },
      { type: 'home', ...HOME_WORKOUTS[3], done: false },
    ]
  }
  if (choice === 'gym') {
    return [
      { type: 'gym', ...GYM_WORKOUTS[0], done: false },
      { type: 'gym', ...GYM_WORKOUTS[1], done: false },
      { ...REST_DAY },
      { type: 'gym', ...GYM_WORKOUTS[2], done: false },
      { type: 'gym', ...GYM_WORKOUTS[3], done: false },
      { type: 'gym', ...GYM_WORKOUTS[4], done: false },
      { type: 'gym', ...GYM_WORKOUTS[5], done: false },
    ]
  }
  // both — gym anchors, home fills
  return [
    { type: 'gym', ...GYM_WORKOUTS[0], done: false },
    { type: 'home', ...HOME_WORKOUTS[1], done: false },
    { type: 'gym', ...GYM_WORKOUTS[1], done: false },
    { ...REST_DAY },
    { type: 'gym', ...GYM_WORKOUTS[2], done: false },
    { type: 'home', ...HOME_WORKOUTS[2], done: false },
    { type: 'home', ...HOME_WORKOUTS[3], done: false },
  ]
}

export function buildPlan(weekId: string, choice: 'home' | 'gym' | 'both'): FitnessPlan {
  const days: Record<string, PlanDay> = {}
  const week = buildWeek(choice)
  weekDates(weekId).forEach((date, i) => {
    days[date] = week[i]
  })
  return { weekId, choice, days }
}
