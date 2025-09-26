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
    <div className="bg-white rounded-lg border border-secondary-200 p-6">
      {/* Main actions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Быстрые действия
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`${action.color} text-white rounded-lg p-4 transition-colors duration-200 text-left`}
            >
              <div className="flex items-center mb-2">
                {action.icon}
                <span className="ml-2 font-medium">{action.label}</span>
              </div>
              <p className="text-sm opacity-90">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Secondary actions */}
      <div>
        <h4 className="text-sm font-medium text-secondary-700 mb-3">
          Инструменты
        </h4>
        <div className="flex flex-wrap gap-2">
          {filterActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex items-center px-3 py-2 text-sm text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-md transition-colors duration-150"
            >
              {action.icon}
              <span className="ml-1">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity summary */}
      <div className="mt-6 pt-6 border-t border-secondary-200">
        <h4 className="text-sm font-medium text-secondary-700 mb-3">
          Активность
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-secondary-600">Загружено файлов:</span>
            <span className="font-medium text-secondary-900">0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary-600">Обработано диалогов:</span>
            <span className="font-medium text-secondary-900">0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary-600">Создано инсайтов:</span>
            <span className="font-medium text-secondary-900">0</span>
          </div>
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