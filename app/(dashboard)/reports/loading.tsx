import { SkeletonPageHeader, SkeletonStatCards, SkeletonTable } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <div className="p-6">
        <SkeletonStatCards count={4} />
        <SkeletonTable rows={8} cols={5} />
      </div>
    </div>
  )
}
