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
      <div className="min-h-screen bg-secondary-50">
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
    </ErrorBoundary>
  )
}

export default App