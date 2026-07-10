import { SkeletonPageHeader, SkeletonDetailPage } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <SkeletonDetailPage sidebarCards={3} />
    </div>
  )
}
