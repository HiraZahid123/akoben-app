export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <Skeleton className="w-11 h-11 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-5 py-3"><Skeleton className="h-3 w-16" /></th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-5 py-3"><Skeleton className="h-4 w-full max-w-[120px]" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonCard({ lines = 4 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-full" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonDetailPage({ sidebarCards = 3 }: { sidebarCards?: number }) {
  return (
    <div className="p-6 grid grid-cols-3 gap-6 max-w-6xl">
      <div className="col-span-2 space-y-5">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={3} />
      </div>
      <div className="space-y-4">
        {Array.from({ length: sidebarCards }).map((_, i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonPageHeader() {
  return (
    <div className="px-6 py-5 border-b border-gray-100 bg-white flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
  )
}
