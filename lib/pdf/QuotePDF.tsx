import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { STANDARD_PAYMENT_TERMS_NOTICE } from '@/lib/utils'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 40, color: '#1f2937' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  logo: { width: 80, height: 40, objectFit: 'contain' },
  logoPlaceholder: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#2563eb' },
  businessInfo: { textAlign: 'right', fontSize: 9, color: '#6b7280', lineHeight: 1.5 },
  title: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 4 },
  quoteNumber: { fontSize: 12, color: '#6b7280', marginBottom: 24 },
  twoCol: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  billTo: { flex: 1 },
  quoteMeta: { flex: 1, textAlign: 'right' },
  label: { fontSize: 8, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  value: { fontSize: 10, color: '#1f2937', marginBottom: 2 },
  bold: { fontFamily: 'Helvetica-Bold' },
  table: { marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '8 10', borderRadius: 4 },
  tableRow: { flexDirection: 'row', padding: '7 10', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  colItem: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colDays: { flex: 1, textAlign: 'center' },
  colRate: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  headerText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#6b7280' },
  totals: { alignItems: 'flex-end', marginTop: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, marginBottom: 4 },
  totalLabel: { color: '#6b7280' },
  totalValue: { textAlign: 'right' },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', width: 200, borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 6, marginTop: 4 },
  grandLabel: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
  grandValue: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
  termsBox: { marginTop: 24, backgroundColor: '#eff6ff', borderRadius: 6, padding: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  termsText: { fontSize: 9, color: '#1e40af', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 32, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: '#e5e7eb', paddingTop: 10, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
})

interface Props {
  quote: any
  quoteItems: any[]
  customer: any
  business: any
}

function ghsFormat(n: number) {
  return `GHS ${(n ?? 0).toFixed(2)}`
}

export default function QuotePDF({ quote, quoteItems, customer, business }: Props) {
  const discountAmount = quote.subtotal && quote.discount_pct ? (quote.subtotal * quote.discount_pct / 100) : 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {business?.logo_url ? (
              <Image src={business.logo_url} style={styles.logo} />
            ) : (
              <Text style={styles.logoPlaceholder}>{business?.business_name ?? 'Akoben Event Rentals'}</Text>
            )}
            <Text style={[styles.value, { marginTop: 6, fontSize: 9, color: '#6b7280' }]}>
              {business?.city ?? 'Cape Coast'}, Ghana
            </Text>
          </View>
          <View style={styles.businessInfo}>
            <Text>{business?.business_name ?? 'Akoben Event Rentals'}</Text>
            {business?.email && <Text>{business.email}</Text>}
            {business?.phone && <Text>{business.phone}</Text>}
            {business?.address && <Text>{business.address}</Text>}
            {business?.gps_address && <Text>GPS: {business.gps_address}</Text>}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>QUOTE</Text>
        <Text style={styles.quoteNumber}>{quote.quote_number}</Text>

        {/* Bill To / Quote Meta */}
        <View style={styles.twoCol}>
          <View style={styles.billTo}>
            <Text style={styles.label}>Prepared For</Text>
            <Text style={[styles.value, styles.bold]}>{customer?.full_name}</Text>
            {customer?.company_name && <Text style={styles.value}>{customer.company_name}</Text>}
            {customer?.email && <Text style={styles.value}>{customer.email}</Text>}
            {customer?.phone && <Text style={styles.value}>{customer.phone}</Text>}
          </View>
          <View style={styles.quoteMeta}>
            <Text style={styles.label}>Quote Date</Text>
            <Text style={styles.value}>{quote.created_at ? new Date(quote.created_at).toLocaleDateString('en-GH') : '—'}</Text>
            <Text style={[styles.label, { marginTop: 8 }]}>Expires</Text>
            <Text style={[styles.value, styles.bold]}>{quote.expires_at ? new Date(quote.expires_at).toLocaleDateString('en-GH') : '—'}</Text>
            {quote.event_name && <>
              <Text style={[styles.label, { marginTop: 8 }]}>Event</Text>
              <Text style={styles.value}>{quote.event_name}</Text>
            </>}
          </View>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colItem]}>Description</Text>
            <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
            <Text style={[styles.headerText, styles.colDays]}>Days</Text>
            <Text style={[styles.headerText, styles.colRate]}>Rate/Day</Text>
            <Text style={[styles.headerText, styles.colTotal]}>Total</Text>
          </View>
          {quoteItems.map((qi: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colItem}>{qi.inventory_items?.name ?? qi.item_id}</Text>
              <Text style={styles.colQty}>{qi.quantity}</Text>
              <Text style={styles.colDays}>{qi.rental_days}</Text>
              <Text style={styles.colRate}>{ghsFormat(qi.unit_rate)}</Text>
              <Text style={[styles.colTotal, styles.bold]}>{ghsFormat(qi.line_total ?? qi.unit_rate * qi.quantity * qi.rental_days)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{ghsFormat(quote.subtotal ?? 0)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Discount ({quote.discount_pct}%)</Text>
              <Text style={[styles.totalValue, { color: '#16a34a' }]}>−{ghsFormat(discountAmount)}</Text>
            </View>
          )}
          {(quote.delivery_fee ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery</Text>
              <Text style={styles.totalValue}>{ghsFormat(quote.delivery_fee)}</Text>
            </View>
          )}
          {(quote.setup_fee ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Drop Off / Breakdown Fee</Text>
              <Text style={styles.totalValue}>{ghsFormat(quote.setup_fee)}</Text>
            </View>
          )}
          {(quote.tax_amount ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>VAT ({quote.tax_rate ?? 0}%)</Text>
              <Text style={styles.totalValue}>{ghsFormat(quote.tax_amount)}</Text>
            </View>
          )}
          {(quote.security_deposit ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Security Deposit</Text>
              <Text style={styles.totalValue}>{ghsFormat(quote.security_deposit)}</Text>
            </View>
          )}
          {(quote.additional_charges_amount ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{quote.additional_charges_description || 'Additional Charges'}</Text>
              <Text style={styles.totalValue}>{ghsFormat(quote.additional_charges_amount)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{ghsFormat(quote.total ?? 0)}</Text>
          </View>
        </View>

        {/* Payment terms notice */}
        <View style={styles.termsBox}>
          <Text style={styles.termsText}>{STANDARD_PAYMENT_TERMS_NOTICE}</Text>
        </View>

        {/* Footer */}
        {business?.invoice_footer && (
          <View style={styles.footer}>
            <Text>{business.invoice_footer}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
