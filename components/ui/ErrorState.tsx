'use client'

import { AlertTriangle, RotateCw, Home } from 'lucide-react'

export default function ErrorState({
  error,
  onRetry,
  fullScreen = false,
}: {
  error?: Error & { digest?: string }
  onRetry?: () => void
  fullScreen?: boolean
}) {
  return (
    <div className={`flex items-center justify-center px-6 ${fullScreen ? 'min-h-screen' : 'flex-1 h-full py-24'}`}>
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={26} className="text-red-500" strokeWidth={2} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          An unexpected error occurred while loading this page. It's been logged — try again, or head back to the dashboard.
        </p>
        {error?.digest && (
          <p className="mt-3 text-xs text-gray-300 font-mono">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <RotateCw size={14} /> Try Again
            </button>
          )}
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Home size={14} /> Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
