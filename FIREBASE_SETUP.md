# Firebase setup — ~5 minutes, fully on the free plan

Tend stores everything in **your own free Firebase project**. It uses only
**Authentication** and **Firestore** — both fully usable on the free "Spark" plan,
no credit card, no Blaze upgrade, no Storage engine.

> **Why not Firebase Storage?** The book files (PDF/EPUB ≤ 10 MB) are synced through
> Firestore itself: each file is base64-chunked into ~933 KB documents (under the
> 1 MiB/doc limit). Personal scale makes this effectively free forever:
> **1 GiB free storage ≈ ~75 books at the full 10 MB** (hundreds at typical sizes),
> and the daily read/write quotas are far beyond one person's use. Every file is also
> kept in your browser's IndexedDB for instant/offline reading per device.

## 1. Create the project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Name it anything (e.g. `tend`). You can **disable Google Analytics** — not needed.

## 2. Enable the two services

- **Build → Authentication → Sign-in method** → enable **Email/Password**
- **Build → Firestore Database** → **Create database** → production mode → closest region

(~~Storage~~ not needed — skip it entirely.)

## 3. Register the web app & copy the config

1. **Project settings** (gear icon) → **Your apps** → `</>` (Web) → nickname "tend" → Register
2. Copy the values into **`public/firebase-config.json`**. That file is loaded at runtime,
   so you can rotate keys later without rebuilding — edit and re-drag the `out/` folder.

## 4. Lock down your data (recommended)

**Firestore → Rules** (this single ruleset also protects the book chunks):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Optional hardening — enforce the chunk-size cap server-side. Add this *above* the
generic match inside `users/{uid}`:

```
match /bookFiles/{book}/parts/{part} {
  allow write: if request.auth != null && request.auth.uid == uid
               && request.resource.data.data.size() < 950000;
}
```

## 5. Add your domains to Auth

**Authentication → Settings → Authorized domains** → add every domain you use:
- your preview/dev domain (e.g. `….e2b.app` while developing)
- your Netlify domain after deploying (`your-site.netlify.app`)

Without this, sign-in on that domain is blocked. (localhost is pre-authorized.)

---

## Data durability — read this 🙂

**Firestore does not clear your data every 7 or 30 days.** There is no default expiry:
records persist forever until *you* delete them. The only time-based deleters in
Firebase are **opt-in** features you'd have to switch on deliberately (Firestore TTL
policies, or Cloud Storage lifecycle rules) — Tend uses neither. (The 7/30-day expiry
you may have heard about applies to *other* services' free tiers — e.g. some Postgres
hosts pause idle projects — not to Firestore.)

Extra layers for peace of mind:

1. **In-app backup** — Settings → *Download full backup* gives you every record as JSON,
   whenever you like.
2. **Offline cache** — Firestore's persistent cache keeps your data on-device and
   syncs when you're back online.
3. **Auth sessions persist** — you stay signed in on each device until you sign out;
   there is no 30-day forced logout.
4. (Optional, Blaze plan) Firestore **scheduled managed backups**:
   search "Back up and restore data" in the Firestore console — daily/weekly snapshots
   with configurable retention.
