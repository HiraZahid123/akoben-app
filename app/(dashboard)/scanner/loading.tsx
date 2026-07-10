import { SkeletonPageHeader, SkeletonCard } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <div className="p-6 max-w-2xl">
        <SkeletonCard lines={5} />
      </div>
    </div>
  )
}
