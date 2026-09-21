import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { AppProviders } from '@/components/Providers'
import PwaRegister from '@/components/Pwa'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tend — your life OS',
  description: 'Tend every part of your life, one day at a time.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Tend',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#fbfaf6',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
        <PwaRegister />
      </body>
    </html>
  )
}
