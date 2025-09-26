import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Lightbulb,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle,
  ExternalLink,
  Filter,
  Search,
  ArrowUpDown,
  Eye,
  Archive
} from 'lucide-react'

import { RootState } from '../../store'
import { fetchInsights, markInsightAsAddressed } from '../../store/slices/insightsSlice'
import LoadingSpinner from '../common/LoadingSpinner'

interface InsightsTableProps {
  limit?: number
  showFilters?: boolean
  showPagination?: boolean
}

const InsightsTable: React.FC<InsightsTableProps> = ({
  limit,
  showFilters = true,
  showPagination = true
}) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { insights, isLoading, totalCount } = useSelector((state: RootState) => state.insights)

  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    isAddressed: '',
    search: ''
  })
  const [sortBy, setSortBy] = useState<'generated_at' | 'priority' | 'metric_impact'>('generated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = limit || 10

  useEffect(() => {
    const queryParams = {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      sortBy,
      sortOrder,
      ...filters,
      isAddressed: filters.isAddressed === '' ? undefined : filters.isAddressed === 'true'
    }

    dispatch(fetchInsights(queryParams))
  }, [dispatch, filters, sortBy, sortOrder, currentPage, pageSize])

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
        return 'text-error-600 bg-error-50 border-error-200'
      case 'high':
        return 'text-error-500 bg-error-50 border-error-200'
      case 'medium':
        return 'text-warning-600 bg-warning-50 border-warning-200'
      case 'low':
        return 'text-primary-600 bg-primary-50 border-primary-200'
      default:
        return 'text-secondary-600 bg-secondary-50 border-secondary-200'
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'response_time': 'Время ответа',
      'politeness': 'Вежливость',
      'conversion': 'Конверсия',
      'sentiment': 'Тональность',
      'completion': 'Завершенность'
    }
    return labels[category] || category
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'critical': 'Критический',
      'high': 'Высокий',
      'medium': 'Средний',
      'low': 'Низкий'
    }
    return labels[priority] || priority
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
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

  const filteredInsights = limit ? insights.slice(0, limit) : insights

  if (isLoading && insights.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <LoadingSpinner size="lg" text="Загружаем инсайты..." />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-secondary-200">
      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-secondary-200">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <Search className="h-4 w-4 text-secondary-400 mr-2" />
              <input
                type="text"
                placeholder="Поиск по инсайтам..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="form-input text-sm w-64"
              />
            </div>

            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="form-select text-sm"
            >
              <option value="">Все категории</option>
              <option value="response_time">Время ответа</option>
              <option value="politeness">Вежливость</option>
              <option value="conversion">Конверсия</option>
              <option value="sentiment">Тональность</option>
              <option value="completion">Завершенность</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="form-select text-sm"
            >
              <option value="">Все приоритеты</option>
              <option value="critical">Критический</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>

            <select
              value={filters.isAddressed}
              onChange={(e) => setFilters(prev => ({ ...prev, isAddressed: e.target.value }))}
              className="form-select text-sm"
            >
              <option value="">Все статусы</option>
              <option value="false">Не выполнено</option>
              <option value="true">Выполнено</option>
            </select>

            <button
              onClick={() => setFilters({ category: '', priority: '', isAddressed: '', search: '' })}
              className="text-sm text-secondary-600 hover:text-secondary-800"
            >
              Сбросить
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('priority')}
                  className="flex items-center text-sm font-medium text-secondary-700 hover:text-secondary-900"
                >
                  Приоритет
                  <ArrowUpDown className="h-3 w-3 ml-1" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-secondary-700">
                Инсайт
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-secondary-700">
                Рекомендация
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('metric_impact')}
                  className="flex items-center text-sm font-medium text-secondary-700 hover:text-secondary-900"
                >
                  Влияние
                  <ArrowUpDown className="h-3 w-3 ml-1" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('generated_at')}
                  className="flex items-center text-sm font-medium text-secondary-700 hover:text-secondary-900"
                >
                  Дата
                  <ArrowUpDown className="h-3 w-3 ml-1" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-secondary-700">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200">
            {filteredInsights.map((insight) => (
              <tr key={insight.id} className={insight.is_addressed ? 'opacity-60' : ''}>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    {getPriorityIcon(insight.priority)}
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(insight.priority)}`}>
                      {getPriorityLabel(insight.priority)}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="max-w-md">
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-medium text-secondary-600 uppercase tracking-wider">
                        {getCategoryLabel(insight.category)}
                      </span>
                    </div>
                    <h4 className="font-medium text-secondary-900 mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-secondary-600 line-clamp-2">
                      {insight.description}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="max-w-sm">
                    <p className="text-sm text-secondary-700">
                      {insight.recommendation}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-4">
                  {insight.metric_impact > 0 && (
                    <div className="flex items-center text-sm text-success-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +{insight.metric_impact}%
                    </div>
                  )}
                </td>

                <td className="px-4 py-4 text-sm text-secondary-600">
                  {new Date(insight.generated_at).toLocaleDateString('ru', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    {!insight.is_addressed && (
                      <button
                        onClick={() => handleMarkAsAddressed(insight.id)}
                        className="flex items-center text-xs text-success-600 hover:text-success-700 px-2 py-1 rounded"
                        title="Отметить как выполнено"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Выполнено
                      </button>
                    )}

                    {insight.is_addressed && (
                      <span className="flex items-center text-xs text-success-600 px-2 py-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Выполнено
                      </span>
                    )}

                    {insight.proof_conversation_id && (
                      <button
                        onClick={() => handleViewProof(insight)}
                        className="flex items-center text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded"
                        title="Посмотреть диалог"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Диалог
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filteredInsights.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Lightbulb className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Нет инсайтов
          </h3>
          <p className="text-secondary-500">
            Инсайты появятся после обработки диалогов
          </p>
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalCount > pageSize && (
        <div className="px-4 py-3 border-t border-secondary-200 flex items-center justify-between">
          <div className="text-sm text-secondary-700">
            Показано {Math.min(filteredInsights.length, pageSize)} из {totalCount} инсайтов
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-secondary-300 rounded hover:bg-secondary-50 disabled:opacity-50"
            >
              Назад
            </button>
            <span className="text-sm text-secondary-600">
              Страница {currentPage} из {Math.ceil(totalCount / pageSize)}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              className="px-3 py-1 text-sm border border-secondary-300 rounded hover:bg-secondary-50 disabled:opacity-50"
            >
              Вперёд
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && insights.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <LoadingSpinner size="md" text="Обновляем..." />
        </div>
      )}
    </div>
  )
}

export default InsightsTable