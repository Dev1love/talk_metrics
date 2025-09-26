import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  X
} from 'lucide-react'

import { RootState } from '../../store'
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearNotifications
} from '../../store/slices/uiSlice'

interface NotificationPanelProps {
  onClose: () => void
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const dispatch = useDispatch()
  const { notifications } = useSelector((state: RootState) => state.ui)

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-600" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-error-600" />
      default:
        return <Info className="h-5 w-5 text-primary-600" />
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markNotificationAsRead(notificationId))
  }

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead())
  }

  const handleRemoveNotification = (notificationId: string) => {
    dispatch(removeNotification(notificationId))
  }

  const handleClearAll = () => {
    dispatch(clearNotifications())
    onClose()
  }

  return (
    <div className="w-80 bg-white rounded-lg shadow-lg border border-secondary-200 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-secondary-600 mr-2" />
          <h3 className="text-lg font-medium text-secondary-900">
            Уведомления
          </h3>
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-secondary-400 hover:text-secondary-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between p-3 border-b border-secondary-200 bg-secondary-50">
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:hover:text-primary-600"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Отметить все как прочитанные
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center text-sm text-secondary-600 hover:text-secondary-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Очистить все
          </button>
        </div>
      )}

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="h-8 w-8 text-secondary-300 mb-2" />
            <p className="text-sm text-secondary-500">
              Нет уведомлений
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${
                  notification.read ? 'bg-white' : 'bg-primary-50'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-secondary-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-secondary-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-secondary-400 mt-2">
                          {format(new Date(notification.timestamp), 'dd MMM, HH:mm', {
                            locale: ru
                          })}
                        </p>
                      </div>
                      <div className="flex items-center ml-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-primary-600 hover:text-primary-700 mr-2"
                            title="Отметить как прочитанное"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveNotification(notification.id)}
                          className="text-secondary-400 hover:text-secondary-600"
                          title="Удалить уведомление"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationPanel