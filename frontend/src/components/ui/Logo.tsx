'use client'

import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10', 
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
}

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl', 
  xl: 'text-3xl'
}

export default function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image - Always use dark version */}
      <div className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden flex-shrink-0`}>
        <Image
          src="/logo-dark.png"
          alt="SynapseAI Logo"
          fill
          className="object-cover object-center"
          style={{
            // Crop to focus on the "S" symbol
            objectPosition: 'center top',
            transform: 'scale(1.2) translateY(-10%)'
          }}
          priority
        />
      </div>
      
      {/* Brand Text - Bigger and no subtitle */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`font-bold ${textSizes[size]} text-neutral-900 dark:text-white leading-tight`}>
            SynapseAI
          </h1>
        </div>
      )}
    </div>
  )
}
