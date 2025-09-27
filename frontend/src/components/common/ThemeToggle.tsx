import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-secondary-200/50 dark:border-gray-700/50 shadow-soft hover:shadow-medium transition-all duration-300 group"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-6 h-6">
        {/* Sun icon */}
        <Sun
          className={`absolute inset-0 w-6 h-6 text-amber-500 transition-all duration-300 transform ${
            theme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-45 scale-75'
          }`}
        />

        {/* Moon icon */}
        <Moon
          className={`absolute inset-0 w-6 h-6 text-indigo-500 transition-all duration-300 transform ${
            theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-45 scale-75'
          }`}
        />
      </div>

      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-300 ${
          theme === 'light'
            ? 'bg-amber-400/20 group-hover:bg-amber-400/30'
            : 'bg-indigo-400/20 group-hover:bg-indigo-400/30'
        } opacity-0 group-hover:opacity-100`}
      />
    </button>
  )
}

export default ThemeToggle