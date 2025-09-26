import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar, X } from 'lucide-react'

import { RootState } from '../../store'
import { setDateRange } from '../../store/slices/uiSlice'

interface DateRangePickerProps {
  onClose: () => void
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onClose }) => {
  const dispatch = useDispatch()
  const { dateRange } = useSelector((state: RootState) => state.ui)

  const [startDate, setStartDate] = useState(
    dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : ''
  )
  const [endDate, setEndDate] = useState(
    dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : ''
  )

  const presetRanges = [
    {
      label: 'Последние 7 дней',
      getValue: () => ({
        start: startOfDay(subDays(new Date(), 6)),
        end: endOfDay(new Date())
      })
    },
    {
      label: 'Последние 30 дней',
      getValue: () => ({
        start: startOfDay(subDays(new Date(), 29)),
        end: endOfDay(new Date())
      })
    },
    {
      label: 'Эта неделя',
      getValue: () => {
        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
        return {
          start: startOfDay(startOfWeek),
          end: endOfDay(now)
        }
      }
    },
    {
      label: 'Этот месяц',
      getValue: () => {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return {
          start: startOfDay(startOfMonth),
          end: endOfDay(now)
        }
      }
    },
    {
      label: 'Прошлый месяц',
      getValue: () => {
        const now = new Date()
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          start: startOfDay(startOfLastMonth),
          end: endOfDay(endOfLastMonth)
        }
      }
    }
  ]

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    const range = preset.getValue()
    dispatch(setDateRange(range))
    setStartDate(format(range.start, 'yyyy-MM-dd'))
    setEndDate(format(range.end, 'yyyy-MM-dd'))
  }

  const handleApply = () => {
    if (startDate && endDate) {
      dispatch(setDateRange({
        start: startOfDay(new Date(startDate)),
        end: endOfDay(new Date(endDate))
      }))
    }
    onClose()
  }

  const handleClear = () => {
    dispatch(setDateRange({ start: null, end: null }))
    setStartDate('')
    setEndDate('')
    onClose()
  }

  return (
    <div className="w-80 bg-white rounded-lg shadow-lg border border-secondary-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-secondary-600 mr-2" />
          <h3 className="text-lg font-medium text-secondary-900">
            Период
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-secondary-400 hover:text-secondary-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Preset ranges */}
      <div className="p-4 border-b border-secondary-200">
        <h4 className="text-sm font-medium text-secondary-700 mb-3">
          Быстрый выбор
        </h4>
        <div className="space-y-2">
          {presetRanges.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetClick(preset)}
              className="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-100 rounded-md transition-colors duration-150"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date inputs */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-secondary-700 mb-3">
          Выбрать даты
        </h4>
        <div className="space-y-3">
          <div>
            <label className="form-label">
              С даты
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">
              По дату
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Current selection */}
      {dateRange.start && dateRange.end && (
        <div className="px-4 py-3 bg-primary-50 border-t border-secondary-200">
          <p className="text-sm text-primary-700">
            <span className="font-medium">Выбран период:</span>{' '}
            {format(dateRange.start, 'dd MMM yyyy', { locale: ru })} —{' '}
            {format(dateRange.end, 'dd MMM yyyy', { locale: ru })}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t border-secondary-200">
        <button
          onClick={handleClear}
          className="btn-outline"
        >
          Сбросить
        </button>
        <button
          onClick={handleApply}
          disabled={!startDate || !endDate}
          className="btn-primary disabled:opacity-50"
        >
          Применить
        </button>
      </div>
    </div>
  )
}

export default DateRangePicker