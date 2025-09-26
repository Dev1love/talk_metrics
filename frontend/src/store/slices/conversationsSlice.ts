import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../services/api'

export interface Participant {
  id: string
  name: string
  is_business: boolean
}

export interface Message {
  id: string
  content: string
  message_type: string
  direction: 'incoming' | 'outgoing'
  timestamp_normalized: string
  participant: Participant
}

export interface ConversationMetrics {
  first_response_time_minutes?: number
  avg_response_time_minutes?: number
  total_response_time_minutes?: number
  message_count_incoming: number
  message_count_outgoing: number
  is_completed: boolean
  has_booking_conversion: boolean
  has_payment_conversion: boolean
  has_upsell_attempt: boolean
  avg_politeness_score?: number
}

export interface Conversation {
  id: string
  title: string
  platform: 'whatsapp' | 'telegram'
  status: 'open' | 'closed' | 'resolved'
  started_at: string
  closed_at?: string
  message_count: number
  participant_count: number
  metrics?: ConversationMetrics
  messages?: Message[]
}

export interface FileUpload {
  uploadId: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  stats?: {
    conversations_created: number
    messages_created: number
    participants_created: number
  }
  error?: string
}

interface ConversationsState {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  uploads: FileUpload[]
  isLoading: boolean
  isUploading: boolean
  error: string | null
  pagination: {
    limit: number
    offset: number
    total: number
  }
  filters: {
    platform?: string
    status?: string
    search?: string
  }
}

const initialState: ConversationsState = {
  conversations: [],
  selectedConversation: null,
  uploads: [],
  isLoading: false,
  isUploading: false,
  error: null,
  pagination: {
    limit: 50,
    offset: 0,
    total: 0,
  },
  filters: {},
}

// Async thunks
export const fetchConversations = createAsyncThunk(
  'conversations/fetchConversations',
  async (params?: {
    limit?: number
    offset?: number
    platform?: string
    status?: string
    search?: string
  }) => {
    const response = await api.get('/conversations', { params })
    return response.data.data
  }
)

export const fetchConversationDetails = createAsyncThunk(
  'conversations/fetchConversationDetails',
  async (conversationId: string) => {
    const response = await api.get(`/conversations/${conversationId}`)
    return response.data.data.conversation
  }
)

export const uploadChatFiles = createAsyncThunk(
  'conversations/uploadChatFiles',
  async (data: { files: FileList, platform: string }) => {
    const formData = new FormData()
    Array.from(data.files).forEach(file => {
      formData.append('files', file)
    })
    formData.append('platform', data.platform)

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  }
)

export const getUploadHistory = createAsyncThunk(
  'conversations/getUploadHistory',
  async (params?: { status?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/upload/history', { params })
    return response.data.data
  }
)

export const updateConversationStatus = createAsyncThunk(
  'conversations/updateConversationStatus',
  async (data: { conversationId: string; status: string }) => {
    const response = await api.patch(`/conversations/${data.conversationId}/status`, {
      status: data.status
    })
    return response.data.data.conversation
  }
)

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    },
    clearSelectedConversation: (state) => {
      state.selectedConversation = null
    },
    updateConversationInList: (state, action: PayloadAction<Conversation>) => {
      const index = state.conversations.findIndex(c => c.id === action.payload.id)
      if (index !== -1) {
        state.conversations[index] = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false
        state.conversations = action.payload.conversations
        state.pagination.total = action.payload.pagination.total
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch conversations'
      })

    // Fetch conversation details
    builder
      .addCase(fetchConversationDetails.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchConversationDetails.fulfilled, (state, action) => {
        state.isLoading = false
        state.selectedConversation = action.payload
      })
      .addCase(fetchConversationDetails.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch conversation details'
      })

    // Upload chat files
    builder
      .addCase(uploadChatFiles.pending, (state) => {
        state.isUploading = true
        state.error = null
      })
      .addCase(uploadChatFiles.fulfilled, (state, action) => {
        state.isUploading = false
        state.uploads = [...action.payload.results, ...state.uploads]
      })
      .addCase(uploadChatFiles.rejected, (state, action) => {
        state.isUploading = false
        state.error = action.error.message || 'Failed to upload files'
      })

    // Get upload history
    builder
      .addCase(getUploadHistory.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getUploadHistory.fulfilled, (state, action) => {
        state.isLoading = false
        state.uploads = action.payload.uploads
      })
      .addCase(getUploadHistory.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch upload history'
      })

    // Update conversation status
    builder
      .addCase(updateConversationStatus.pending, (state) => {
        state.error = null
      })
      .addCase(updateConversationStatus.fulfilled, (state, action) => {
        const updatedConversation = action.payload

        // Update in conversations list
        const index = state.conversations.findIndex(c => c.id === updatedConversation.id)
        if (index !== -1) {
          state.conversations[index] = updatedConversation
        }

        // Update selected conversation if it's the same one
        if (state.selectedConversation?.id === updatedConversation.id) {
          state.selectedConversation = updatedConversation
        }
      })
      .addCase(updateConversationStatus.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update conversation status'
      })
  },
})

export const {
  setFilters,
  setPagination,
  clearError,
  clearSelectedConversation,
  updateConversationInList,
} = conversationsSlice.actions

export default conversationsSlice.reducer