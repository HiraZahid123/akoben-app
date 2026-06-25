'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'

interface Props {
  categories: string[]
  categoryLabels: Record<string, string>
}

export default function BackofficeUpload({ categories, categoryLabels }: Props) {
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ name: '', description: '', category: 'agreements' })
  const fileRef = useRef<HTMLInputElement>(null)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { toastError('Please select a file'); return }
    setLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${form.category}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

      const { error: uploadErr } = await supabase.storage
        .from('backoffice-docs')
        .upload(filePath, file, { contentType: file.type, upsert: false })

      if (uploadErr) throw uploadErr

      const { error: dbErr } = await supabase.from('backoffice_documents').insert({
        name: form.name || file.name,
        description: form.description || null,
        category: form.category,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })

      if (dbErr) throw dbErr

      success('Document uploaded successfully')
      setOpen(false)
      setFile(null)
      setForm({ name: '', description: '', category: 'agreements' })
      router.refresh()
    } catch (err: any) {
      toastError(err.message ?? 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
        ⬆ Upload Document
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Upload Document</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {/* File picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl mb-1">📁</p>
                      <p className="text-sm text-gray-500">Click to select a file</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, images supported</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setFile(f)
                      if (!form.name) set('name', f.name.replace(/\.[^.]+$/, ''))
                    }
                  }} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                <input required value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Purchase Agreement 2025"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {categories.map(c => (
                    <option key={c} value={c}>{categoryLabels[c]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={2} placeholder="Brief description of this document..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading || !file}
                  className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm">
                  {loading ? 'Uploading...' : '⬆ Upload'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
