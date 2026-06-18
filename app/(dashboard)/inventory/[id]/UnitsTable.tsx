'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import BarcodePrintButton from '@/components/inventory/BarcodePrintButton'
import { useToast } from '@/components/ui/ToastProvider'

interface Unit {
  id: string
  unit_number: string | null
  barcode: string | null
  serial_number: string | null
  condition: string
  status: string
}

interface Props {
  units: Unit[]
  itemName: string
  itemId: string
}

const CONDITION_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  excellent: 'success', good: 'info', fair: 'warning',
  maintenance: 'danger', retired: 'default',
}
const STATUS_VARIANTS: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  available: 'success', out: 'danger', maintenance: 'warning', retired: 'default',
}

function generateBarcode(itemId: string, unitId: string) {
  const short = itemId.replace(/-/g, '').slice(0, 6).toUpperCase()
  const uShort = unitId.replace(/-/g, '').slice(0, 6).toUpperCase()
  return `AKB-${short}-${uShort}`
}

export default function UnitsTable({ units: initialUnits, itemName, itemId }: Props) {
  const [units, setUnits] = useState(initialUnits)
  const [adding, setAdding] = useState(false)
  const [newUnitNum, setNewUnitNum] = useState('')
  const [saving, setSaving] = useState(false)
  const { success, error: toastError } = useToast()

  async function handleGenerateBarcode(unit: Unit) {
    const bc = generateBarcode(itemId, unit.id)
    const { error } = await supabase.from('inventory_units').update({ barcode: bc }).eq('id', unit.id)
    if (error) { toastError('Failed to assign barcode'); return }
    setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, barcode: bc } : u))
    success('Barcode assigned — ready to print')
  }

  async function handleAddUnit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const bc = `AKB-${itemId.replace(/-/g, '').slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    const { data, error } = await supabase
      .from('inventory_units')
      .insert({ item_id: itemId, unit_number: newUnitNum || null, barcode: bc, condition: 'good', status: 'available' })
      .select()
      .single()
    setSaving(false)
    if (error) { toastError(error.message); return }
    setUnits(prev => [...prev, data as Unit])
    setNewUnitNum('')
    setAdding(false)
    success('Unit added with barcode')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-semibold text-gray-800">Units ({units.length})</span>
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-xs text-gray-500">
            <span className="text-green-600 font-medium">{units.filter(u => u.status === 'available').length} available</span>
            <span className="text-red-600 font-medium">{units.filter(u => u.status === 'out').length} out</span>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Unit
          </button>
        </div>
      </div>

      {units.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left">
              <th className="px-4 py-3 font-medium text-gray-600">Unit</th>
              <th className="px-4 py-3 font-medium text-gray-600">Barcode</th>
              <th className="px-4 py-3 font-medium text-gray-600">Serial No.</th>
              <th className="px-4 py-3 font-medium text-gray-600">Condition</th>
              <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {units.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.unit_number ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.barcode ?? <span className="text-gray-300 italic">none</span>}</td>
                <td className="px-4 py-3 text-gray-500">{u.serial_number ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={CONDITION_VARIANTS[u.condition] ?? 'default'} className="capitalize text-xs">{u.condition}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANTS[u.status] ?? 'default'} className="capitalize text-xs">{u.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  {u.barcode ? (
                    <BarcodePrintButton barcode={u.barcode} label={itemName} unitNumber={u.unit_number} />
                  ) : (
                    <button
                      onClick={() => handleGenerateBarcode(u)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Generate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="px-5 py-8 text-sm text-gray-400 text-center">
          No individual units tracked. Click "+ Add Unit" to create trackable units with barcodes.
        </p>
      )}

      {/* Add unit inline form */}
      {adding && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <form onSubmit={handleAddUnit} className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Unit number (e.g. Unit-01) — optional"
              value={newUnitNum}
              onChange={e => setNewUnitNum(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Adding...' : 'Add & Generate Barcode'}
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">A barcode will be auto-generated. You can print the label immediately after.</p>
        </div>
      )}
    </div>
  )
}
