import React from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Upload,
  Lightbulb,
  BarChart3,
  Settings,
  Activity,
} from 'lucide-react'

import { RootState } from '../../store'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const navigation: NavigationItem[] = [
  { name: 'Дашборд', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Диалоги', href: '/conversations', icon: MessageSquare },
  { name: 'Инсайты', href: '/insights', icon: Lightbulb },
  { name: 'Аналитика', href: '/analytics', icon: BarChart3 },
  { name: 'Загрузка', href: '/upload', icon: Upload },
  { name: 'Настройки', href: '/settings', icon: Settings },
]

const Sidebar: React.FC = () => {
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui)
  const { globalMetrics } = useSelector((state: RootState) => state.metrics)
  const { insights } = useSelector((state: RootState) => state.insights)

  // Add badge for unaddressed insights
  const unaddressedInsights = insights.filter(insight => !insight.is_addressed).length
  const updatedNavigation = navigation.map(item => {
    if (item.name === 'Инсайты' && unaddressedInsights > 0) {
      return { ...item, badge: unaddressedInsights }
    }
    return item
  })

  return (
    <div className="flex flex-col h-full bg-white border-r border-secondary-200 shadow-sm">
      {/* Logo and brand */}
      <div className="flex items-center px-4 py-4 border-b border-secondary-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Activity className="h-8 w-8 text-primary-600" />
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-secondary-900">
                TalkMetrics
              </h1>
              <p className="text-xs text-secondary-500">
                v1.0.0
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CCI Score Display */}
      {!sidebarCollapsed && globalMetrics && (
        <div className="px-4 py-3 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-secondary-700">
              CCI Score
            </span>
            <div className="flex items-center">
              <span
                className={`text-lg font-bold ${
                  globalMetrics.cci_score >= 80
                    ? 'text-success-600'
                    : globalMetrics.cci_score >= 60
                    ? 'text-warning-600'
                    : 'text-error-600'
                }`}
              >
                {globalMetrics.cci_score}
              </span>
              <span className="text-sm text-secondary-500 ml-1">/100</span>
            </div>
          </div>
          <div className="mt-2 w-full bg-secondary-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                globalMetrics.cci_score >= 80
                  ? 'bg-success-600'
                  : globalMetrics.cci_score >= 60
                  ? 'bg-warning-600'
                  : 'bg-error-600'
              }`}
              style={{ width: `${globalMetrics.cci_score}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {updatedNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                isActive
                  ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                  : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
              }`
            }
          >
            <item.icon
              className={`flex-shrink-0 h-5 w-5 ${
                sidebarCollapsed ? 'mr-0' : 'mr-3'
              }`}
            />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="ml-3 inline-block py-0.5 px-2 text-xs font-medium bg-primary-100 text-primary-600 rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer with status */}
      <div className="px-4 py-3 border-t border-secondary-200">
        {!sidebarCollapsed ? (
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-success-400 rounded-full animate-pulse" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-secondary-900">
                Система активна
              </p>
              <p className="text-xs text-secondary-500">
                Данные обновляются
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 bg-success-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar