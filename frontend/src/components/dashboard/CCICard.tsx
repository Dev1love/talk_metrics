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
    <div className="metric-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Activity className="h-6 w-6 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold text-secondary-900">
            Индекс качества (CCI)
          </h3>
        </div>
        <div className="flex items-center text-sm">
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-success-600 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-error-600 mr-1" />
          )}
          <span className={trend === 'up' ? 'text-success-600' : 'text-error-600'}>
            {trendValue}
          </span>
        </div>
      </div>

      {/* Score display */}
      <div className="text-center mb-6">
        <div className={`text-5xl font-bold ${getScoreColor(cci_score)} mb-2`}>
          {cci_score}
        </div>
        <div className="text-secondary-500 text-sm mb-4">из 100</div>

        {/* Progress bar */}
        <div className="w-full bg-secondary-200 rounded-full h-3 mb-4">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ease-out ${getProgressColor(cci_score)}`}
            style={{ width: `${cci_score}%` }}
          />
        </div>

        {/* Level and description */}
        <div className="text-center">
          <div
            className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-2"
            style={{
              backgroundColor: `${interpretation.color}20`,
              color: interpretation.color
            }}
          >
            {interpretation.level}
          </div>
          <p className="text-sm text-secondary-600">
            {interpretation.description}
          </p>
        </div>
      </div>

      {/* Component breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-secondary-700 mb-3">
          Компоненты оценки
        </h4>

        {[
          { key: 'response_time_score', label: 'Время ответа', weight: 25 },
          { key: 'politeness_score', label: 'Вежливость', weight: 20 },
          { key: 'completion_rate_score', label: 'Завершенность', weight: 20 },
          { key: 'conversion_rate_score', label: 'Конверсия', weight: 15 },
          { key: 'problem_resolution_score', label: 'Решение проблем', weight: 20 }
        ].map(({ key, label, weight }) => {
          const score = components[key as keyof typeof components]
          return (
            <div key={key} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <span className="text-secondary-600">{label}</span>
                <span className="text-secondary-400 ml-1">({weight}%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-16 bg-secondary-200 rounded-full h-1.5 mr-2">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      score >= 80 ? 'bg-success-500' :
                      score >= 60 ? 'bg-warning-500' : 'bg-error-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className={`font-medium ${
                  score >= 80 ? 'text-success-600' :
                  score >= 60 ? 'text-warning-600' : 'text-error-600'
                }`}>
                  {score}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recommendations */}
      {interpretation.recommendations && interpretation.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-secondary-200">
          <h4 className="text-sm font-medium text-secondary-700 mb-2">
            Рекомендации
          </h4>
          <ul className="text-xs text-secondary-600 space-y-1">
            {interpretation.recommendations.slice(0, 2).map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-primary-500 mr-1">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default CCICard