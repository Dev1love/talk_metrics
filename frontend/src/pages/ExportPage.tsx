import React, { useState } from 'react'
import { Download, FileText, Calendar, Filter, Clock, Loader } from 'lucide-react'

const ExportPage: React.FC = () => {
  const [exportFormat, setExportFormat] = useState('pdf')
  const [csvType, setCsvType] = useState('metrics')
  const [dateRange, setDateRange] = useState('month')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeInsights, setIncludeInsights] = useState(true)
  const [includeConversations, setIncludeConversations] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError('')

    try {
      const endpoint = exportFormat === 'pdf' ? '/api/v1/export/pdf' : '/api/v1/export/csv'

      const payload: any = {
        dateRange: getDateRangeValues(dateRange)
      }

      if (exportFormat === 'pdf') {
        payload.includeCharts = includeCharts
        payload.includeInsights = includeInsights
        payload.includeConversations = includeConversations
      } else {
        payload.type = csvType
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      // Get the filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `talkmetrics-${exportFormat}-${Date.now()}.${exportFormat}`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при генерации отчёта')
      console.error('Export error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const getDateRangeValues = (range: string) => {
    const now = new Date()
    const start = new Date()

    switch (range) {
      case 'week':
        start.setDate(now.getDate() - 7)
        break
      case 'month':
        start.setDate(now.getDate() - 30)
        break
      case 'quarter':
        start.setMonth(now.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        break
      default:
        return null
    }

    return {
      start: start.toISOString(),
      end: now.toISOString()
    }
  }

  const getCsvTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'metrics': 'Метрики и KPI',
      'conversations': 'Данные по диалогам',
      'insights': 'AI инсайты',
      'messages': 'Отдельные сообщения',
      'all': 'Полный экспорт'
    }
    return labels[type] || type
  }

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
              
              {/* CSV Type Selection */}
              {exportFormat === 'csv' && (
                <div>
                  <label className="form-label">Тип данных</label>
                  <select
                    value={csvType}
                    onChange={(e) => setCsvType(e.target.value)}
                    className="form-select"
                  >
                    <option value="metrics">Метрики и KPI</option>
                    <option value="conversations">Данные по диалогам</option>
                    <option value="insights">AI инсайты</option>
                    <option value="messages">Отдельные сообщения</option>
                    <option value="all">Полный экспорт</option>
                  </select>
                </div>
              )}

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
              
              {/* Additional options for PDF only */}
              {exportFormat === 'pdf' && (
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
                      <input
                        type="checkbox"
                        checked={includeInsights}
                        onChange={(e) => setIncludeInsights(e.target.checked)}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-secondary-700">Включить инсайты и рекомендации</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeConversations}
                        onChange={(e) => setIncludeConversations(e.target.checked)}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-secondary-700">Включить примеры диалогов</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            {/* Error display */}
            {error && (
              <div className="mt-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-secondary-200 flex items-center justify-between">
              <div className="text-sm text-secondary-600">
                {exportFormat === 'pdf'
                  ? 'PDF отчёт будет содержать данные за выбранный период'
                  : `CSV экспорт: ${getCsvTypeLabel(csvType)}`
                }
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn-primary flex items-center disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? 'Генерируется...' : 'Генерировать'}
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
                  {exportFormat === 'csv' && ` (${getCsvTypeLabel(csvType)})`}
                </div>
                <div className="flex items-center text-sm text-secondary-700">
                  <Clock className="h-4 w-4 mr-2" />
                  Примерное время: 2-3 мин
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-secondary-800 mb-2">Содержание:</h4>
                <ul className="text-sm text-secondary-600 space-y-1">
                  {exportFormat === 'pdf' ? (
                    <>
                      <li>• Общие метрики</li>
                      <li>• CCI индекс</li>
                      <li>• Анализ трендов</li>
                      {includeInsights && <li>• Инсайты и рекомендации</li>}
                      {includeCharts && <li>• Графики и диаграммы</li>}
                      {includeConversations && <li>• Примеры диалогов</li>}
                    </>
                  ) : (
                    <>
                      {csvType === 'metrics' && <li>• Ключевые метрики и KPI</li>}
                      {csvType === 'conversations' && <li>• Подробные данные по диалогам</li>}
                      {csvType === 'insights' && <li>• AI-сгенерированные инсайты</li>}
                      {csvType === 'messages' && <li>• Индивидуальные сообщения</li>}
                      {csvType === 'all' && (
                        <>
                          <li>• Все метрики</li>
                          <li>• Сводка по инсайтам</li>
                          <li>• Статистика по категориям</li>
                        </>
                      )}
                    </>
                  )}
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