import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-8 w-8 text-error-600 mr-3" />
              <h1 className="text-2xl font-bold text-secondary-900">
                Что-то пошло не так
              </h1>
            </div>

            <p className="text-secondary-600 mb-6">
              В приложении произошла ошибка. Мы уже знаем о проблеме и работаем над её устранением.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6">
                <details className="bg-secondary-100 rounded-md p-4">
                  <summary className="font-medium text-secondary-700 cursor-pointer">
                    Детали ошибки (только для разработки)
                  </summary>
                  <div className="mt-2 text-sm text-secondary-600">
                    <div className="font-mono bg-white p-2 rounded border text-xs overflow-auto max-h-40">
                      <div className="font-bold text-error-700">
                        {this.state.error.name}: {this.state.error.message}
                      </div>
                      <div className="mt-2 text-secondary-700">
                        {this.state.error.stack}
                      </div>
                      {this.state.errorInfo && (
                        <div className="mt-2 text-secondary-600">
                          {this.state.errorInfo.componentStack}
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Перезагрузить страницу
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center px-4 py-2 bg-secondary-100 text-secondary-700 rounded-md hover:bg-secondary-200 transition-colors duration-200"
              >
                <Home className="h-4 w-4 mr-2" />
                На главную
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary