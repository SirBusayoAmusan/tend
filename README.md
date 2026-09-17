# Tend — your Life OS

A personal life-operating-system: one calm, journal-like place to track every part of your life,
with a small animated companion — **Pip** — who grows as you stay consistent.

**Architecture:** a fully static web app (Next.js static export) + **Firebase**
(Auth · Firestore — **no Storage engine, no Blaze plan, no credit card**). No server of
your own — deploy by **dragging the `out/` folder onto Netlify Drop**. Book files sync
through Firestore itself (chunked under the 1 MiB/doc limit) and are also cached
on-device for offline reading.

## What's inside

| Module | Highlights |
| --- | --- |
| **Today** | Pip (Seed→Sprout→Bud→Bloom→Flourish), five daily rings, habit checklist, mood check-in, focus tasks, snapshots |
| **Habits** | Streaks, 7-day dot grid, weekly targets |
| **Tasks** | Due dates, priorities, Overdue/Today/Upcoming/Anytime/Done · **“Sync to phone calendar” (.ics)** |
| **Goals** | “Why”, domains, milestones, progress sliders · **calendar export too** |
| **Journal** | One page a day: mood + title + writing, rotating prompt |
| **Health** | Sleep chart + quality, weight trend |
| **Fitness** | **20,000-steps daily goal** with ring + streak · weekly plan: pick **Home / Gym / Both** each week and the week is calibrated for you |
| **Money** | ₦ income/spending, categories, monthly net |
| **Library** | Upload **PDF/EPUB ≤ 10 MB**, Apple-Books-style reader with **page-flip animation**, remembers your page on every device — and **tracks the 30-pages-a-day goal automatically** as you flip |
| **Learn** | Courses & skills with progress |
| **Business** | Venture pipeline (Idea → Validating → Building → Launched → Growing), daily revenue/customer metrics per venture, next action |

## Deploy to Netlify (drag & drop)

```bash
npm install
# 1) paste your Firebase web config into public/firebase-config.json  (see FIREBASE_SETUP.md)
npm run build        # produces the static out/ folder
```

2) Go to [app.netlify.com/drop](https://app.netlify.com/drop) and **drag the `out/` folder in**.
Your site is live immediately.

3) In Firebase: **Authentication → Settings → Authorized domains** → add your new
`*.netlify.app` domain (see FIREBASE_SETUP.md §6).

> You only need to rebuild when the app itself changes — editing `firebase-config.json`
> inside the exported `out/` folder works too if you ever rotate keys (just re-drag the folder).

## Phone calendar sync

Tasks (due dates) and Goals (target dates) have **“Sync to calendar” buttons** that download a
`.ics` file. Open the file **on your phone** → iOS offers “Add to Apple Calendar”; Android opens
Google Calendar. (It's a live snapshot each time you tap — re-export after planning a new week.)

## Dev

```bash
npm run build         # static export to out/
npx serve out         # or: python3 -m http.server -d out
```

Files:

- `src/lib/store.ts` — Firestore hooks + mutations (`users/{uid}/…`)
- `src/components/Mascot.tsx` / `globals.css` — Pip SVG + the page-flip / animation set
- `src/app/reader` — PDF (pdf.js) + EPUB (epub.js) reader
- `FIREBASE_SETUP.md` — services, security rules, 10 MB enforcement, Storage CORS

## Roadmap ideas

- Live calendar feed via a tiny Cloud Function (auto-sync without re-export)
- Weekly review page + GitHub-style habit heatmap
- Steps auto-import (Google Fit / Apple Health export)
- PWA install for the phone home screen
