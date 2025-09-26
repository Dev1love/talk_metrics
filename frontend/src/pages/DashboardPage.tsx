import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { RootState } from '../store'
import { fetchGlobalMetrics } from '../store/slices/metricsSlice'
import { fetchInsights } from '../store/slices/insightsSlice'

// Components
import LoadingSpinner from '../components/common/LoadingSpinner'
import MetricsOverview from '../components/dashboard/MetricsOverview'
import CCICard from '../components/dashboard/CCICard'
import RecentInsights from '../components/dashboard/RecentInsights'
import ConversationsSummary from '../components/dashboard/ConversationsSummary'
import QuickActions from '../components/dashboard/QuickActions'

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch()
  const { globalMetrics, isLoading } = useSelector((state: RootState) => state.metrics)
  const { insights } = useSelector((state: RootState) => state.insights)

  useEffect(() => {
    // Fetch initial data
    dispatch(fetchGlobalMetrics())
    dispatch(fetchInsights({ limit: 5, isAddressed: false }))
  }, [dispatch])

  if (isLoading && !globalMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Загружаем данные..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">
          Добро пожаловать в TalkMetrics
        </h1>
        <p className="mt-2 text-secondary-600">
          Анализ качества коммуникации и метрики эффективности вашей команды
        </p>
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Main metrics grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CCI Score - takes full width on mobile, left column on desktop */}
        <div className="lg:col-span-1">
          <CCICard />
        </div>

        {/* Metrics overview - spans 2 columns on desktop */}
        <div className="lg:col-span-2">
          <MetricsOverview />
        </div>
      </div>

      {/* Secondary content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Conversations summary */}
        <ConversationsSummary />

        {/* Recent insights */}
        <RecentInsights />
      </div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-secondary-100 rounded-lg">
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Debug Info
          </h3>
          <div className="text-sm text-secondary-700 space-y-1">
            <p>Global metrics loaded: {globalMetrics ? 'Yes' : 'No'}</p>
            <p>Insights count: {insights.length}</p>
            <p>Loading state: {isLoading ? 'Loading' : 'Ready'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage