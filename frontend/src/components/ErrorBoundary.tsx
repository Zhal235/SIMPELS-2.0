import React from 'react'
import { toast } from 'sonner'

type ErrorBoundaryState = { hasError: boolean; error?: any }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false, error: undefined }
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Global error captured by ErrorBoundary:', error, errorInfo)
    const message = String(error?.message || 'Terjadi error tak terduga.')
    toast.error(
      message,
      {
        description: 'Silakan muat ulang halaman atau hubungi admin jika masalah berlanjut.',
      }
    )
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <div className="rounded border border-red-200 bg-red-50 p-4">
            <h2 className="text-lg font-semibold text-red-700">Terjadi error tak terduga.</h2>
            <p className="text-sm text-red-600">Silakan coba muat ulang halaman.</p>
            <div className="mt-2">
              <button
                className="btn btn-primary"
                onClick={() => {
                  this.setState({ hasError: false, error: undefined })
                  window.location.reload()
                }}
              >
                Muat Ulang
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children as any
  }
}