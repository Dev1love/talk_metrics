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
    <div className="group bg-white rounded-xl border border-secondary-200/50 p-5 hover:shadow-strong hover:border-primary-200 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center">
        <div className={`p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-200 ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-semibold text-secondary-600 mb-1">{title}</p>
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-secondary-900">{value}</p>
            {unit && <span className="ml-2 text-base text-secondary-500 font-medium">{unit}</span>}
          </div>
          {change !== undefined && (
            <div className="flex items-center mt-2 px-2 py-1 rounded-full bg-secondary-50/50">
              <TrendingUp className={`h-3 w-3 mr-1 transition-transform duration-200 ${
                change >= 0 ? 'text-success-600' : 'text-error-600 rotate-180'
              }`} />
              <span className={`text-xs font-semibold ${
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
    <div className="bg-white rounded-2xl border border-secondary-200/50 p-8 shadow-soft hover:shadow-medium transition-all duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-secondary-900 mb-1">
            Основные метрики
          </h3>
          <p className="text-secondary-600">Анализ эффективности коммуникации</p>
        </div>
        <div className="flex items-center bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl px-4 py-2 border border-primary-100">
          <div className="text-sm text-secondary-600">Всего диалогов:</div>
          <div className="ml-2 text-lg font-bold text-primary-600">{metrics.total_conversations}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
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
      <div className="border-t border-gradient-to-r from-secondary-200 via-primary-200 to-secondary-200 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center group">
            <div className="text-3xl font-bold text-secondary-900 mb-1 group-hover:text-primary-600 transition-colors">
              {metrics.total_conversations}
            </div>
            <div className="text-sm font-medium text-secondary-600">Всего диалогов</div>
          </div>
          <div className="text-center group">
            <div className="text-3xl font-bold text-success-600 mb-1 group-hover:scale-105 transition-transform">
              {metrics.completed_conversations}
            </div>
            <div className="text-sm font-medium text-secondary-600">Завершено</div>
          </div>
          <div className="text-center group">
            <div className="text-3xl font-bold text-warning-600 mb-1 group-hover:scale-105 transition-transform">
              {Math.round(metrics.upsell_rate)}%
            </div>
            <div className="text-sm font-medium text-secondary-600">Допродажи</div>
          </div>
          <div className="text-center group">
            <div className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-1 group-hover:scale-105 transition-transform">
              {globalMetrics.cci_score}
            </div>
            <div className="text-sm font-medium text-secondary-600">CCI Score</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetricsOverview