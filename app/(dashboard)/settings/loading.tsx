import { SkeletonPageHeader, Skeleton } from '@/components/ui/Skeleton'

function SkeletonSection({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      <SkeletonPageHeader />
      <div className="flex-1 overflow-auto p-6 space-y-8">
        <SkeletonSection rows={6} />
        <SkeletonSection rows={2} />
        <SkeletonSection rows={2} />
      </div>
    </div>
  )
}
