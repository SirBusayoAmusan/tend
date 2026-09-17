import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AppProviders } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tend — your life OS',
  description: 'Tend every part of your life, one day at a time.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
