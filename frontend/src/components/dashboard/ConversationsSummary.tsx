import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Users,
  Calendar
} from 'lucide-react'

import { RootState } from '../../store'
import LoadingSpinner from '../common/LoadingSpinner'

const ConversationsSummary: React.FC = () => {
  const navigate = useNavigate()
  const { globalMetrics, isLoading } = useSelector((state: RootState) => state.metrics)

  if (isLoading || !globalMetrics) {
    return (
      <div className="bg-white rounded-lg border border-secondary-200 p-6">
        <LoadingSpinner size="lg" text="Загружаем статистику диалогов..." />
      </div>
    )
  }

  const { metrics } = globalMetrics

  // Mock recent conversations data - in real app would come from API
  const recentConversations = [
    {
      id: '1',
      customer_name: 'Анна Иванова',
      status: 'completed',
      last_message: 'Спасибо, всё понятно!',
      last_activity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      messages_count: 12,
      response_time: 5.2
    },
    {
      id: '2',
      customer_name: 'Михаил Петров',
      status: 'active',
      last_message: 'А когда будет доставка?',
      last_activity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      messages_count: 8,
      response_time: 12.5
    },
    {
      id: '3',
      customer_name: 'Елена Сидорова',
      status: 'pending',
      last_message: 'Здравствуйте, меня интересует...',
      last_activity: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      messages_count: 3,
      response_time: null
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'active':
        return <MessageCircle className="h-4 w-4 text-primary-600" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-warning-600" />
      default:
        return <Clock className="h-4 w-4 text-secondary-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success-600 bg-success-50'
      case 'active':
        return 'text-primary-600 bg-primary-50'
      case 'pending':
        return 'text-warning-600 bg-warning-50'
      default:
        return 'text-secondary-600 bg-secondary-50'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершён'
      case 'active':
        return 'Активный'
      case 'pending':
        return 'Ожидает'
      default:
        return 'Неизвестно'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return 'только что'
    if (minutes < 60) return `${minutes} мин назад`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ч назад`
    const days = Math.floor(hours / 24)
    return `${days} д назад`
  }

  return (
    <div className="bg-white rounded-lg border border-secondary-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <MessageCircle className="h-6 w-6 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold text-secondary-900">
            Статистика диалогов
          </h3>
        </div>
        <button
          onClick={() => navigate('/conversations')}
          className="flex items-center text-sm text-primary-600 hover:text-primary-700"
        >
          Все диалоги
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-secondary-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Users className="h-4 w-4 text-secondary-600 mr-2" />
            <span className="text-sm font-medium text-secondary-700">Всего диалогов</span>
          </div>
          <div className="text-2xl font-bold text-secondary-900">
            {metrics.total_conversations}
          </div>
          <div className="flex items-center mt-1">
            <TrendingUp className="h-3 w-3 text-success-600 mr-1" />
            <span className="text-xs text-success-600">+8% за неделю</span>
          </div>
        </div>

        <div className="bg-success-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-4 w-4 text-success-600 mr-2" />
            <span className="text-sm font-medium text-success-700">Завершённых</span>
          </div>
          <div className="text-2xl font-bold text-secondary-900">
            {metrics.completed_conversations}
          </div>
          <div className="text-xs text-secondary-500 mt-1">
            {Math.round((metrics.completed_conversations / metrics.total_conversations) * 100)}% от общего числа
          </div>
        </div>
      </div>

      {/* Recent conversations */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-secondary-700 mb-3">
          Последние диалоги
        </h4>

        {recentConversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => navigate(`/conversations/${conversation.id}`)}
            className="p-3 border border-secondary-200 rounded-lg hover:shadow-sm transition-shadow duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-2">
                  {getStatusIcon(conversation.status)}
                  <span className="ml-2 font-medium text-secondary-900 truncate">
                    {conversation.customer_name}
                  </span>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conversation.status)}`}>
                    {getStatusLabel(conversation.status)}
                  </span>
                </div>

                <p className="text-sm text-secondary-600 mb-2 truncate">
                  {conversation.last_message}
                </p>

                <div className="flex items-center text-xs text-secondary-500 space-x-4">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatTimeAgo(conversation.last_activity)}
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {conversation.messages_count} сообщений
                  </div>
                  {conversation.response_time && (
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {conversation.response_time} мин
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* View all button */}
        <div className="pt-3 border-t border-secondary-200">
          <button
            onClick={() => navigate('/conversations')}
            className="w-full text-center text-sm text-primary-600 hover:text-primary-700 py-2"
          >
            Посмотреть все диалоги
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConversationsSummary