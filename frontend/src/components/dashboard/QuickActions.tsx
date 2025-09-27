import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  FileText,
  Download,
  RefreshCw,
  Settings,
  Calendar,
  Filter,
  Search
} from 'lucide-react'

import DateRangePicker from '../common/DateRangePicker'

const QuickActions: React.FC = () => {
  const navigate = useNavigate()
  const [showDatePicker, setShowDatePicker] = useState(false)

  const quickActions = [
    {
      id: 'upload',
      label: 'Загрузить чаты',
      description: 'WhatsApp или Telegram',
      icon: <Upload className="h-5 w-5" />,
      color: 'bg-primary-500 hover:bg-primary-600',
      onClick: () => navigate('/upload')
    },
    {
      id: 'insights',
      label: 'Инсайты',
      description: 'Просмотр рекомендаций',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-success-500 hover:bg-success-600',
      onClick: () => navigate('/insights')
    },
    {
      id: 'export',
      label: 'Экспорт',
      description: 'PDF или CSV отчёт',
      icon: <Download className="h-5 w-5" />,
      color: 'bg-warning-500 hover:bg-warning-600',
      onClick: () => navigate('/export')
    },
    {
      id: 'refresh',
      label: 'Обновить',
      description: 'Пересчитать метрики',
      icon: <RefreshCw className="h-5 w-5" />,
      color: 'bg-secondary-500 hover:bg-secondary-600',
      onClick: () => window.location.reload()
    }
  ]

  const filterActions = [
    {
      id: 'date-range',
      label: 'Период',
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => setShowDatePicker(true)
    },
    {
      id: 'filter',
      label: 'Фильтры',
      icon: <Filter className="h-4 w-4" />,
      onClick: () => navigate('/conversations?filters=true')
    },
    {
      id: 'search',
      label: 'Поиск',
      icon: <Search className="h-4 w-4" />,
      onClick: () => navigate('/conversations?search=true')
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => navigate('/settings')
    }
  ]

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-secondary-200/50 p-8 shadow-soft hover:shadow-medium transition-all duration-300">
      {/* Main actions */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-primary-500 to-purple-500 rounded-full mr-4"></div>
          <h3 className="text-2xl font-bold text-secondary-900">
            Быстрые действия
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`group relative ${action.color} text-white rounded-2xl p-6 transition-all duration-300 text-left shadow-medium hover:shadow-strong transform hover:-translate-y-1 overflow-hidden`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative z-10">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-200">
                    {action.icon}
                  </div>
                  <span className="ml-3 font-semibold text-lg">{action.label}</span>
                </div>
                <p className="text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-200">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Secondary actions */}
      <div className="mb-8">
        <h4 className="text-base font-semibold text-secondary-700 mb-4 flex items-center">
          <div className="w-1 h-6 bg-gradient-to-b from-secondary-500 to-secondary-600 rounded-full mr-3"></div>
          Инструменты
        </h4>
        <div className="flex flex-wrap gap-3">
          {filterActions.map((action, index) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="group flex items-center px-4 py-3 text-sm text-secondary-700 bg-gradient-to-r from-secondary-100 to-secondary-200 hover:from-primary-100 hover:to-primary-200 rounded-xl transition-all duration-200 shadow-sm hover:shadow-medium transform hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 50 + 400}ms` }}
            >
              <div className="p-1 bg-white/60 rounded-lg mr-2 group-hover:bg-white/80 transition-colors duration-200">
                {action.icon}
              </div>
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity summary */}
      <div className="pt-6 border-t border-gradient-to-r from-secondary-200 via-primary-200 to-secondary-200">
        <h4 className="text-base font-semibold text-secondary-700 mb-4 flex items-center">
          <div className="w-1 h-6 bg-gradient-to-b from-success-500 to-warning-500 rounded-full mr-3"></div>
          Активность
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Загружено файлов', value: 0, color: 'text-primary-600' },
            { label: 'Обработано диалогов', value: 0, color: 'text-success-600' },
            { label: 'Создано инсайтов', value: 0, color: 'text-warning-600' }
          ].map((stat, index) => (
            <div key={stat.label} className="text-center p-4 bg-gradient-to-r from-secondary-50 to-white rounded-xl border border-secondary-200/50 hover:border-primary-200 transition-colors duration-200">
              <div className={`text-2xl font-bold mb-1 ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-secondary-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Date picker modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <DateRangePicker onClose={() => setShowDatePicker(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickActions