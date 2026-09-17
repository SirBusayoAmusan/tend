export const PROMPTS = [
  'What would today look like if it went exactly right?',
  'What are you avoiding, and what is one small step toward it?',
  'Who made your life better this week? How?',
  'What drained you today, and what restored you?',
  'What did past-you work hard for that present-you now enjoys?',
  'Describe a moment today you want to remember.',
  'What belief about yourself is overdue for an upgrade?',
  'If your body could send you one message, what would it say?',
  'What is enough, for today?',
  'Which habit quietly changed you this year?',
  'What are you pretending not to know?',
  'What would you do with an extra free hour tomorrow?',
  'Name three things within arm’s reach you’re grateful for.',
  'Where did you act like the person you want to become?',
  'What conversation are you postponing?',
  'What did you learn about yourself this week?',
  'What can you let go of before tomorrow?',
  'How is your “future self” counting on you tonight?',
  'What’s working better than you expected?',
  'What tiny luxury made today nicer?',
  'If today were a chapter title in your autobiography, what would it be?',
  'What do you need to hear right now? Say it to yourself.',
  'Where did you choose courage over comfort recently?',
  'What does “rest” mean to you, honestly?',
  'Which relationship deserves more tending?',
  'What are you curious about right now?',
  'What would you attempt if you trusted yourself fully?',
  'How did you spend your attention today? Was it worth it?',
  'What is one promise you’ll make to tomorrow-you?',
  'Write down something that’s true that you rarely admit.',
]

/** Deterministic prompt of the day for a given YYYY-MM-DD. */
export function promptFor(dateStr: string): string {
  let h = 0
  for (const c of dateStr) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PROMPTS[h % PROMPTS.length]
}
