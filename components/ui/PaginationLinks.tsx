import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PaginationLinks({
  page, pageCount, total, pageSize, basePath, extraParams = {},
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  basePath: string
  extraParams?: Record<string, string | undefined>
}) {
  if (pageCount <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  function hrefFor(p: number) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(extraParams)) {
      if (v) params.set(k, v)
    }
    params.set('page', String(p))
    return `${basePath}?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-400">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <a
          href={page > 1 ? hrefFor(page - 1) : undefined}
          aria-disabled={page <= 1}
          className={`p-1.5 rounded-lg border border-gray-200 text-gray-500 transition-colors ${page <= 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50'}`}
        >
          <ChevronLeft size={15} />
        </a>
        <span className="text-xs text-gray-600 font-medium px-2">
          Page {page} of {pageCount}
        </span>
        <a
          href={page < pageCount ? hrefFor(page + 1) : undefined}
          aria-disabled={page >= pageCount}
          className={`p-1.5 rounded-lg border border-gray-200 text-gray-500 transition-colors ${page >= pageCount ? 'opacity-40 pointer-events-none' : 'hover:bg-gray-50'}`}
        >
          <ChevronRight size={15} />
        </a>
      </div>
    </div>
  )
}
