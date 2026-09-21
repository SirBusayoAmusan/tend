'use client'

import { useEffect } from 'react'

/** Registers the pass-through service worker so phones can install Tend
    as a home-screen app (full standalone window + real icon). */
export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}
