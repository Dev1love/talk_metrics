import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type Theme = 'light' | 'dark' | 'auto'

export interface DateRange {
  start: Date | null
  end: Date | null
}

interface UIState {
  theme: Theme
  sidebarCollapsed: boolean
  currentPage: string
  dateRange: DateRange
  refreshInterval: number | null
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    timestamp: string
    read: boolean
  }>
  loading: {
    global: boolean
    metrics: boolean
    conversations: boolean
    insights: boolean
    ai: boolean
  }
}

const initialState: UIState = {
  theme: 'light',
  sidebarCollapsed: false,
  currentPage: 'dashboard',
  dateRange: {
    start: null,
    end: null,
  },
  refreshInterval: 30000, // 30 seconds
  notifications: [],
  loading: {
    global: false,
    metrics: false,
    conversations: false,
    insights: false,
    ai: false,
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload
    },
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.dateRange = action.payload
    },
    setRefreshInterval: (state, action: PayloadAction<number | null>) => {
      state.refreshInterval = action.payload
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp' | 'read'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      }
      state.notifications.unshift(notification)

      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification) {
        notification.read = true
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true
      })
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    setLoading: (state, action: PayloadAction<{ key: keyof UIState['loading']; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload
    },
  },
})

export const {
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setCurrentPage,
  setDateRange,
  setRefreshInterval,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearNotifications,
  setLoading,
  setGlobalLoading,
} = uiSlice.actions

export default uiSlice.reducer