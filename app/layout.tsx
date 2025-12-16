import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Web3Provider } from '@/components/providers/web3-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'WhichWitch - Web3 Creation Platform',
  description: 'Create, share, and monetize your creative works on blockchain',
  generator: 'v0.app',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased" suppressHydrationWarning={true}>
        <Web3Provider>
          {children}
        </Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}
