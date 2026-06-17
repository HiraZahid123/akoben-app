import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format GHS currency
export function formatGHS(amount: number | null | undefined): string {
  if (amount == null) return '₵0.00'
  return `₵${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Format Ghana phone number
export function formatGhanaPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  // Ensure +233 prefix
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('233')) return `+${digits}`
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`
  return `+233${digits}`
}

// Ghana VAT calculation (15%)
export const GHANA_VAT_RATE = 15

export function calculateVAT(subtotal: number, vatRate = GHANA_VAT_RATE): number {
  return Math.round((subtotal * vatRate / 100) * 100) / 100
}

// Order status badge colors
export const ORDER_STATUS_COLORS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-700',
  quote:     'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  active:    'bg-emerald-100 text-emerald-700',
  returned:  'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  overdue:   'bg-orange-100 text-orange-700',
}

// Payment method display labels
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:               'Cash',
  card:               'Card',
  bank_transfer:      'Bank Transfer',
  mtn_mobile_money:   'MTN Mobile Money',
  vodafone_cash:      'Vodafone Cash',
  airteltigo_money:   'AirtelTigo Money',
  cheque:             'Cheque',
  invoice_net30:      'Invoice Net 30',
  invoice_net60:      'Invoice Net 60',
}

// Ghana regions list
export const GHANA_REGIONS = [
  'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern',
  'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah',
  'Upper East', 'Upper West', 'Volta', 'Western', 'Western North',
] as const

// Format date for display
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GH', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GH', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
