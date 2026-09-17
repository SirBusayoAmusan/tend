import type { FitnessPlan, PlanDay, PlanExercise } from './types'
import { weekDates } from './util'

interface Template {
  title: string
  focus: string
  exercises: PlanExercise[]
}

const ex = (name: string, pose: string, detail: string): PlanExercise => ({ name, pose, detail })

export const HOME_WORKOUTS: Template[] = [
  {
    title: 'Bodyweight circuit',
    focus: '3 rounds, 60s rest between rounds',
    exercises: [
      ex('Push-ups', 'pushup', '3×10–15 · full range'),
      ex('Squats', 'squat', '3×15–20 · chest tall'),
      ex('Lunges', 'lunge', '3×10 each leg'),
      ex('Plank', 'plank', '3×40 seconds'),
      ex('Jumping jacks', 'jumpingjack', '3×30 to finish'),
    ],
  },
  {
    title: 'HIIT burner',
    focus: '20 min · 40s work / 20s rest',
    exercises: [
      ex('Jumping jacks', 'jumpingjack', '5 rounds · 40s on / 20s off'),
      ex('Burpees', 'burpee', '5 rounds · chest to floor'),
      ex('Mountain climbers', 'climber', '5 rounds · fast knees'),
      ex('Squat pulses', 'squat', '4 rounds · stay low'),
      ex('Plank hold', 'plank', '2 min cool-down'),
    ],
  },
  {
    title: 'Core & posture',
    focus: '25 min · slow and controlled',
    exercises: [
      ex('Plank', 'plank', '3×45 seconds'),
      ex('Dead bugs', 'deadbug', '3×10 each side'),
      ex('Glute bridges', 'bridge', '3×15 · squeeze at top'),
      ex('Slow climbers', 'climber', '3×12 · knee to chest'),
      ex('Downward dog stretch', 'stretch', '5 min to finish'),
    ],
  },
  {
    title: 'Yoga flow',
    focus: '30 min · breathe through every pose',
    exercises: [
      ex('Downward dog', 'stretch', '3×60 seconds'),
      ex('Low lunge', 'lunge', '2×60s each side'),
      ex('Goddess hold', 'squat', '3×40 seconds'),
      ex('Bridge pose', 'bridge', '2×45 seconds'),
      ex('Wall sit (or seated fold)', 'wallsit', '2×45 seconds'),
    ],
  },
  {
    title: 'Lower-body strength',
    focus: '4 sets each · rest 90s',
    exercises: [
      ex('Squats', 'squat', '4×12 · go heavy if you can'),
      ex('Bulgarian split squats', 'lunge', '3×8 each leg'),
      ex('Wall sit', 'wallsit', '3×45 seconds'),
      ex('Single-leg glute bridges', 'bridge', '3×10 each side'),
      ex('Calf raises', 'squat', '4×20 · pause at top'),
    ],
  },
  {
    title: 'Push & core',
    focus: 'Get the chest pump at home',
    exercises: [
      ex('Push-up ladder', 'pushup', '10, 9, 8 … down to 1'),
      ex('Pike push-ups', 'pushup', '3×8 · hips high'),
      ex('Chair dips', 'squat', '3×10–12'),
      ex('Hollow hold', 'plank', '3×20 seconds'),
      ex('Dead bugs', 'deadbug', '3×10 each side'),
    ],
  },
]

export const GYM_WORKOUTS: Template[] = [
  {
    title: 'Push day',
    focus: 'Chest, shoulders, triceps',
    exercises: [
      ex('Bench press', 'bench', '4×8–10 · control the bar'),
      ex('Overhead press', 'ohp', '3×8 · no leg drive'),
      ex('Incline dumbbell press', 'bench', '3×10 · 30° bench'),
      ex('Bench dips', 'pushup', '3×10–12'),
      ex('Push-up finisher', 'pushup', '1 set to failure'),
    ],
  },
  {
    title: 'Pull day',
    focus: 'Back & biceps',
    exercises: [
      ex('Barbell rows', 'row', '4×8–10 · squeeze lats'),
      ex('Lat pulldown', 'pulldown', '4×10–12 · full stretch'),
      ex('Face pulls', 'row', '3×15 · rear delts'),
      ex('Dumbbell curls', 'curl', '3×12 · no swinging'),
    ],
  },
  {
    title: 'Leg day',
    focus: 'Quads, glutes, calves',
    exercises: [
      ex('Barbell squats', 'squat', '4×8 · depth below parallel'),
      ex('Romanian deadlift', 'row', '4×10 · hinge, flat back'),
      ex('Leg press', 'squat', '3×12 · full range'),
      ex('Walking lunges', 'lunge', '3×12 each leg'),
      ex('Standing calf raises', 'squat', '4×15'),
    ],
  },
  {
    title: 'Upper strength',
    focus: 'Heavy 5×5 day',
    exercises: [
      ex('Bench press', 'bench', '5×5 · heavy, spot if needed'),
      ex('Barbell row', 'row', '5×5 · heavy'),
      ex('Overhead press', 'ohp', '4×6'),
      ex('Weighted pull-ups / pulldown', 'pulldown', '4×6'),
      ex('Farmer walk (hold heavy!)', 'squat', '3×40 meters'),
    ],
  },
  {
    title: 'Cardio engine',
    focus: 'Heart & lungs day',
    exercises: [
      ex('Treadmill intervals', 'run', '20 min · 1 min fast / 1 min easy'),
      ex('Rowing machine', 'row', '10 min · strong pulls'),
      ex('Jumping jacks', 'jumpingjack', '3×45s warm-up finisher'),
      ex('Cool-down walk + stretch', 'stretch', '5–10 min easy'),
    ],
  },
  {
    title: 'Full body',
    focus: 'Cover everything in one session',
    exercises: [
      ex('Deadlift', 'row', '4×6 · brace hard'),
      ex('Bench press', 'bench', '3×8'),
      ex('Squats', 'squat', '3×8'),
      ex('Overhead press', 'ohp', '3×10'),
      ex('Plank', 'plank', '3×45 seconds'),
    ],
  },
]

const REST_DAY: PlanDay = {
  type: 'rest',
  title: 'Rest & walk',
  focus: 'Recovery — still chase those steps',
  done: false,
  exercises: [
    ex('Easy walk', 'run', '20–40 min · conversational pace'),
    ex('Downward dog', 'stretch', '3×60 seconds'),
    ex('Low lunge stretch', 'lunge', '60s each side'),
    ex('Glute bridge', 'bridge', '2×12 · gentle'),
  ],
}

function buildWeek(choice: 'home' | 'gym' | 'both'): PlanDay[] {
  const h = (t: Template): PlanDay => ({ type: 'home', title: t.title, focus: t.focus, done: false, exercises: t.exercises })
  const g = (t: Template): PlanDay => ({ type: 'gym', title: t.title, focus: t.focus, done: false, exercises: t.exercises })
  if (choice === 'home') {
    return [h(HOME_WORKOUTS[0]), h(HOME_WORKOUTS[1]), REST_DAY, h(HOME_WORKOUTS[4]), h(HOME_WORKOUTS[2]), h(HOME_WORKOUTS[5]), h(HOME_WORKOUTS[3])]
  }
  if (choice === 'gym') {
    return [g(GYM_WORKOUTS[0]), g(GYM_WORKOUTS[1]), REST_DAY, g(GYM_WORKOUTS[2]), g(GYM_WORKOUTS[3]), g(GYM_WORKOUTS[4]), g(GYM_WORKOUTS[5])]
  }
  return [g(GYM_WORKOUTS[0]), h(HOME_WORKOUTS[1]), g(GYM_WORKOUTS[1]), REST_DAY, g(GYM_WORKOUTS[2]), h(HOME_WORKOUTS[2]), h(HOME_WORKOUTS[3])]
}

export function buildPlan(weekId: string, choice: 'home' | 'gym' | 'both'): FitnessPlan {
  const days: Record<string, PlanDay> = {}
  const week = buildWeek(choice)
  weekDates(weekId).forEach((date, i) => {
    days[date] = week[i]
  })
  return { weekId, choice, days }
}
