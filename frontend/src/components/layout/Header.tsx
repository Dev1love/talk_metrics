import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Menu,
  X,
  Bell,
  RefreshCw,
  Calendar,
  Download,
  Settings,
} from 'lucide-react'

import { RootState } from '../../store'
import { toggleSidebar, addNotification } from '../../store/slices/uiSlice'
import { fetchGlobalMetrics, recalculateAllMetrics } from '../../store/slices/metricsSlice'

// Components
import NotificationPanel from '../common/NotificationPanel'
import DateRangePicker from '../common/DateRangePicker'
import ThemeToggle from '../common/ThemeToggle'

const Header: React.FC = () => {
  const dispatch = useDispatch()
  const { sidebarCollapsed, notifications, currentPage } = useSelector((state: RootState) => state.ui)
  const { isLoading } = useSelector((state: RootState) => state.metrics)

  const [showNotifications, setShowNotifications] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const unreadNotifications = notifications.filter(n => !n.read).length

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await dispatch(fetchGlobalMetrics())
      dispatch(addNotification({
        type: 'success',
        title: 'Данные обновлены',
        message: 'Метрики успешно обновлены'
      }))
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Ошибка обновления',
        message: 'Не удалось обновить данные'
      }))
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRecalculate = async () => {
    setIsRefreshing(true)
    try {
      await dispatch(recalculateAllMetrics())
      dispatch(addNotification({
        type: 'success',
        title: 'Метрики пересчитаны',
        message: 'Все метрики успешно пересчитаны'
      }))
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Ошибка пересчета',
        message: 'Не удалось пересчитать метрики'
      }))
    } finally {
      setIsRefreshing(false)
    }
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Дашборд'
      case 'conversations':
        return 'Диалоги'
      case 'insights':
        return 'Инсайты'
      case 'analytics':
        return 'Аналитика'
      case 'upload':
        return 'Загрузка данных'
      case 'settings':
        return 'Настройки'
      default:
        return 'TalkMetrics'
    }
  }

  return (
    <header className="bg-white dark:bg-gray-800/90 border-b border-secondary-200 dark:border-gray-700/50 px-4 py-3 shadow-sm backdrop-blur-sm transition-colors duration-300">
      <div className="flex items-center justify-between">
        {/* Left side - Menu toggle and page title */}
        <div className="flex items-center">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-colors duration-150 md:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </button>

          <h1 className="ml-2 text-xl font-semibold text-secondary-900 dark:text-gray-100 md:text-2xl transition-colors duration-300">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right side - Actions and notifications */}
        <div className="flex items-center space-x-2">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Date range picker */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-colors duration-150"
              title="Выбрать период"
            >
              <Calendar className="h-5 w-5" />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 z-50">
                <DateRangePicker
                  onClose={() => setShowDatePicker(false)}
                />
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-colors duration-150 disabled:opacity-50"
            title="Обновить данные"
          >
            <RefreshCw className={`h-5 w-5 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
          </button>

          {/* Recalculate button */}
          <button
            onClick={handleRecalculate}
            disabled={isLoading || isRefreshing}
            className="hidden sm:flex p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-colors duration-150 disabled:opacity-50"
            title="Пересчитать все метрики"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* Export button */}
          <button
            className="hidden sm:flex p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-colors duration-150"
            title="Экспорт данных"
          >
            <Download className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-md text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 transition-colors duration-150"
              title="Уведомления"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary-600 rounded-full">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 z-50">
                <NotificationPanel
                  onClose={() => setShowNotifications(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header