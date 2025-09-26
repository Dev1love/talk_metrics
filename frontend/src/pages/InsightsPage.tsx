import React from 'react'
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

import InsightsTable from '../components/insights/InsightsTable'

const InsightsPage: React.FC = () => {
  // Mock stats - in real app would come from Redux store
  const stats = {
    total: 24,
    pending: 18,
    completed: 6,
    criticalPending: 3
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
          <Lightbulb className="h-6 w-6 text-primary-600 mr-2" />
          Инсайты и рекомендации
        </h1>
        <p className="mt-2 text-secondary-600">
          AI-анализ диалогов с рекомендациями по улучшению качества обслуживания
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Всего инсайтов</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-warning-100 text-warning-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">К выполнению</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-success-100 text-success-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Выполнено</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-error-100 text-error-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary-600">Критические</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.criticalPending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights table */}
      <InsightsTable
        showFilters={true}
        showPagination={true}
      />

      {/* Help section */}
      <div className="bg-primary-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-primary-900 mb-3">
          Как работают инсайты?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-primary-800 mb-2">Автоматический анализ</h4>
            <p className="text-sm text-primary-700">
              AI анализирует все диалоги и выявляет паттерны, которые влияют на качество обслуживания и конверсию.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-primary-800 mb-2">Приоритизация</h4>
            <p className="text-sm text-primary-700">
              Инсайты ранжируются по приоритету в зависимости от потенциального влияния на метрики.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-primary-800 mb-2">Доказательная база</h4>
            <p className="text-sm text-primary-700">
              Каждый инсайт подкреплён ссылками на конкретные диалоги, где была выявлена проблема.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-primary-800 mb-2">Отслеживание прогресса</h4>
            <p className="text-sm text-primary-700">
              Отмечайте инсайты как выполненные и отслеживайте улучшение метрик в реальном времени.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InsightsPage