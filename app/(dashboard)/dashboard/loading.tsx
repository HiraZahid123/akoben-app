import { SkeletonPageHeader, SkeletonStatCards, SkeletonTable, SkeletonCard } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <div className="p-6">
        <SkeletonStatCards count={4} />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <SkeletonTable rows={6} cols={4} />
          </div>
          <div className="space-y-4">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        </div>
      </div>
    </div>
  )
}
