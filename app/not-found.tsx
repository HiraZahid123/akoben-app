import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
          <FileQuestion size={26} className="text-blue-500" strokeWidth={2} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="mt-6">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Home size={14} /> Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
