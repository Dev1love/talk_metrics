import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import { RootState } from './store'
import { setCurrentPage } from './store/slices/uiSlice'

// Layout
import DashboardLayout from './components/layout/DashboardLayout'

// Pages
import DashboardPage from './pages/DashboardPage'
import ConversationsPage from './pages/ConversationsPage'
import ConversationDetailsPage from './pages/ConversationDetailsPage'
import InsightsPage from './pages/InsightsPage'
import UploadPage from './pages/UploadPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import ExportPage from './pages/ExportPage'

// Error boundary component
import ErrorBoundary from './components/common/ErrorBoundary'

// Loading component
import LoadingSpinner from './components/common/LoadingSpinner'

function App() {
  const dispatch = useDispatch()
  const { loading } = useSelector((state: RootState) => state.ui)

  useEffect(() => {
    // Set up global error handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50/30 to-purple-50/30 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-success-400/20 to-warning-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          {loading.global && <LoadingSpinner overlay />}

        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={<DashboardPage />}
              loader={() => dispatch(setCurrentPage('dashboard'))}
            />
            <Route
              path="conversations"
              element={<ConversationsPage />}
              loader={() => dispatch(setCurrentPage('conversations'))}
            />
            <Route
              path="conversations/:id"
              element={<ConversationDetailsPage />}
              loader={() => dispatch(setCurrentPage('conversations'))}
            />
            <Route
              path="insights"
              element={<InsightsPage />}
              loader={() => dispatch(setCurrentPage('insights'))}
            />
            <Route
              path="upload"
              element={<UploadPage />}
              loader={() => dispatch(setCurrentPage('upload'))}
            />
            <Route
              path="analytics"
              element={<AnalyticsPage />}
              loader={() => dispatch(setCurrentPage('analytics'))}
            />
            <Route
              path="settings"
              element={<SettingsPage />}
              loader={() => dispatch(setCurrentPage('settings'))}
            />
            <Route
              path="export"
              element={<ExportPage />}
              loader={() => dispatch(setCurrentPage('export'))}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App