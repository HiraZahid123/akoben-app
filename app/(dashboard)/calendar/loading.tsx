import { SkeletonPageHeader, Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
