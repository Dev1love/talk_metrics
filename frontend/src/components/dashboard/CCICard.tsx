import React from 'react'
import { useSelector } from 'react-redux'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

import { RootState } from '../../store'
import LoadingSpinner from '../common/LoadingSpinner'

const CCICard: React.FC = () => {
  const { globalMetrics, isLoading } = useSelector((state: RootState) => state.metrics)

  if (isLoading || !globalMetrics) {
    return (
      <div className="metric-card h-64">
        <LoadingSpinner size="lg" text="Загружаем CCI..." />
      </div>
    )
  }

  const { cci_score, interpretation, components } = globalMetrics

  // Determine trend (mock data for now - in real app would compare with previous period)
  const mockPreviousCCI = cci_score - 5
  const trend = cci_score > mockPreviousCCI ? 'up' : 'down'
  const trendValue = Math.abs(cci_score - mockPreviousCCI)

  // Get color based on CCI score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-600'
    if (score >= 75) return 'text-success-500'
    if (score >= 60) return 'text-warning-500'
    if (score >= 40) return 'text-error-500'
    return 'text-error-600'
  }

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-success-600'
    if (score >= 75) return 'bg-success-500'
    if (score >= 60) return 'bg-warning-500'
    if (score >= 40) return 'bg-error-500'
    return 'bg-error-600'
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-secondary-200/50 dark:border-gray-700/50 p-8 shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-success-500/10 to-warning-500/10 rounded-full blur-2xl"></div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-3 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl shadow-lg">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3">
            <h3 className="text-xl font-bold text-secondary-900 dark:text-gray-100">
              Индекс качества
            </h3>
            <p className="text-sm text-secondary-600 dark:text-gray-400">Communication Quality Index</p>
          </div>
        </div>
        <div className="flex items-center bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-secondary-200/50 dark:border-gray-600/50">
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-success-600 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-error-600 mr-1" />
          )}
          <span className={`text-sm font-semibold ${trend === 'up' ? 'text-success-600' : 'text-error-600'}`}>
            {trendValue}
          </span>
        </div>
      </div>

      {/* Score display */}
      <div className="relative text-center mb-8">
        <div className="relative inline-block">
          {/* Score circle background */}
          <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 144 144">
            <circle
              cx="72"
              cy="72"
              r="64"
              stroke="rgb(226, 232, 240)"
              strokeWidth="8"
              fill="transparent"
              className="drop-shadow-sm"
            />
            <circle
              cx="72"
              cy="72"
              r="64"
              stroke={`url(#gradient-${cci_score})`}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 64}`}
              strokeDashoffset={`${2 * Math.PI * 64 * (1 - cci_score / 100)}`}
              className="transition-all duration-2000 ease-out drop-shadow-sm"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id={`gradient-${cci_score}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: getProgressColor(cci_score).replace('bg-', '#') }} />
                <stop offset="100%" style={{ stopColor: getProgressColor(cci_score).replace('bg-', '#') }} />
              </linearGradient>
            </defs>
          </svg>

          {/* Score text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(cci_score)} mb-1`}>
                {cci_score}
              </div>
              <div className="text-secondary-500 dark:text-gray-400 text-sm font-medium">из 100</div>
            </div>
          </div>
        </div>

        {/* Level and description */}
        <div className="mt-6 text-center">
          <div
            className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-3 shadow-sm"
            style={{
              backgroundColor: `${interpretation.color}20`,
              color: interpretation.color,
              border: `1px solid ${interpretation.color}30`
            }}
          >
            {interpretation.level}
          </div>
          <p className="text-base text-secondary-600 dark:text-gray-300 max-w-xs mx-auto leading-relaxed">
            {interpretation.description}
          </p>
        </div>
      </div>

      {/* Component breakdown */}
      <div className="relative space-y-4">
        <h4 className="text-base font-semibold text-secondary-700 dark:text-gray-300 mb-4 flex items-center">
          <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-purple-500 rounded-full mr-3"></div>
          Компоненты оценки
        </h4>

        {[
          { key: 'response_time_score', label: 'Время ответа', weight: 25, icon: '⚡' },
          { key: 'politeness_score', label: 'Вежливость', weight: 20, icon: '😊' },
          { key: 'completion_rate_score', label: 'Завершенность', weight: 20, icon: '✅' },
          { key: 'conversion_rate_score', label: 'Конверсия', weight: 15, icon: '💰' },
          { key: 'problem_resolution_score', label: 'Решение проблем', weight: 20, icon: '🔧' }
        ].map(({ key, label, weight, icon }) => {
          const score = components[key as keyof typeof components]
          return (
            <div key={key} className="group bg-gradient-to-r from-white to-secondary-50/50 dark:from-gray-800 dark:to-gray-700/50 rounded-xl p-4 border border-secondary-100 dark:border-gray-600 hover:border-primary-200 dark:hover:border-primary-400 transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{icon}</span>
                  <div>
                    <span className="text-sm font-semibold text-secondary-700 dark:text-gray-300">{label}</span>
                    <span className="text-xs text-secondary-500 dark:text-gray-400 ml-2">({weight}%)</span>
                  </div>
                </div>
                <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                  score >= 80 ? 'text-success-700 bg-success-100' :
                  score >= 60 ? 'text-warning-700 bg-warning-100' : 'text-error-700 bg-error-100'
                }`}>
                  {score}
                </span>
              </div>
              <div className="w-full bg-secondary-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                    score >= 80 ? 'bg-gradient-to-r from-success-400 to-success-600' :
                    score >= 60 ? 'bg-gradient-to-r from-warning-400 to-warning-600' :
                    'bg-gradient-to-r from-error-400 to-error-600'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Recommendations */}
      {interpretation.recommendations && interpretation.recommendations.length > 0 && (
        <div className="relative mt-6 pt-6 border-t border-gradient-to-r from-secondary-200 via-primary-200 to-secondary-200">
          <h4 className="text-base font-semibold text-secondary-700 dark:text-gray-300 mb-4 flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-warning-500 to-error-500 rounded-full mr-3"></div>
            Рекомендации
          </h4>
          <div className="space-y-3">
            {interpretation.recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="flex items-start p-3 bg-gradient-to-r from-primary-50/50 to-purple-50/50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl border border-primary-100/50 dark:border-primary-700/50">
                <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-sm text-secondary-700 dark:text-gray-300 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CCICard