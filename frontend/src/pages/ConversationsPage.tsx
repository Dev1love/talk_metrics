import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  ArrowUpDown,
  Eye,
  Users,
  Calendar
} from 'lucide-react'

import LoadingSpinner from '../components/common/LoadingSpinner'

const ConversationsPage: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    search: ''
  })

  // Mock data - in real app would come from Redux store
  const conversations = [
    {
      id: '1',
      customer_name: 'Анна Иванова',
      status: 'completed',
      last_message: 'Спасибо, всё понятно!',
      last_activity: new Date(Date.now() - 2 * 60 * 1000),
      messages_count: 12,
      response_time: 5.2,
      booking_made: true,
      payment_made: true
    },
    {
      id: '2',
      customer_name: 'Михаил Петров',
      status: 'active',
      last_message: 'А когда будет доставка?',
      last_activity: new Date(Date.now() - 15 * 60 * 1000),
      messages_count: 8,
      response_time: 12.5,
      booking_made: true,
      payment_made: false
    },
    {
      id: '3',
      customer_name: 'Елена Сидорова',
      status: 'pending',
      last_message: 'Здравствуйте, меня интересует...',
      last_activity: new Date(Date.now() - 45 * 60 * 1000),
      messages_count: 3,
      response_time: null,
      booking_made: false,
      payment_made: false
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success-600 bg-success-50 border-success-200'
      case 'active':
        return 'text-primary-600 bg-primary-50 border-primary-200'
      case 'pending':
        return 'text-warning-600 bg-warning-50 border-warning-200'
      default:
        return 'text-secondary-600 bg-secondary-50 border-secondary-200'
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

  const handleViewConversation = (conversationId: string) => {
    navigate(`/conversations/${conversationId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Загружаем диалоги..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
          <MessageCircle className="h-6 w-6 text-primary-600 mr-2" />
          Диалоги
        </h1>
        <p className="mt-2 text-secondary-600">
          Просмотр и анализ всех диалогов с клиентами
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-primary-600 mr-2" />
            <div>
              <p className="text-sm text-secondary-600">Всего</p>
              <p className="text-xl font-bold text-secondary-900">156</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center">
            <MessageCircle className="h-5 w-5 text-primary-600 mr-2" />
            <div>
              <p className="text-sm text-secondary-600">Активные</p>
              <p className="text-xl font-bold text-secondary-900">23</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
            <div>
              <p className="text-sm text-secondary-600">Завершённые</p>
              <p className="text-xl font-bold text-secondary-900">124</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-warning-600 mr-2" />
            <div>
              <p className="text-sm text-secondary-600">Ожидают</p>
              <p className="text-xl font-bold text-secondary-900">9</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-secondary-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <Search className="h-4 w-4 text-secondary-400 mr-2" />
            <input
              type="text"
              placeholder="Поиск по имени или сообщению..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="form-input text-sm w-64"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="form-select text-sm"
          >
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="completed">Завершённые</option>
            <option value="pending">Ожидающие</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="form-select text-sm"
          >
            <option value="">Все периоды</option>
            <option value="today">Сегодня</option>
            <option value="week">Эта неделя</option>
            <option value="month">Этот месяц</option>
          </select>

          <button
            onClick={() => setFilters({ status: '', dateRange: '', search: '' })}
            className="text-sm text-secondary-600 hover:text-secondary-800"
          >
            Сбросить
          </button>
        </div>
      </div>

      {/* Conversations table */}
      <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-secondary-700">
                  Клиент
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-secondary-700">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-secondary-700">
                  Последнее сообщение
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-secondary-700">
                  Активность
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-secondary-700">
                  Метрики
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-secondary-700">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200">
              {conversations.map((conversation) => (
                <tr key={conversation.id} className="hover:bg-secondary-50">
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-secondary-900">
                        {conversation.customer_name}
                      </div>
                      <div className="text-sm text-secondary-500">
                        ID: {conversation.id}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(conversation.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conversation.status)}`}>
                        {getStatusLabel(conversation.status)}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-secondary-900 truncate">
                        {conversation.last_message}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-sm text-secondary-600">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatTimeAgo(conversation.last_activity)}
                      </div>
                      <div className="flex items-center mt-1">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {conversation.messages_count} сообщений
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-secondary-400" />
                        {conversation.response_time ? `${conversation.response_time} мин` : '—'}
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-1 rounded ${conversation.booking_made ? 'bg-success-100 text-success-600' : 'bg-secondary-100 text-secondary-600'}`}>
                          Бронь
                        </span>
                        <span className={`px-1 rounded ${conversation.payment_made ? 'bg-success-100 text-success-600' : 'bg-secondary-100 text-secondary-600'}`}>
                          Оплата
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleViewConversation(conversation.id)}
                      className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Открыть
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-secondary-200 flex items-center justify-between">
          <div className="text-sm text-secondary-700">
            Показано 10 из 156 диалогов
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm border border-secondary-300 rounded hover:bg-secondary-50">
              Назад
            </button>
            <span className="text-sm text-secondary-600">Страница 1 из 16</span>
            <button className="px-3 py-1 text-sm border border-secondary-300 rounded hover:bg-secondary-50">
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationsPage