'use client'

import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

// Updated size classes to better match text proportions
const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
}

const textSizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl'
}

export default function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Image - Always use Logo.png */}
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        <Image
          src="/logo.png"
          alt="SynapseAI Logo"
          fill
          sizes="(max-width: 768px) 32px, 32px"
          className="object-contain transition-all duration-300"
          priority
        />
      </div>

      {/* Brand Text - Sized to match logo */}
      {showText && (
        <div>
          <h1 className={`font-bold ${textSizes[size]} text-neutral-900 dark:text-white leading-none transition-colors duration-300`}>
            Synapse<span className="text-sky-500 dark:text-sky-400">AI</span>
          </h1>
        </div>
      )}
    </div>
  )
}