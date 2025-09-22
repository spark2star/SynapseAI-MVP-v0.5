'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
// import { type ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: any) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"  // Default to dark theme for medical environment
      enableSystem
      disableTransitionOnChange={false}
      storageKey="synapseai-theme"
      themes={['light', 'dark', 'system']}
      forcedTheme={undefined}  // Allow user to override
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
