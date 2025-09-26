import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Clock, User, Calendar, CheckCircle, X } from 'lucide-react'

const ConversationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Mock conversation data - in real app would come from Redux store
  const conversation = {
    id: id || '1',
    customer_name: 'Анна Иванова',
    status: 'completed',
    created_at: new Date('2024-01-15T10:30:00'),
    completed_at: new Date('2024-01-15T11:15:00'),
    messages_count: 12,
    response_time_avg: 5.2,
    booking_made: true,
    payment_made: true,
    messages: [
      {
        id: '1',
        sender: 'customer',
        text: 'Здравствуйте! Меня интересует бронирование номера на выходные.',
        timestamp: new Date('2024-01-15T10:30:00'),
        ai_analysis: {
          intention: 'booking_inquiry',
          politeness_score: 0.9
        }
      },
      {
        id: '2',
        sender: 'agent',
        text: 'Добро пожаловать! С удовольствием помогу с бронированием. На какие даты вас интересует номер?',
        timestamp: new Date('2024-01-15T10:32:00'),
        ai_analysis: {
          intention: 'information_request',
          politeness_score: 0.95
        }
      },
      {
        id: '3',
        sender: 'customer',
        text: 'На 20-22 января, двухместный номер.',
        timestamp: new Date('2024-01-15T10:35:00'),
        ai_analysis: {
          intention: 'booking_details',
          politeness_score: 0.7
        }
      },
      {
        id: '4',
        sender: 'agent',
        text: 'Отлично! У нас есть свободные двухместные номера на эти даты. Стоимость составляет 3500 рублей за ночь. Подойдет?',
        timestamp: new Date('2024-01-15T10:37:00'),
        ai_analysis: {
          intention: 'price_quote',
          politeness_score: 0.9
        }
      },
      {
        id: '5',
        sender: 'customer',
        text: 'Да, подходит. Как оформить бронь?',
        timestamp: new Date('2024-01-15T10:40:00'),
        ai_analysis: {
          intention: 'booking_confirmation',
          politeness_score: 0.8
        }
      },
      {
        id: '6',
        sender: 'agent',
        text: 'Для оформления брони мне потребуются ваши ФИО и номер телефона. Также нужна предоплата 30%.',
        timestamp: new Date('2024-01-15T10:42:00'),
        ai_analysis: {
          intention: 'booking_process',
          politeness_score: 0.85
        }
      }
    ]
  }

  const getIntentionLabel = (intention: string) => {
    const labels: Record<string, string> = {
      'booking_inquiry': 'Запрос на бронирование',
      'information_request': 'Запрос информации',
      'booking_details': 'Детали бронирования',
      'price_quote': 'Предложение цены',
      'booking_confirmation': 'Подтверждение брони',
      'booking_process': 'Процесс бронирования'
    }
    return labels[intention] || intention
  }

  const getPolitenessColor = (score: number) => {
    if (score >= 0.9) return 'text-success-600 bg-success-50'
    if (score >= 0.7) return 'text-success-500 bg-success-50'
    if (score >= 0.5) return 'text-warning-500 bg-warning-50'
    return 'text-error-500 bg-error-50'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/conversations')}
            className="mr-3 p-1 text-secondary-600 hover:text-secondary-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
              <MessageCircle className="h-6 w-6 text-primary-600 mr-2" />
              Диалог с {conversation.customer_name}
            </h1>
            <p className="text-secondary-600">ID: {conversation.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversation info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-secondary-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-secondary-900">Информация</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 text-secondary-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">{conversation.customer_name}</p>
                  <p className="text-xs text-secondary-500">Клиент</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-secondary-500 mr-2" />
                <div>
                  <p className="text-sm text-secondary-700">
                    {conversation.created_at.toLocaleDateString('ru')}
                  </p>
                  <p className="text-xs text-secondary-500">Дата создания</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-secondary-500 mr-2" />
                <div>
                  <p className="text-sm text-secondary-700">{conversation.response_time_avg} мин</p>
                  <p className="text-xs text-secondary-500">Среднее время ответа</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 text-secondary-500 mr-2" />
                <div>
                  <p className="text-sm text-secondary-700">{conversation.messages_count}</p>
                  <p className="text-xs text-secondary-500">Сообщений</p>
                </div>
              </div>
            </div>
            
            {/* Status badges */}
            <div className="pt-4 border-t border-secondary-200">
              <h4 className="text-sm font-medium text-secondary-700 mb-2">Результат</h4>
              <div className="space-y-2">
                <div className={`flex items-center px-2 py-1 rounded text-xs ${
                  conversation.booking_made ? 'bg-success-50 text-success-700' : 'bg-secondary-100 text-secondary-600'
                }`}>
                  {conversation.booking_made ? <CheckCircle className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                  Бронирование
                </div>
                <div className={`flex items-center px-2 py-1 rounded text-xs ${
                  conversation.payment_made ? 'bg-success-50 text-success-700' : 'bg-secondary-100 text-secondary-600'
                }`}>
                  {conversation.payment_made ? <CheckCircle className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                  Оплата
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-secondary-200">
            <div className="p-4 border-b border-secondary-200">
              <h3 className="text-lg font-semibold text-secondary-900">История сообщений</h3>
            </div>
            
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {conversation.messages.map((message) => (
                <div key={message.id} className={`flex ${
                  message.sender === 'customer' ? 'justify-start' : 'justify-end'
                }`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.sender === 'customer' 
                      ? 'bg-secondary-100 text-secondary-900'
                      : 'bg-primary-500 text-white'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                    <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                      <span>
                        {message.timestamp.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.ai_analysis && (
                        <div className="flex items-center space-x-2">
                          <span className={`px-1 rounded ${getPolitenessColor(message.ai_analysis.politeness_score)}`}>
                            {Math.round(message.ai_analysis.politeness_score * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {message.ai_analysis && (
                      <div className="mt-2 pt-2 border-t border-opacity-20 border-current">
                        <p className="text-xs opacity-75">
                          {getIntentionLabel(message.ai_analysis.intention)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationDetailsPage