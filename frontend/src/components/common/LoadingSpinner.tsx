import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  overlay?: boolean
  text?: string
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  overlay = false,
  text,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex flex-col items-center">
          <Loader2 className={`${sizeClasses.lg} animate-spin text-primary-600`} />
          {text && (
            <p className={`mt-2 ${textSizeClasses.lg} text-secondary-700 font-medium`}>
              {text}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
      {text && (
        <span className={`ml-2 ${textSizeClasses[size]} text-secondary-700`}>
          {text}
        </span>
      )}
    </div>
  )
}

export default LoadingSpinner