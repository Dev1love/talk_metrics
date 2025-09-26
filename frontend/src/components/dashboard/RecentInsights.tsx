import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  ExternalLink
} from 'lucide-react'

import { RootState } from '../../store'
import { markInsightAsAddressed } from '../../store/slices/insightsSlice'
import LoadingSpinner from '../common/LoadingSpinner'

const RecentInsights: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { insights, isLoading } = useSelector((state: RootState) => state.insights)

  // Get only unaddressed insights for dashboard
  const recentInsights = insights.filter(insight => !insight.is_addressed).slice(0, 5)

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-error-600" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-error-500" />
      case 'medium':
        return <Clock className="h-4 w-4 text-warning-500" />
      case 'low':
        return <TrendingUp className="h-4 w-4 text-primary-500" />
      default:
        return <Lightbulb className="h-4 w-4 text-secondary-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-error-600 bg-error-50'
      case 'high':
        return 'border-l-error-500 bg-error-50'
      case 'medium':
        return 'border-l-warning-500 bg-warning-50'
      case 'low':
        return 'border-l-primary-500 bg-primary-50'
      default:
        return 'border-l-secondary-400 bg-secondary-50'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'response_time':
        return 'Время ответа'
      case 'politeness':
        return 'Вежливость'
      case 'conversion':
        return 'Конверсия'
      case 'sentiment':
        return 'Тональность'
      case 'completion':
        return 'Завершенность'
      default:
        return category
    }
  }

  const handleMarkAsAddressed = async (insightId: string) => {
    await dispatch(markInsightAsAddressed(insightId))
  }

  const handleViewProof = (insight: any) => {
    if (insight.proof_conversation_id) {
      navigate(`/conversations/${insight.proof_conversation_id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <LoadingSpinner size="lg" text="Загружаем инсайты..." />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-secondary-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Lightbulb className="h-6 w-6 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold text-secondary-900">
            Последние инсайты
          </h3>
        </div>
        <button
          onClick={() => navigate('/insights')}
          className="flex items-center text-sm text-primary-600 hover:text-primary-700"
        >
          Все инсайты
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      {recentInsights.length === 0 ? (
        <div className="text-center py-8">
          <Lightbulb className="h-12 w-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">Нет новых инсайтов</p>
          <p className="text-sm text-secondary-400 mt-1">
            Инсайты появятся после обработки диалогов
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentInsights.map((insight) => (
            <div
              key={insight.id}
              className={`insight-card ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {getPriorityIcon(insight.priority)}
                    <span className="ml-2 text-xs font-medium text-secondary-600 uppercase tracking-wider">
                      {getCategoryLabel(insight.category)}
                    </span>
                    <span className="ml-2 text-xs text-secondary-500">
                      {new Date(insight.generated_at).toLocaleDateString('ru')}
                    </span>
                  </div>

                  <h4 className="font-medium text-secondary-900 mb-2">
                    {insight.title}
                  </h4>

                  <p className="text-sm text-secondary-600 mb-3">
                    {insight.description}
                  </p>

                  <div className="bg-primary-50 border border-primary-200 rounded-md p-3 mb-3">
                    <p className="text-sm text-primary-700">
                      <span className="font-medium">Рекомендация:</span> {insight.recommendation}
                    </p>
                  </div>

                  {insight.metric_impact > 0 && (
                    <div className="flex items-center text-xs text-success-600 mb-3">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Потенциальное улучшение: +{insight.metric_impact}%
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleMarkAsAddressed(insight.id)}
                      className="flex items-center text-sm text-success-600 hover:text-success-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Выполнено
                    </button>

                    {insight.proof_conversation_id && (
                      <button
                        onClick={() => handleViewProof(insight)}
                        className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Посмотреть диалог
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* View all button */}
          <div className="pt-4 border-t border-secondary-200">
            <button
              onClick={() => navigate('/insights')}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700 py-2"
            >
              Посмотреть все инсайты ({insights.length})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecentInsights