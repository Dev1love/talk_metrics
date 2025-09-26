import axios, { AxiosError, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? '/api/v1'
    : 'http://localhost:3001/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: Date.now() }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration for debugging
    const duration = Date.now() - response.config.metadata?.startTime

    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
    }

    return response
  },
  (error: AxiosError) => {
    const duration = error.config?.metadata?.startTime
      ? Date.now() - error.config.metadata.startTime
      : 0

    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${duration}ms`, error)
    }

    // Handle different error types
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          toast.error(data?.error?.message || 'Неверный запрос')
          break
        case 401:
          toast.error('Необходима авторизация')
          // Redirect to login if needed
          break
        case 403:
          toast.error('Недостаточно прав доступа')
          break
        case 404:
          toast.error('Ресурс не найден')
          break
        case 429:
          toast.error('Слишком много запросов. Попробуйте позже')
          break
        case 500:
          toast.error('Ошибка сервера')
          break
        case 503:
          toast.error('Сервис временно недоступен')
          break
        default:
          toast.error(data?.error?.message || 'Произошла ошибка')
      }
    } else if (error.request) {
      // Network error
      toast.error('Ошибка подключения к серверу')
    } else {
      // Something else happened
      toast.error('Произошла неожиданная ошибка')
    }

    return Promise.reject(error)
  }
)

// API endpoints
export const endpoints = {
  // Health check
  health: '/health',

  // Upload endpoints
  upload: '/upload',
  uploadHistory: '/upload/history',
  uploadDetails: (id: string) => `/upload/${id}`,

  // Conversation endpoints
  conversations: '/conversations',
  conversationDetails: (id: string) => `/conversations/${id}`,
  conversationMessages: (id: string) => `/conversations/${id}/messages`,
  conversationStatus: (id: string) => `/conversations/${id}/status`,
  conversationsByDateRange: (start: string, end: string) => `/conversations/date-range/${start}/${end}`,
  conversationResponseTimes: (id: string) => `/conversations/${id}/response-times`,

  // Metrics endpoints
  metrics: '/metrics',
  conversationMetrics: (id: string) => `/metrics/conversation/${id}`,
  recalculateConversationMetrics: (id: string) => `/metrics/conversation/${id}/recalculate`,
  cci: '/metrics/cci',
  metricsSummary: '/metrics/summary',
  responseTimeAnalytics: '/metrics/analytics/response-times',
  conversionAnalytics: '/metrics/analytics/conversions',
  recalculateAllMetrics: '/metrics/recalculate-all',

  // AI endpoints
  aiConfig: '/ai/config',
  aiTestConnection: '/ai/test-connection',
  analyzeMessage: (id: string) => `/ai/analyze/message/${id}`,
  analyzeConversation: (id: string) => `/ai/analyze/conversation/${id}`,
  analyzePending: '/ai/analyze/pending',
  analysisByIntention: (intention: string) => `/ai/analysis/intention/${intention}`,
  politenessTrends: '/ai/analysis/politeness-trends',
  sentimentAnalysis: '/ai/analysis/sentiment',
  analysisStats: '/ai/analysis/stats',
  generateInsights: '/ai/insights/generate',
  insights: '/ai/insights',
  markInsightAsAddressed: (id: string) => `/ai/insights/${id}/addressed`,
}

// Utility functions for API calls
export const apiUtils = {
  // Generic GET request with error handling
  async get<T>(endpoint: string, params?: any): Promise<T> {
    const response = await api.get(endpoint, { params })
    return response.data.data
  },

  // Generic POST request with error handling
  async post<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const response = await api.post(endpoint, data, config)
    return response.data.data
  },

  // Generic PUT request with error handling
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await api.put(endpoint, data)
    return response.data.data
  },

  // Generic PATCH request with error handling
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await api.patch(endpoint, data)
    return response.data.data
  },

  // Generic DELETE request with error handling
  async delete<T>(endpoint: string): Promise<T> {
    const response = await api.delete(endpoint)
    return response.data.data
  },

  // Check API health
  async checkHealth(): Promise<boolean> {
    try {
      await api.get(endpoints.health)
      return true
    } catch {
      return false
    }
  },

  // Upload files with progress tracking
  async uploadFiles(
    files: FileList,
    platform: string,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('files', file)
    })
    formData.append('platform', platform)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    }

    const response = await api.post(endpoints.upload, formData, config)
    return response.data.data
  },
}

// Type definitions for API responses
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    message: string
    details?: any
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// Add metadata to axios config type
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number
    }
  }
}