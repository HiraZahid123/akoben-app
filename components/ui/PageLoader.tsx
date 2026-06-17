'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function PageLoader() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    setLoading(true)
    setWidth(30)
    const t1 = setTimeout(() => setWidth(70), 100)
    const t2 = setTimeout(() => setWidth(100), 400)
    const t3 = setTimeout(() => { setLoading(false); setWidth(0) }, 600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-blue-100">
      <div
        className="h-full bg-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
