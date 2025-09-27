import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'

import { RootState } from '../../store'
import { setSidebarCollapsed } from '../../store/slices/uiSlice'

// Components
import Sidebar from './Sidebar'
import Header from './Header'
import LoadingSpinner from '../common/LoadingSpinner'

const DashboardLayout: React.FC = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const { sidebarCollapsed, loading } = useSelector((state: RootState) => state.ui)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // Auto-collapse sidebar on mobile
      if (mobile && !sidebarCollapsed) {
        dispatch(setSidebarCollapsed(true))
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [dispatch, sidebarCollapsed])

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      dispatch(setSidebarCollapsed(true))
    }
  }, [location.pathname, isMobile, dispatch])

  return (
    <div className="flex h-screen bg-transparent">
      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
          ${sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'}
          md:relative md:translate-x-0
          ${sidebarCollapsed ? 'md:w-16' : 'md:w-64'}
        `}
      >
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => dispatch(setSidebarCollapsed(true))}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {loading.global ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="animate-fade-in">
                <Outlet />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout