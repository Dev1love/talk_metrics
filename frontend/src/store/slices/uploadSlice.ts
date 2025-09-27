import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  uploadedFiles: Array<{
    id: string
    filename: string
    type: 'whatsapp' | 'telegram'
    status: 'success' | 'error'
    conversations_processed?: number
    messages_processed?: number
    uploaded_at: string
  }>
}

const initialState: UploadState = {
  isUploading: false,
  progress: 0,
  error: null,
  uploadedFiles: []
}

// Async thunk for uploading chat file
export const uploadChatFile = createAsyncThunk(
  'upload/uploadChatFile',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      return await response.json()
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for getting upload history
export const fetchUploadHistory = createAsyncThunk(
  'upload/fetchUploadHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/v1/upload/history')

      if (!response.ok) {
        throw new Error('Failed to fetch upload history')
      }

      return await response.json()
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    resetUpload: (state) => {
      state.isUploading = false
      state.progress = 0
      state.error = null
    },
    setProgress: (state, action) => {
      state.progress = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Upload chat file
      .addCase(uploadChatFile.pending, (state) => {
        state.isUploading = true
        state.progress = 0
        state.error = null
      })
      .addCase(uploadChatFile.fulfilled, (state, action) => {
        state.isUploading = false
        state.progress = 100
        state.error = null

        // Add to uploaded files list
        const fileData = {
          id: action.payload.upload_id || Date.now().toString(),
          filename: action.payload.filename || 'Unknown file',
          type: action.payload.type || 'whatsapp',
          status: 'success' as const,
          conversations_processed: action.payload.conversations_processed,
          messages_processed: action.payload.messages_processed,
          uploaded_at: new Date().toISOString()
        }

        state.uploadedFiles.unshift(fileData)
      })
      .addCase(uploadChatFile.rejected, (state, action) => {
        state.isUploading = false
        state.progress = 0
        state.error = action.payload as string
      })

      // Fetch upload history
      .addCase(fetchUploadHistory.pending, (state) => {
        state.error = null
      })
      .addCase(fetchUploadHistory.fulfilled, (state, action) => {
        state.uploadedFiles = action.payload.files || []
        state.error = null
      })
      .addCase(fetchUploadHistory.rejected, (state, action) => {
        state.error = action.payload as string
      })
  }
})

export const { clearError, resetUpload, setProgress } = uploadSlice.actions
export default uploadSlice.reducer