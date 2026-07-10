import { SkeletonPageHeader, SkeletonTable } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <div className="p-6">
        <SkeletonTable rows={10} cols={6} />
      </div>
    </div>
  )
}
