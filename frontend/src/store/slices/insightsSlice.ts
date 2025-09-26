import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../services/api'

export interface Insight {
  id: string
  title: string
  description: string
  recommendation: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  proof_message_id?: string
  proof_conversation_id?: string
  proof_message_content?: string
  proof_conversation_title?: string
  metric_impact: number
  is_addressed: boolean
  addressed_at?: string
  generated_at: string
}

export interface InsightFilters {
  category?: string
  priority?: string
  isAddressed?: boolean
  limit?: number
}

interface InsightsState {
  insights: Insight[]
  filters: InsightFilters
  isLoading: boolean
  isGenerating: boolean
  error: string | null
  lastGenerated: string | null
}

const initialState: InsightsState = {
  insights: [],
  filters: {
    limit: 50
  },
  isLoading: false,
  isGenerating: false,
  error: null,
  lastGenerated: null,
}

// Async thunks
export const fetchInsights = createAsyncThunk(
  'insights/fetchInsights',
  async (filters: InsightFilters = {}) => {
    const response = await api.get('/ai/insights', { params: filters })
    return response.data.data
  }
)

export const generateInsights = createAsyncThunk(
  'insights/generateInsights',
  async (params?: { conversationId?: string; dateRange?: string }) => {
    const response = await api.post('/ai/insights/generate', null, { params })
    return response.data.data
  }
)

export const markInsightAsAddressed = createAsyncThunk(
  'insights/markInsightAsAddressed',
  async (insightId: string) => {
    const response = await api.patch(`/ai/insights/${insightId}/addressed`)
    return { insightId, insight: response.data.data.insight }
  }
)

const insightsSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<InsightFilters>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    },
    updateInsightStatus: (state, action: PayloadAction<{ id: string; isAddressed: boolean }>) => {
      const insight = state.insights.find(i => i.id === action.payload.id)
      if (insight) {
        insight.is_addressed = action.payload.isAddressed
        if (action.payload.isAddressed) {
          insight.addressed_at = new Date().toISOString()
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch insights
    builder
      .addCase(fetchInsights.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.isLoading = false
        state.insights = action.payload.insights
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch insights'
      })

    // Generate insights
    builder
      .addCase(generateInsights.pending, (state) => {
        state.isGenerating = true
        state.error = null
      })
      .addCase(generateInsights.fulfilled, (state, action) => {
        state.isGenerating = false
        state.insights = [...action.payload.insights, ...state.insights]
        state.lastGenerated = new Date().toISOString()
      })
      .addCase(generateInsights.rejected, (state, action) => {
        state.isGenerating = false
        state.error = action.error.message || 'Failed to generate insights'
      })

    // Mark insight as addressed
    builder
      .addCase(markInsightAsAddressed.pending, (state) => {
        state.error = null
      })
      .addCase(markInsightAsAddressed.fulfilled, (state, action) => {
        const { insightId, insight } = action.payload
        const index = state.insights.findIndex(i => i.id === insightId)
        if (index !== -1) {
          state.insights[index] = insight
        }
      })
      .addCase(markInsightAsAddressed.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to mark insight as addressed'
      })
  },
})

export const { setFilters, clearError, updateInsightStatus } = insightsSlice.actions
export default insightsSlice.reducer