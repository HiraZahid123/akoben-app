import type { SupabaseClient } from '@supabase/supabase-js'

const NON_RESERVING_STATUSES = ['cancelled', 'returned']

interface AvailabilityResult {
  total: number
  reservedByOthers: number
  availableForRange: number
}

/**
 * Computes item availability for a specific date range by checking overlapping
 * bookings across all other active orders — not just today's static stock count.
 */
export async function computeDateRangeAvailability(
  supabase: SupabaseClient,
  params: { excludeOrderId: string | null; pickupDate: string; returnDate: string; itemIds: string[] }
): Promise<Record<string, AvailabilityResult>> {
  const { excludeOrderId, pickupDate, returnDate, itemIds } = params
  const result: Record<string, AvailabilityResult> = {}
  if (itemIds.length === 0) return result

  const { data: invItems } = await supabase
    .from('inventory_items')
    .select('id, quantity_total')
    .in('id', itemIds)

  for (const it of invItems ?? []) {
    result[it.id] = { total: it.quantity_total ?? 0, reservedByOthers: 0, availableForRange: it.quantity_total ?? 0 }
  }

  // Fetch all other active orders (excluding cancelled/returned/self)
  let query = supabase
    .from('orders')
    .select('id, pickup_date, return_date, status')
    .not('status', 'in', `(${NON_RESERVING_STATUSES.join(',')})`)

  if (excludeOrderId) query = query.neq('id', excludeOrderId)

  const { data: otherOrders } = await query

  const pickup = new Date(pickupDate).getTime()
  const ret = new Date(returnDate).getTime()

  const overlappingIds = (otherOrders ?? [])
    .filter(o => {
      if (!o.pickup_date || !o.return_date) return false
      const oPickup = new Date(o.pickup_date).getTime()
      const oRet = new Date(o.return_date).getTime()
      return oPickup <= ret && oRet >= pickup
    })
    .map(o => o.id)

  if (overlappingIds.length > 0) {
    const { data: overlappingItems } = await supabase
      .from('order_items')
      .select('item_id, quantity')
      .in('order_id', overlappingIds)
      .in('item_id', itemIds)

    for (const oi of overlappingItems ?? []) {
      if (!result[oi.item_id]) continue
      result[oi.item_id].reservedByOthers += oi.quantity ?? 0
    }
  }

  for (const id of Object.keys(result)) {
    result[id].availableForRange = result[id].total - result[id].reservedByOthers
  }

  return result
}
