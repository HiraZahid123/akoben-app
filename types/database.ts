export type GhanaRegion =
  | 'Ahafo' | 'Ashanti' | 'Bono' | 'Bono East' | 'Central' | 'Eastern'
  | 'Greater Accra' | 'North East' | 'Northern' | 'Oti' | 'Savannah'
  | 'Upper East' | 'Upper West' | 'Volta' | 'Western' | 'Western North'

export type CustomerType = 'individual' | 'corporate' | 'planner' | 'nonprofit'
export type OrderStatus = 'draft' | 'quote' | 'confirmed' | 'active' | 'returned' | 'cancelled' | 'overdue'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
export type InvoiceStatus = 'draft' | 'sent' | 'unpaid' | 'partial' | 'paid' | 'overdue' | 'void'
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'mtn_mobile_money' | 'vodafone_cash' | 'airteltigo_money' | 'cheque' | 'invoice_net30' | 'invoice_net60'
export type DeliveryMethod = 'customer_pickup' | 'delivery_only' | 'setup_teardown' | 'delivery_setup'
export type ItemCondition = 'excellent' | 'good' | 'fair' | 'maintenance' | 'retired'
export type ItemStatus = 'available' | 'out' | 'maintenance' | 'retired'
export type EventType = 'wedding' | 'traditional_wedding' | 'outdooring' | 'naming_ceremony' | 'funeral' | 'corporate' | 'birthday' | 'graduation' | 'fundraiser' | 'religious' | 'festival' | 'other'
export type PaymentType = 'deposit' | 'partial' | 'final' | 'refund' | 'damage_charge'
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'void'
export type CrmChannel = 'email' | 'sms' | 'whatsapp' | 'phone_call' | 'in_person' | 'other'
export type CrmDirection = 'outbound' | 'inbound'
export type ScanAction = 'checkout' | 'checkin' | 'lookup' | 'damage_report'

export interface Customer {
  id: string
  created_at: string
  updated_at: string
  full_name: string
  company_name: string | null
  customer_type: CustomerType
  email: string | null
  phone: string | null
  alt_phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  region: GhanaRegion | null
  gps_address: string | null
  country: string
  tax_exempt: boolean
  tax_id: string | null
  discount_pct: number
  notes: string | null
  blacklisted: boolean
  blacklist_reason: string | null
  referral_source: string | null
  total_orders: number
  total_spent: number
  last_order_date: string | null
}

export interface InventoryCategory {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string
  sort_order: number
}

export interface InventoryItem {
  id: string
  created_at: string
  updated_at: string
  name: string
  sku: string | null
  description: string | null
  category_id: string | null
  rate_daily: number
  rate_weekend: number | null
  rate_weekly: number | null
  replacement_cost: number | null
  quantity_total: number
  quantity_available: number
  condition: ItemCondition
  status: ItemStatus
  maintenance_notes: string | null
  last_maintained: string | null
  weight_kg: number | null
  dimensions: string | null
  setup_time_min: number
  notes: string | null
  image_url: string | null
  location: string | null
  is_active: boolean
}

export interface InventoryUnit {
  id: string
  created_at: string
  item_id: string
  unit_number: string | null
  barcode: string | null
  serial_number: string | null
  condition: ItemCondition
  status: ItemStatus
  notes: string | null
  purchase_date: string | null
  purchase_price: number | null
}

export interface Order {
  id: string
  created_at: string
  updated_at: string
  order_number: string
  customer_id: string
  event_name: string
  event_type: EventType
  event_date: string | null
  pickup_date: string
  return_date: string
  actual_return: string | null
  delivery_method: DeliveryMethod
  venue_name: string | null
  venue_address: string | null
  venue_city: string | null
  venue_region: GhanaRegion | null
  venue_gps: string | null
  delivery_fee: number
  setup_fee: number
  subtotal: number
  discount_pct: number
  discount_amount: number
  tax_rate: number
  tax_amount: number
  total: number
  deposit_required: number
  amount_paid: number
  balance_due: number
  status: OrderStatus
  payment_method: PaymentMethod | null
  internal_notes: string | null
  customer_notes: string | null
  damage_notes: string | null
  converted_from_quote: string | null
  created_by: string | null
  assigned_to: string | null
}

export interface OrderItem {
  id: string
  created_at: string
  order_id: string
  item_id: string
  quantity: number
  unit_rate: number
  rental_days: number
  line_total: number
  quantity_returned: number
  damage_notes: string | null
  damage_charge: number
  unit_ids: string[] | null
}

export interface Quote {
  id: string
  created_at: string
  updated_at: string
  quote_number: string
  customer_id: string
  event_name: string | null
  event_type: EventType
  event_date: string | null
  pickup_date: string | null
  return_date: string | null
  delivery_method: DeliveryMethod
  venue_address: string | null
  venue_region: GhanaRegion | null
  delivery_fee: number
  subtotal: number
  discount_pct: number
  tax_rate: number
  tax_amount: number
  total: number
  status: QuoteStatus
  expires_at: string | null
  notes: string | null
  converted_to_order: string | null
}

export interface Invoice {
  id: string
  created_at: string
  updated_at: string
  invoice_number: string
  order_id: string
  customer_id: string
  subtotal: number
  delivery_fee: number
  tax_amount: number
  total: number
  amount_paid: number
  balance_due: number
  status: InvoiceStatus
  due_date: string | null
  paid_at: string | null
  notes: string | null
  paystack_payment_link: string | null
  paystack_reference: string | null
  pdf_path: string | null
}

export interface Payment {
  id: string
  created_at: string
  order_id: string
  invoice_id: string | null
  customer_id: string
  amount: number
  payment_type: PaymentType
  method: PaymentMethod
  reference: string | null
  mobile_number: string | null
  notes: string | null
  recorded_by: string | null
}

export interface RentalContract {
  id: string
  created_at: string
  updated_at: string
  contract_number: string
  order_id: string
  customer_id: string
  status: ContractStatus
  contract_terms: string | null
  signed_at: string | null
  signed_by_name: string | null
  signature_ip: string | null
  pdf_path: string | null
  notes: string | null
}

export interface CrmCommunicationLog {
  id: string
  created_at: string
  customer_id: string
  order_id: string | null
  channel: CrmChannel
  direction: CrmDirection
  subject: string | null
  body: string | null
  email_message_id: string | null
  email_status: string | null
  sms_message_sid: string | null
  sms_status: string | null
  performed_by: string | null
  contact_name: string | null
}

export interface BarcodeScanLog {
  id: string
  scanned_at: string
  barcode: string
  unit_id: string | null
  item_id: string | null
  order_id: string | null
  action: ScanAction
  result: string | null
  notes: string | null
  scanned_by: string | null
}

export interface BusinessSettings {
  id: string
  updated_at: string
  business_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  region: GhanaRegion | null
  gps_address: string | null
  default_tax_rate: number
  default_deposit_pct: number
  default_rental_days: number
  overdue_grace_hours: number
  logo_url: string | null
  invoice_footer: string | null
  rental_terms: string | null
  currency: string
  currency_symbol: string
}

// View types
export interface OrderWithCustomer extends Order {
  customer_name: string
  company_name: string | null
  customer_email: string | null
  customer_phone: string | null
  customer_type: CustomerType
}

export interface InventoryAvailability extends InventoryItem {
  category_name: string | null
  category_slug: string | null
  category_icon: string | null
  quantity_out: number
}

// Database type map for Supabase client
export interface Database {
  public: {
    Tables: {
      customers: { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer> }
      inventory_categories: { Row: InventoryCategory; Insert: Partial<InventoryCategory>; Update: Partial<InventoryCategory> }
      inventory_items: { Row: InventoryItem; Insert: Partial<InventoryItem>; Update: Partial<InventoryItem> }
      inventory_units: { Row: InventoryUnit; Insert: Partial<InventoryUnit>; Update: Partial<InventoryUnit> }
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> }
      order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> }
      quotes: { Row: Quote; Insert: Partial<Quote>; Update: Partial<Quote> }
      quote_items: { Row: any; Insert: any; Update: any }
      invoices: { Row: Invoice; Insert: Partial<Invoice>; Update: Partial<Invoice> }
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> }
      rental_contracts: { Row: RentalContract; Insert: Partial<RentalContract>; Update: Partial<RentalContract> }
      crm_communication_log: { Row: CrmCommunicationLog; Insert: Partial<CrmCommunicationLog>; Update: Partial<CrmCommunicationLog> }
      barcode_scan_log: { Row: BarcodeScanLog; Insert: Partial<BarcodeScanLog>; Update: Partial<BarcodeScanLog> }
      business_settings: { Row: BusinessSettings; Insert: Partial<BusinessSettings>; Update: Partial<BusinessSettings> }
      damage_claims: { Row: any; Insert: any; Update: any }
      maintenance_logs: { Row: any; Insert: any; Update: any }
      activity_log: { Row: any; Insert: any; Update: any }
    }
    Views: {
      orders_with_customer: { Row: OrderWithCustomer }
      inventory_availability: { Row: InventoryAvailability }
      overdue_orders: { Row: any }
      revenue_by_month: { Row: any }
      revenue_by_category: { Row: any }
      top_rented_items: { Row: any }
    }
  }
}
