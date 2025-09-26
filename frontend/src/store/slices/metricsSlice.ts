import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../services/api'

export interface GlobalMetrics {
  cci_score: number
  metrics: {
    total_conversations: number
    completed_conversations: number
    avg_first_response_minutes: number
    avg_response_time_minutes: number
    completion_rate: number
    booking_conversion_rate: number
    payment_conversion_rate: number
    upsell_rate: number
    avg_politeness_score: number
  }
  components: {
    response_time_score: number
    completion_rate_score: number
    conversion_rate_score: number
    politeness_score: number
    problem_resolution_score: number
  }
  interpretation: {
    level: string
    description: string
    color: string
    recommendations: string[]
  }
}

export interface ConversionAnalytics {
  platform: string
  totalConversations: number
  bookingConversions: number
  paymentConversions: number
  upsellAttempts: number
  bookingRate: string
  paymentRate: string
  upsellRate: string
}

export interface ResponseTimeAnalytics {
  timePeriod: string
  avgFirstResponse: string
  avgResponseTime: string
  conversationCount: number
}

interface MetricsState {
  globalMetrics: GlobalMetrics | null
  conversionAnalytics: ConversionAnalytics[]
  responseTimeAnalytics: ResponseTimeAnalytics[]
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}

const initialState: MetricsState = {
  globalMetrics: null,
  conversionAnalytics: [],
  responseTimeAnalytics: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
}

// Async thunks
export const fetchGlobalMetrics = createAsyncThunk(
  'metrics/fetchGlobalMetrics',
  async (params?: { dateRange?: string }) => {
    const response = await api.get('/metrics', { params })
    return response.data.data
  }
)

export const fetchConversionAnalytics = createAsyncThunk(
  'metrics/fetchConversionAnalytics',
  async (days: number = 30) => {
    const response = await api.get('/metrics/analytics/conversions', {
      params: { days }
    })
    return response.data.data.analytics
  }
)

export const fetchResponseTimeAnalytics = createAsyncThunk(
  'metrics/fetchResponseTimeAnalytics',
  async (params: { days?: number; groupBy?: string } = {}) => {
    const response = await api.get('/metrics/analytics/response-times', {
      params
    })
    return response.data.data.analytics
  }
)

export const calculateCCI = createAsyncThunk(
  'metrics/calculateCCI',
  async (params?: { dateRange?: string; saveToDb?: boolean }) => {
    const response = await api.get('/metrics/cci', { params })
    return response.data.data
  }
)

export const recalculateAllMetrics = createAsyncThunk(
  'metrics/recalculateAllMetrics',
  async () => {
    const response = await api.post('/metrics/recalculate-all')
    return response.data.data
  }
)

const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setDateRange: (state, action: PayloadAction<string>) => {
      // This will be used to filter metrics by date range
      // The actual filtering will be done in the async thunks
    },
  },
  extraReducers: (builder) => {
    // Global metrics
    builder
      .addCase(fetchGlobalMetrics.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchGlobalMetrics.fulfilled, (state, action) => {
        state.isLoading = false
        state.globalMetrics = action.payload.current
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchGlobalMetrics.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch global metrics'
      })

    // Conversion analytics
    builder
      .addCase(fetchConversionAnalytics.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchConversionAnalytics.fulfilled, (state, action) => {
        state.isLoading = false
        state.conversionAnalytics = action.payload
      })
      .addCase(fetchConversionAnalytics.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch conversion analytics'
      })

    // Response time analytics
    builder
      .addCase(fetchResponseTimeAnalytics.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchResponseTimeAnalytics.fulfilled, (state, action) => {
        state.isLoading = false
        state.responseTimeAnalytics = action.payload
      })
      .addCase(fetchResponseTimeAnalytics.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch response time analytics'
      })

    // CCI calculation
    builder
      .addCase(calculateCCI.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(calculateCCI.fulfilled, (state, action) => {
        state.isLoading = false
        if (state.globalMetrics) {
          state.globalMetrics.cci_score = action.payload.cci_score
          state.globalMetrics.components = action.payload.components
          state.globalMetrics.interpretation = action.payload.interpretation
        }
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(calculateCCI.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to calculate CCI'
      })

    // Recalculate all metrics
    builder
      .addCase(recalculateAllMetrics.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(recalculateAllMetrics.fulfilled, (state) => {
        state.isLoading = false
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(recalculateAllMetrics.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to recalculate metrics'
      })
  },
})

export const { clearError, setDateRange } = metricsSlice.actions
export default metricsSlice.reducer