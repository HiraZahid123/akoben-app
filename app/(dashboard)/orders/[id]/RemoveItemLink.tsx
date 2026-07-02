'use client'

export default function RemoveItemLink({ orderId, itemId }: { orderId: string; itemId: string }) {
  return (
    <a
      href={`/api/orders/remove-item?orderId=${orderId}&itemId=${itemId}`}
      className="text-xs text-red-500 hover:text-red-700 underline"
      onClick={e => { if (!confirm('Remove this item from the order?')) e.preventDefault() }}>
      Remove item
    </a>
  )
}
