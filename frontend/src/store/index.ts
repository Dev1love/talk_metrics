import { configureStore } from '@reduxjs/toolkit'
import metricsSlice from './slices/metricsSlice'
import conversationsSlice from './slices/conversationsSlice'
import insightsSlice from './slices/insightsSlice'
import uiSlice from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    metrics: metricsSlice,
    conversations: conversationsSlice,
    insights: insightsSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch