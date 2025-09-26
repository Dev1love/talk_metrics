import React from 'react'
import { BarChart3, TrendingUp, PieChart, Calendar } from 'lucide-react'

const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
          <BarChart3 className="h-6 w-6 text-primary-600 mr-2" />
          Аналитика
        </h1>
        <p className="mt-2 text-secondary-600">
          Детальная аналитика метрик и трендов
        </p>
      </div>

      {/* Coming soon placeholder */}
      <div className="bg-white rounded-lg border border-secondary-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <div className="flex justify-center space-x-4 mb-4">
              <BarChart3 className="h-12 w-12 text-primary-300" />
              <TrendingUp className="h-12 w-12 text-success-300" />
              <PieChart className="h-12 w-12 text-warning-300" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-secondary-900 mb-4">
            Аналитика в разработке
          </h2>
          
          <p className="text-secondary-600 mb-6">
            Мы работаем над детальной аналитикой, которая будет включать:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center mb-2">
                <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="font-medium text-secondary-900">Интерактивные графики</h3>
              </div>
              <p className="text-sm text-secondary-600">
                Графики трендов по всем метрикам
              </p>
            </div>
            
            <div className="p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-success-600 mr-2" />
                <h3 className="font-medium text-secondary-900">Прогнозы</h3>
              </div>
              <p className="text-sm text-secondary-600">
                AI-прогнозы развития метрик
              </p>
            </div>
            
            <div className="p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center mb-2">
                <PieChart className="h-5 w-5 text-warning-600 mr-2" />
                <h3 className="font-medium text-secondary-900">Сегментация</h3>
              </div>
              <p className="text-sm text-secondary-600">
                Анализ по сегментам клиентов
              </p>
            </div>
            
            <div className="p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="font-medium text-secondary-900">Периоды</h3>
              </div>
              <p className="text-sm text-secondary-600">
                Сравнение разных периодов
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm">
              Ожидаемый релиз: Q2 2024
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage