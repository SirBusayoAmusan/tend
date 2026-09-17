'use client'

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import {
  getFirestore, initializeFirestore, persistentLocalCache,
  persistentMultipleTabManager, type Firestore,
} from 'firebase/firestore'

let _app: FirebaseApp | undefined
let _auth: Auth | undefined
let _db: Firestore | undefined

/** Returns false if the config is still the placeholder. */
export function isPlaceholderConfig(cfg: Record<string, string>): boolean {
  return !cfg?.apiKey || cfg.apiKey.startsWith('YOUR_')
}

export function initFirebase(cfg: Record<string, string>): boolean {
  try {
    _app = getApps().length ? getApp() : initializeApp(cfg)
    try {
      _db = initializeFirestore(_app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      })
    } catch {
      _db = getFirestore(_app) // already initialized (HMR)
    }
    _auth = getAuth(_app)
    return true
  } catch (e) {
    console.error('Firebase init failed', e)
    return false
  }
}

export function fb(): { auth: Auth; db: Firestore } {
  if (!_auth || !_db) throw new Error('Firebase not initialised yet')
  return { auth: _auth, db: _db }
}
