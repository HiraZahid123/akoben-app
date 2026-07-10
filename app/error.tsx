'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/ui/ErrorState'

export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[root error]', error)
  }, [error])

  return <ErrorState error={error} onRetry={unstable_retry} fullScreen />
}
