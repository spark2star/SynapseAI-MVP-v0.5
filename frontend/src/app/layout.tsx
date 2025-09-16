import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Intelligent EMR System',
    description: 'Next-generation Electronic Medical Records with AI-powered transcription and reporting',
    keywords: 'EMR, Electronic Medical Records, Healthcare, AI, Transcription, Medical Reports',
    authors: [{ name: 'EMR System Team' }],
    viewport: 'width=device-width, initial-scale=1',
    robots: 'noindex, nofollow', // Prevent indexing for medical data
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="h-full">
            <head>
                <meta name="theme-color" content="#0ea5e9" />
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/manifest.json" />
            </head>
            <body className={`${inter.className} h-full bg-neutral-50 antialiased`}>
                <div id="root" className="h-full">
                    {children}
                </div>

                {/* Toast notifications */}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#ffffff',
                            color: '#374151',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#ffffff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#ffffff',
                            },
                        },
                    }}
                />

                {/* Accessibility announcements */}
                <div
                    id="announcements"
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                />
            </body>
        </html>
    )
}
