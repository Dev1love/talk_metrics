import React, { useState } from 'react'
import { Download, FileText, Calendar, Filter, Clock } from 'lucide-react'

const ExportPage: React.FC = () => {
  const [exportFormat, setExportFormat] = useState('pdf')
  const [dateRange, setDateRange] = useState('month')
  const [includeCharts, setIncludeCharts] = useState(true)
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
          <Download className="h-6 w-6 text-primary-600 mr-2" />
          Экспорт отчётов
        </h1>
        <p className="mt-2 text-secondary-600">
          Генерация отчётов по метрикам и инсайтам в PDF и CSV формате
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export options */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-secondary-200 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-6">
              Параметры экспорта
            </h2>
            
            <div className="space-y-6">
              {/* Format selection */}
              <div>
                <label className="form-label mb-3">Формат отчёта</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      exportFormat === 'pdf' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-secondary-200 hover:border-secondary-300'
                    }`}
                    onClick={() => setExportFormat('pdf')}
                  >
                    <FileText className="h-8 w-8 text-error-500 mb-2" />
                    <h3 className="font-medium text-secondary-900">PDF отчёт</h3>
                    <p className="text-sm text-secondary-600">Полный отчёт с графиками</p>
                  </div>
                  
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      exportFormat === 'csv' 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-secondary-200 hover:border-secondary-300'
                    }`}
                    onClick={() => setExportFormat('csv')}
                  >
                    <FileText className="h-8 w-8 text-success-500 mb-2" />
                    <h3 className="font-medium text-secondary-900">CSV данные</h3>
                    <p className="text-sm text-secondary-600">Сырые данные для анализа</p>
                  </div>
                </div>
              </div>
              
              {/* Date range */}
              <div>
                <label className="form-label">Период</label>
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="form-select"
                >
                  <option value="week">Последние 7 дней</option>
                  <option value="month">Последние 30 дней</option>
                  <option value="quarter">Последние 3 месяца</option>
                  <option value="year">Последний год</option>
                  <option value="custom">Произвольный период</option>
                </select>
              </div>
              
              {/* Additional options */}
              <div>
                <label className="form-label mb-3">Дополнительно</label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      className="form-checkbox"
                    />
                    <span className="ml-2 text-sm text-secondary-700">Включить графики и диаграммы</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="form-checkbox" defaultChecked />
                    <span className="ml-2 text-sm text-secondary-700">Включить инсайты и рекомендации</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="form-checkbox" />
                    <span className="ml-2 text-sm text-secondary-700">Включить примеры диалогов</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-secondary-200 flex items-center justify-between">
              <div className="text-sm text-secondary-600">
                Отчёт будет содержать данные за выбранный период
              </div>
              <button className="btn-primary flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Генерировать
              </button>
            </div>
          </div>
        </div>
        
        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-secondary-200 p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Предпросмотр
            </h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center text-sm text-secondary-700 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Период: Последние 30 дней
                </div>
                <div className="flex items-center text-sm text-secondary-700 mb-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Формат: {exportFormat.toUpperCase()}
                </div>
                <div className="flex items-center text-sm text-secondary-700">
                  <Clock className="h-4 w-4 mr-2" />
                  Примерное время: 2-3 мин
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-secondary-800 mb-2">Содержание:</h4>
                <ul className="text-sm text-secondary-600 space-y-1">
                  <li>• Общие метрики</li>
                  <li>• CCI индекс</li>
                  <li>• Анализ трендов</li>
                  <li>• Инсайты и рекомендации</li>
                  {includeCharts && <li>• Графики и диаграммы</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportPage