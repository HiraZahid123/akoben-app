import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import { formatDateTime } from '@/lib/utils'
import BackofficeUpload from './BackofficeUpload'
import BackofficeDelete from './BackofficeDelete'
import {
  Handshake, FileText, ClipboardList, File, ScrollText, Folder,
  FolderOpen, Download, FileText as FileGeneric, FileImage,
  type LucideIcon,
} from 'lucide-react'

const CATEGORIES = ['agreements', 'contracts', 'forms', 'templates', 'policies', 'other']

const CATEGORY_LABELS: Record<string, string> = {
  agreements: 'Agreements',
  contracts:  'Contracts',
  forms:      'Forms',
  templates:  'Templates',
  policies:   'Policies',
  other:      'Other',
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  agreements: Handshake,
  contracts:  FileText,
  forms:      ClipboardList,
  templates:  File,
  policies:   ScrollText,
  other:      Folder,
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function BackOfficePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const sp = await searchParams
  const activeCategory = sp.category ?? 'all'
  const supabase = await createServerSupabaseClient()

  const query = supabase
    .from('backoffice_documents')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: docs } = activeCategory === 'all'
    ? await query
    : await query.eq('category', activeCategory)

  const { data: allDocs } = await supabase.from('backoffice_documents').select('category')
  const countByCategory: Record<string, number> = { all: allDocs?.length ?? 0 }
  for (const doc of allDocs ?? []) {
    countByCategory[doc.category] = (countByCategory[doc.category] ?? 0) + 1
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Back Office"
        subtitle="Documents, agreements, and templates"
        action={<BackofficeUpload categories={CATEGORIES} categoryLabels={CATEGORY_LABELS} />}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-6 max-w-6xl">
          {/* Sidebar categories */}
          <div className="w-48 shrink-0 space-y-1">
            <a href="/backoffice"
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === 'all' ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
              <span className="flex items-center gap-2"><FolderOpen size={15} /> All Documents</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === 'all' ? 'bg-white/20' : 'bg-gray-100'}`}>{countByCategory.all ?? 0}</span>
            </a>
            {CATEGORIES.map(cat => {
              const CatIcon = CATEGORY_ICONS[cat]
              return (
                <a key={cat} href={`/backoffice?category=${cat}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeCategory === cat ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <span className="flex items-center gap-2"><CatIcon size={15} /> {CATEGORY_LABELS[cat]}</span>
                  {(countByCategory[cat] ?? 0) > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === cat ? 'bg-white/20' : 'bg-gray-100'}`}>{countByCategory[cat]}</span>
                  )}
                </a>
              )
            })}
          </div>

          {/* Document list */}
          <div className="flex-1">
            {(docs ?? []).length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <Folder size={40} className="mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
                <p className="text-gray-500 font-medium">No documents yet</p>
                <p className="text-gray-400 text-sm mt-1">Click "Upload Document" to add your first file</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left">
                      <th className="px-5 py-3 font-medium text-gray-600">Document</th>
                      <th className="px-5 py-3 font-medium text-gray-600">Category</th>
                      <th className="px-5 py-3 font-medium text-gray-600">Size</th>
                      <th className="px-5 py-3 font-medium text-gray-600">Uploaded</th>
                      <th className="px-5 py-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {docs?.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {getFileIcon(doc.mime_type)}
                            <div>
                              <div className="font-medium text-gray-900">{doc.name}</div>
                              {doc.description && <div className="text-xs text-gray-400">{doc.description}</div>}
                              <div className="text-xs text-gray-300">{doc.file_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium capitalize">
                            {CATEGORY_LABELS[doc.category] ?? doc.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{formatFileSize(doc.file_size)}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{formatDateTime(doc.created_at)}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <BackofficeDownload filePath={doc.file_path} fileName={doc.file_name} />
                            <BackofficeDelete docId={doc.id} filePath={doc.file_path} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getFileIcon(mimeType: string | null) {
  const cls = "text-gray-400"
  if (mimeType?.includes('image')) return <FileImage size={20} className={cls} />
  return <FileGeneric size={20} className={cls} />
}

function BackofficeDownload({ filePath, fileName }: { filePath: string; fileName: string }) {
  return (
    <a href={`/api/backoffice/download?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`}
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors">
      <Download size={12} /> Download
    </a>
  )
}
