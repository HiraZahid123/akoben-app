'use client'

export default function BackofficeDelete({ docId, filePath }: { docId: string; filePath: string }) {
  return (
    <a
      href={`/api/backoffice/delete?id=${docId}&path=${encodeURIComponent(filePath)}`}
      onClick={e => { if (!confirm('Delete this document?')) e.preventDefault() }}
      className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors">
      🗑 Delete
    </a>
  )
}
