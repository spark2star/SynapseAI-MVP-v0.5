'use client'

import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12', 
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
}

export default function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder during hydration
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="w-full h-full bg-blue-500 rounded-lg animate-pulse" />
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'
  const logoSrc = isDark ? '/logo-dark.png' : '/logo-light.png'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image - Cropped to show just the "S" */}
      <div className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden`}>
        <Image
          src={logoSrc}
          alt="SynapseAI Logo"
          fill
          className="object-cover object-center"
          style={{
            // Crop to focus on the "S" symbol (adjust these values based on actual logo)
            objectPosition: 'center top',
            transform: 'scale(1.2) translateY(-10%)'
          }}
          priority
        />
      </div>
      
      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">
            SynapseAI
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-tight">
            Mental Health AI
          </p>
        </div>
      )}
    </div>
  )
}
