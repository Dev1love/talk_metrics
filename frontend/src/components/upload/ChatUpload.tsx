import React, { useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft
} from 'lucide-react'

import { uploadChatFile } from '../../store/slices/uploadSlice'
import LoadingSpinner from '../common/LoadingSpinner'

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress?: number
  error?: string
  result?: {
    conversationsCount: number
    messagesCount: number
  }
}

const ChatUpload: React.FC = () => {
  const dispatch = useDispatch()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending' as const
    }))

    // Validate files
    const validFiles = newFiles.filter(({ file }) => {
      const isValidType = file.type === 'text/plain' ||
                         file.type === 'application/json' ||
                         file.name.endsWith('.txt') ||
                         file.name.endsWith('.json')
      const isValidSize = file.size <= 50 * 1024 * 1024 // 50MB limit
      return isValidType && isValidSize
    })

    setFiles(prev => [...prev, ...validFiles])
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFile = async (file: UploadFile) => {
    setFiles(prev => prev.map(f =>
      f.id === file.id
        ? { ...f, status: 'uploading' as const, progress: 0 }
        : f
    ))

    try {
      const formData = new FormData()
      formData.append('files', file.file)
      formData.append('platform', file.file.name.endsWith('.json') ? 'telegram' : 'whatsapp')

      // Mock upload progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === file.id && f.progress !== undefined && f.progress < 90) {
            return { ...f, progress: f.progress + 10 }
          }
          return f
        }))
      }, 500)

      const result = await dispatch(uploadChatFile(formData)).unwrap()

      clearInterval(progressInterval)

      // Debug logging - result is the backend response
      console.log('Upload result:', result)
      console.log('Data wrapper:', result.data)
      console.log('Results array:', result.data?.results)
      console.log('First result:', result.data?.results?.[0])
      console.log('Stats:', result.data?.results?.[0]?.stats)
      console.log('conversations_created:', result.data?.results?.[0]?.stats?.conversations_created)
      console.log('messages_created:', result.data?.results?.[0]?.stats?.messages_created)

      // Extract counts from the backend response structure
      const firstResult = result.data?.results?.[0]
      const conversationsCount = firstResult?.stats?.conversations_created || 0
      const messagesCount = firstResult?.stats?.messages_created || 0

      console.log('Final counts:', { conversationsCount, messagesCount })

      setFiles(prev => prev.map(f =>
        f.id === file.id
          ? {
              ...f,
              status: 'success' as const,
              progress: 100,
              result: {
                conversationsCount,
                messagesCount
              }
            }
          : f
      ))
    } catch (error: any) {
      setFiles(prev => prev.map(f =>
        f.id === file.id
          ? {
              ...f,
              status: 'error' as const,
              error: error.message || 'Ошибка загрузки файла'
            }
          : f
      ))
    }
  }

  const uploadAllFiles = () => {
    files
      .filter(f => f.status === 'pending')
      .forEach(file => uploadFile(file))
  }

  const clearAllFiles = () => {
    setFiles([])
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.json')) {
      return <FileText className="h-8 w-8 text-blue-500" />
    }
    return <FileText className="h-8 w-8 text-green-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-600" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-error-600" />
      case 'uploading':
        return <Clock className="h-5 w-5 text-primary-600" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <button
            onClick={() => window.history.back()}
            className="mr-3 p-1 text-secondary-600 hover:text-secondary-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-secondary-900">
            Загрузка чатов
          </h1>
        </div>
        <p className="text-secondary-600">
          Поддерживаются файлы WhatsApp (.txt) и Telegram (.json)
        </p>
      </div>

      {/* Upload zone */}
      <div className="bg-white rounded-lg border border-secondary-200 p-6 mb-6">
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
            ${dragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-secondary-300 hover:border-secondary-400'
            }
          `}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-secondary-400 mx-auto mb-4" />

          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Перетащите файлы сюда или
          </h3>

          <div className="mb-4">
            <label htmlFor="file-upload" className="btn-primary cursor-pointer">
              Выберите файлы
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".txt,.json"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          <div className="text-sm text-secondary-600">
            <p className="mb-1">• WhatsApp экспорт чата (.txt)</p>
            <p className="mb-1">• Telegram экспорт чата (.json)</p>
            <p>• Максимальный размер файла: 50MB</p>
          </div>
        </div>
      </div>

      {/* Files list */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Файлы для загрузки ({files.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={uploadAllFiles}
                disabled={!files.some(f => f.status === 'pending')}
                className="btn-primary disabled:opacity-50"
              >
                Загрузить все
              </button>
              <button
                onClick={clearAllFiles}
                className="btn-outline"
              >
                Очистить
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="mr-3">
                    {getFileIcon(file.file.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-secondary-900 truncate">
                        {file.file.name}
                      </p>
                      <div className="ml-2">
                        {getStatusIcon(file.status)}
                      </div>
                    </div>

                    <div className="flex items-center mt-1 text-xs text-secondary-500">
                      <span>{formatFileSize(file.file.size)}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {file.file.name.endsWith('.json') ? 'Telegram' : 'WhatsApp'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {file.status === 'uploading' && file.progress !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-secondary-200 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Success result */}
                    {file.status === 'success' && file.result && (
                      <div className="mt-2 text-xs text-success-600">
                        Обработано: {file.result.conversationsCount} диалогов, {file.result.messagesCount} сообщений
                      </div>
                    )}

                    {/* Error message */}
                    {file.status === 'error' && file.error && (
                      <div className="mt-2 text-xs text-error-600">
                        {file.error}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center ml-4 space-x-2">
                  {file.status === 'pending' && (
                    <button
                      onClick={() => uploadFile(file)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Загрузить
                    </button>
                  )}
                  {file.status === 'uploading' && (
                    <LoadingSpinner size="sm" />
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-secondary-400 hover:text-secondary-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="mt-8 bg-secondary-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-secondary-900 mb-4">
          Как экспортировать чаты?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-secondary-900 mb-2 flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded mr-2" />
              WhatsApp
            </h4>
            <ol className="text-sm text-secondary-600 space-y-1 list-decimal list-inside">
              <li>Откройте чат в WhatsApp</li>
              <li>Нажмите на название чата сверху</li>
              <li>Выберите "Экспорт чата"</li>
              <li>Выберите "Без медиа"</li>
              <li>Сохраните .txt файл</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-secondary-900 mb-2 flex items-center">
              <div className="w-6 h-6 bg-blue-500 rounded mr-2" />
              Telegram
            </h4>
            <ol className="text-sm text-secondary-600 space-y-1 list-decimal list-inside">
              <li>Откройте Telegram Desktop</li>
              <li>Выберите нужный чат</li>
              <li>Меню → Экспорт истории чата</li>
              <li>Формат: JSON</li>
              <li>Сохраните файл</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatUpload