import React from 'react'
import { useSelector } from 'react-redux'
import {
  Clock,
  MessageCircle,
  CheckCircle,
  ShoppingCart,
  TrendingUp,
  Heart
} from 'lucide-react'

import { RootState } from '../../store'
import LoadingSpinner from '../common/LoadingSpinner'

interface MetricCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  unit?: string
  change?: number
  changeLabel?: string
  color?: string
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  unit,
  change,
  changeLabel,
  color = 'primary'
}) => {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    error: 'bg-error-100 text-error-600'
  }

  return (
    <div className="bg-white rounded-lg border border-secondary-200 p-4 hover:shadow-medium transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-secondary-900">{value}</p>
            {unit && <span className="ml-1 text-sm text-secondary-500">{unit}</span>}
          </div>
          {change !== undefined && (
            <div className="flex items-center mt-1">
              <TrendingUp className={`h-3 w-3 mr-1 ${
                change >= 0 ? 'text-success-600' : 'text-error-600 rotate-180'
              }`} />
              <span className={`text-xs ${
                change >= 0 ? 'text-success-600' : 'text-error-600'
              }`}>
                {Math.abs(change)}% {changeLabel || 'к прошлому периоду'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const MetricsOverview: React.FC = () => {
  const { globalMetrics, isLoading } = useSelector((state: RootState) => state.metrics)

  if (isLoading || !globalMetrics) {
    return (
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <LoadingSpinner size="lg" text="Загружаем метрики..." />
      </div>
    )
  }

  const { metrics } = globalMetrics

  // Format time values
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} мин`
    }
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`
  }

  const metricsData = [
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Время первого ответа',
      value: formatTime(metrics.avg_first_response_minutes),
      color: metrics.avg_first_response_minutes <= 15 ? 'success' :
             metrics.avg_first_response_minutes <= 30 ? 'warning' : 'error',
      change: -12 // Mock data
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: 'Среднее время ответа',
      value: formatTime(metrics.avg_response_time_minutes),
      color: metrics.avg_response_time_minutes <= 20 ? 'success' :
             metrics.avg_response_time_minutes <= 45 ? 'warning' : 'error',
      change: 5 // Mock data
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: 'Завершенные диалоги',
      value: Math.round(metrics.completion_rate),
      unit: '%',
      color: metrics.completion_rate >= 80 ? 'success' :
             metrics.completion_rate >= 60 ? 'warning' : 'error',
      change: 8 // Mock data
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      title: 'Конверсия в бронирование',
      value: Math.round(metrics.booking_conversion_rate),
      unit: '%',
      color: metrics.booking_conversion_rate >= 20 ? 'success' :
             metrics.booking_conversion_rate >= 10 ? 'warning' : 'error',
      change: 15 // Mock data
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      title: 'Конверсия в оплату',
      value: Math.round(metrics.payment_conversion_rate),
      unit: '%',
      color: metrics.payment_conversion_rate >= 15 ? 'success' :
             metrics.payment_conversion_rate >= 8 ? 'warning' : 'error',
      change: 3 // Mock data
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: 'Уровень вежливости',
      value: (metrics.avg_politeness_score * 100).toFixed(0),
      unit: '%',
      color: metrics.avg_politeness_score >= 0.8 ? 'success' :
             metrics.avg_politeness_score >= 0.6 ? 'warning' : 'error',
      change: -2 // Mock data
    }
  ]

  return (
    <div className="bg-white rounded-lg border border-secondary-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary-900">
          Основные метрики
        </h3>
        <div className="text-sm text-secondary-500">
          Всего диалогов: {metrics.total_conversations}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricsData.map((metric, index) => (
          <MetricCard
            key={index}
            icon={metric.icon}
            title={metric.title}
            value={metric.value}
            unit={metric.unit}
            change={metric.change}
            color={metric.color}
          />
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-6 border-t border-secondary-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-900">
              {metrics.total_conversations}
            </div>
            <div className="text-sm text-secondary-600">Всего диалогов</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-900">
              {metrics.completed_conversations}
            </div>
            <div className="text-sm text-secondary-600">Завершено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-900">
              {Math.round(metrics.upsell_rate)}%
            </div>
            <div className="text-sm text-secondary-600">Допродажи</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {globalMetrics.cci_score}
            </div>
            <div className="text-sm text-secondary-600">CCI Score</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetricsOverview