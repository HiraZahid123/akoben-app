'use client'

import { useEffect } from 'react'
import './globals.css'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[global error]', error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              The application hit an unexpected error and couldn't recover. Try reloading the page.
            </p>
            {error?.digest && (
              <p className="mt-3 text-xs text-gray-300 font-mono">Reference: {error.digest}</p>
            )}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={unstable_retry}
                className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
