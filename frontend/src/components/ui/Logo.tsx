'use client'

import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
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
      {/* Logo Image - Always use dark version, smaller */}
      <div className={`relative ${sizeClasses[size]} rounded-md overflow-hidden flex-shrink-0`}>
        <Image
          src="/logo-dark.png"
          alt="SynapseAI Logo"
          fill
          className="object-cover object-center"
          style={{
            // Crop to focus on the "S" symbol
            objectPosition: 'center top',
            transform: 'scale(1.1) translateY(-5%)'
          }}
          priority
        />
      </div>

      {/* Brand Text - Bigger, no subtitle */}
      {showText && (
        <div>
          <h1 className={`font-bold ${textSizes[size]} text-neutral-900 dark:text-white leading-none`}>
            SynapseAI
          </h1>
        </div>
      )}
    </div>
  )
}