import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import Badge from '@/components/ui/Badge'
import { formatGHS, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'

const CONDITION_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  excellent: 'success', good: 'info', fair: 'warning',
  maintenance: 'danger', retired: 'default',
}

const STATUS_VARIANTS: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  available: 'success', out: 'danger', maintenance: 'warning', retired: 'default',
}

export default async function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [{ data: item }, { data: units }] = await Promise.all([
    supabase.from('inventory_items').select('*, inventory_categories(name)').eq('id', id).single(),
    supabase.from('inventory_units').select('*').eq('item_id', id).order('unit_number'),
  ])

  if (!item) notFound()

  const available = units?.filter(u => u.status === 'available').length ?? 0
  const out = units?.filter(u => u.status === 'out').length ?? 0

  return (
    <div>
      <PageHeader
        title={item.name}
        subtitle={(item.inventory_categories as any)?.name ?? 'Uncategorised'}
        action={
          <div className="flex gap-2">
            <a href={`/inventory/${id}/edit`}
              className="px-3 py-1.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Edit Item
            </a>
            <a href="/inventory/new"
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              + Add Item
            </a>
          </div>
        }
      />

      <div className="p-6 grid grid-cols-3 gap-6 max-w-6xl">
        <div className="col-span-2 space-y-5">

          {/* Units */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Units ({units?.length ?? 0})</span>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="text-green-600 font-medium">{available} available</span>
                <span className="text-red-600 font-medium">{out} out</span>
              </div>
            </div>
            {units && units.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Unit</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Barcode</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Serial No.</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Condition</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {units.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.unit_number ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.barcode ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{u.serial_number ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={CONDITION_VARIANTS[u.condition] ?? 'default'} className="capitalize text-xs">{u.condition}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANTS[u.status] ?? 'default'} className="capitalize text-xs">{u.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">
                No individual units tracked. Add units to enable barcode scanning.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Pricing (GHS)</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between text-gray-700">
                <span className="text-gray-400">Daily</span>
                <span className="font-medium">{formatGHS(item.rate_daily ?? 0)}</span>
              </div>
              {item.rate_weekly && (
                <div className="flex justify-between text-gray-700">
                  <span className="text-gray-400">Weekly</span>
                  <span className="font-medium">{formatGHS(item.rate_weekly)}</span>
                </div>
              )}
              {item.rate_monthly && (
                <div className="flex justify-between text-gray-700">
                  <span className="text-gray-400">Monthly</span>
                  <span className="font-medium">{formatGHS(item.rate_monthly)}</span>
                </div>
              )}
              {item.replacement_value && (
                <div className="flex justify-between text-gray-700 pt-2 border-t border-gray-100">
                  <span className="text-gray-400">Replacement Value</span>
                  <span>{formatGHS(item.replacement_value)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Stock</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between text-gray-700">
                <span className="text-gray-400">Total Qty</span>
                <span className="font-medium">{item.quantity_total ?? 0}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Available</span>
                <span className="font-medium">{item.quantity_available ?? 0}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="text-gray-400">Condition</span>
                <Badge variant={CONDITION_VARIANTS[item.condition] ?? 'default'} className="capitalize text-xs">{item.condition}</Badge>
              </div>
            </div>
          </div>

          {(item.weight_kg || item.dimensions || item.sku) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-gray-800">Details</h3>
              <div className="text-sm space-y-2 text-gray-600">
                {item.sku && <div><span className="text-gray-400">SKU: </span>{item.sku}</div>}
                {item.weight_kg && <div><span className="text-gray-400">Weight: </span>{item.weight_kg} kg</div>}
                {item.dimensions && <div><span className="text-gray-400">Dimensions: </span>{item.dimensions}</div>}
              </div>
            </div>
          )}

          {item.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {item.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
