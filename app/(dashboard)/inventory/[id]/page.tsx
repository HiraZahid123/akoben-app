import { createServerSupabaseClient } from '@/lib/supabase-server'
import PageHeader from '@/components/layout/PageHeader'
import Badge from '@/components/ui/Badge'
import UnitsTable from './UnitsTable'
import BundleManager from './BundleManager'
import { formatGHS } from '@/lib/utils'
import { notFound } from 'next/navigation'

const CONDITION_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  excellent: 'success', good: 'info', fair: 'warning',
  maintenance: 'danger', retired: 'default',
}

export default async function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const [r1, r2] = await Promise.all([
    supabase.from('inventory_items').select('*, inventory_categories(name)').eq('id', id).single(),
    supabase.from('inventory_units').select('*').eq('item_id', id).order('unit_number'),
  ])

  if (!r1.data) notFound()
  const item = r1.data as any
  const units = (r2.data ?? []) as any[]

  // Physical stock on the shelf today — quantity_total minus units currently checked out.
  // Ignores future date-range reservations (those only affect the Orders tab).
  const outCount = units.filter(u => u.status === 'out').length
  const physicalAvailable = units.length > 0 ? item.quantity_total - outCount : item.quantity_total

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
          <UnitsTable units={units} itemName={item.name} itemId={id} />
          <BundleManager itemId={id} itemName={item.name} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Image */}
          {item.image_url && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
            </div>
          )}

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
              {item.replacement_cost && (
                <div className="flex justify-between text-gray-700 pt-2 border-t border-gray-100">
                  <span className="text-gray-400">Replacement Cost</span>
                  <span>{formatGHS(item.replacement_cost)}</span>
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
                <span className="font-medium">{physicalAvailable}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="text-gray-400">Condition</span>
                <Badge variant={CONDITION_VARIANTS[item.condition] ?? 'default'} className="capitalize text-xs">{item.condition}</Badge>
              </div>
            </div>
          </div>

          {(item.location || item.weight_kg || item.dimensions || item.sku) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-gray-800">Details</h3>
              <div className="text-sm space-y-2 text-gray-600">
                {item.sku && <div><span className="text-gray-400">SKU: </span>{item.sku}</div>}
                {item.location && <div><span className="text-gray-400">Location: </span><span className="font-medium text-gray-800">{item.location}</span></div>}
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
