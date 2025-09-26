import React from 'react'
import { Settings, User, Bell, Database, Key, Palette } from 'lucide-react'

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
          <Settings className="h-6 w-6 text-primary-600 mr-2" />
          Настройки
        </h1>
        <p className="mt-2 text-secondary-600">
          Конфигурация системы и персональные настройки
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <nav className="space-y-2">
              <a href="#profile" className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md">
                <User className="h-4 w-4 mr-3" />
                Профиль
              </a>
              <a href="#notifications" className="flex items-center px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 rounded-md">
                <Bell className="h-4 w-4 mr-3" />
                Уведомления
              </a>
              <a href="#integrations" className="flex items-center px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 rounded-md">
                <Database className="h-4 w-4 mr-3" />
                Интеграции
              </a>
              <a href="#api" className="flex items-center px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 rounded-md">
                <Key className="h-4 w-4 mr-3" />
                API ключи
              </a>
              <a href="#appearance" className="flex items-center px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 rounded-md">
                <Palette className="h-4 w-4 mr-3" />
                Внешний вид
              </a>
            </nav>
          </div>
        </div>

        {/* Settings content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-secondary-200 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Профиль пользователя
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Имя</label>
                <input type="text" className="form-input" defaultValue="Администратор" />
              </div>
              
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" defaultValue="admin@talkmetrics.com" />
              </div>
              
              <div>
                <label className="form-label">Организация</label>
                <input type="text" className="form-input" defaultValue="TalkMetrics" />
              </div>
              
              <div>
                <label className="form-label">Часовой пояс</label>
                <select className="form-select">
                  <option>Europe/Moscow</option>
                  <option>Europe/Kiev</option>
                  <option>Europe/Minsk</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-secondary-200">
              <button className="btn-primary mr-3">Сохранить изменения</button>
              <button className="btn-outline">Отменить</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage