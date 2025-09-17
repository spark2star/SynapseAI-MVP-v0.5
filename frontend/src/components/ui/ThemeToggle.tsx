'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
        <div className="h-5 w-5 bg-neutral-300 dark:bg-neutral-600 rounded animate-pulse" />
      </div>
    )
  }

  const themes = [
    { name: 'light', icon: SunIcon, label: 'Light' },
    { name: 'dark', icon: MoonIcon, label: 'Dark' },
    { name: 'system', icon: ComputerDesktopIcon, label: 'System' },
  ]

  return (
    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
      {themes.map((themeOption) => {
        const Icon = themeOption.icon
        const isActive = theme === themeOption.name
        
        return (
          <button
            key={themeOption.name}
            onClick={() => setTheme(themeOption.name)}
            className={`
              p-2 rounded-md transition-all duration-200 flex items-center justify-center
              ${isActive 
                ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-600 dark:text-blue-400' 
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }
            `}
            title={themeOption.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
