import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { BOOKING_DEPOSIT_THRESHOLD_PCT } from '@/lib/utils'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 48, color: '#1f2937', lineHeight: 1.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 20 },
  logo: { width: 80, height: 40, objectFit: 'contain' },
  logoName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#2563eb' },
  businessRight: { textAlign: 'right', fontSize: 9, color: '#6b7280', lineHeight: 1.6 },
  docTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 4, color: '#1f2937' },
  docSubtitle: { fontSize: 10, textAlign: 'center', color: '#6b7280', marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginTop: 18, marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: '#d1d5db', paddingBottom: 3 },
  row: { flexDirection: 'row', marginBottom: 4 },
  field: { flex: 1 },
  label: { fontSize: 8, color: '#9ca3af', marginBottom: 1 },
  value: { fontSize: 10, color: '#1f2937' },
  bold: { fontFamily: 'Helvetica-Bold' },
  table: { marginTop: 8, marginBottom: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '6 8', borderRadius: 3 },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  colItem: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colDays: { flex: 1, textAlign: 'center' },
  colRate: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  headerText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6b7280' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 3 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#1f2937', marginTop: 4 },
  terms: { marginTop: 8, fontSize: 9, color: '#374151', lineHeight: 1.6 },
  signatureSection: { marginTop: 32, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBox: { flex: 1, marginHorizontal: 10 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#1f2937', marginBottom: 4, height: 30 },
  signatureLabel: { fontSize: 8, color: '#6b7280' },
  depositBox: { backgroundColor: '#eff6ff', borderRadius: 6, padding: 10, marginTop: 12, borderWidth: 1, borderColor: '#bfdbfe' },
})

interface Props {
  order: any
  orderItems: any[]
  customer: any
  business: any
}

function ghsFormat(n: number) {
  return `GHS ${(n ?? 0).toFixed(2)}`
}

const DEFAULT_TERMS = `1. BOOKING & DEPOSIT: ${BOOKING_DEPOSIT_THRESHOLD_PCT}% payment must be made before booking is confirmed. The booking is not confirmed until this payment is received.

2. PAYMENT: The remaining balance is due on or before the delivery/pickup date. Accepted payment methods: Cash, Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Money), Bank Transfer.

3. DAMAGE & LOSS: The client is responsible for any damage, loss, or theft of rental items during the rental period. The client agrees to pay replacement costs for any damaged or lost items.

4. RENTAL PERIOD: Items must be returned by the agreed return date and time. Late returns will incur additional charges at the daily rental rate.

5. CANCELLATION: Cancellations made less than 48 hours before the event may forfeit the deposit. Cancellations made more than 7 days in advance will receive a full deposit refund.

6. DELIVERY & SETUP: Where delivery and/or setup services are included, the client must ensure safe access to the venue. Additional charges may apply for locations outside Cape Coast.

7. CONDITION: Items will be delivered in good condition. The client must notify Akoben Event Rentals of any damage or defects within 2 hours of delivery.

8. GOVERNING LAW: This agreement is governed by the laws of the Republic of Ghana.`

export default function ContractPDF({ order, orderItems, customer, business }: Props) {
  const terms = business?.rental_terms || DEFAULT_TERMS
  const subtotal = orderItems.reduce((s: number, oi: any) => s + (oi.line_total ?? oi.unit_rate * oi.quantity * oi.rental_days), 0)
  const discount = subtotal * (order.discount_pct ?? 0) / 100
  const taxable = subtotal - discount + (order.delivery_fee ?? 0) + (order.setup_fee ?? 0)
  const tax = taxable * 0.15
  const securityDeposit = order.security_deposit ?? 0
  const additionalCharges = order.additional_charges_amount ?? 0
  const total = taxable + tax + securityDeposit + additionalCharges
  const deposit = total * BOOKING_DEPOSIT_THRESHOLD_PCT / 100

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {business?.logo_url ? (
              <Image src={business.logo_url} style={styles.logo} />
            ) : (
              <Text style={styles.logoName}>{business?.business_name ?? 'Akoben Event Rentals'}</Text>
            )}
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>
              {business?.city ?? 'Cape Coast'}, Ghana
            </Text>
          </View>
          <View style={styles.businessRight}>
            <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1f2937' }}>{business?.business_name ?? 'Akoben Event Rentals'}</Text>
            {business?.email && <Text>{business.email}</Text>}
            {business?.phone && <Text>{business.phone}</Text>}
            {business?.address && <Text>{business.address}</Text>}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.docTitle}>RENTAL AGREEMENT</Text>
        <Text style={styles.docSubtitle}>Order Reference: {order.order_number}</Text>

        {/* Parties */}
        <Text style={styles.sectionTitle}>1. PARTIES</Text>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Service Provider</Text>
            <Text style={[styles.value, styles.bold]}>{business?.business_name ?? 'Akoben Event Rentals'}</Text>
            <Text style={styles.value}>{business?.address ?? 'Cape Coast, Ghana'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Client</Text>
            <Text style={[styles.value, styles.bold]}>{customer?.full_name}</Text>
            {customer?.company_name && <Text style={styles.value}>{customer.company_name}</Text>}
            {customer?.phone && <Text style={styles.value}>{customer.phone}</Text>}
            {customer?.email && <Text style={styles.value}>{customer.email}</Text>}
          </View>
        </View>

        {/* Event details */}
        <Text style={styles.sectionTitle}>2. EVENT & RENTAL DETAILS</Text>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Event Name</Text>
            <Text style={styles.value}>{order.event_name}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Event Date</Text>
            <Text style={styles.value}>{order.event_date ? new Date(order.event_date).toLocaleDateString('en-GH') : '—'}</Text>
          </View>
        </View>
        <View style={[styles.row, { marginTop: 6 }]}>
          <View style={styles.field}>
            <Text style={styles.label}>Pickup / Delivery Date</Text>
            <Text style={styles.value}>{order.pickup_date ? new Date(order.pickup_date).toLocaleString('en-GH') : '—'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Return Date</Text>
            <Text style={styles.value}>{order.return_date ? new Date(order.return_date).toLocaleString('en-GH') : '—'}</Text>
          </View>
        </View>
        {order.venue_name && (
          <View style={[styles.row, { marginTop: 6 }]}>
            <View style={styles.field}>
              <Text style={styles.label}>Venue</Text>
              <Text style={styles.value}>{order.venue_name}{order.venue_region ? `, ${order.venue_region}` : ''}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Delivery Method</Text>
              <Text style={styles.value}>{(order.delivery_method ?? '').replace(/_/g, ' ')}</Text>
            </View>
          </View>
        )}

        {/* Rental items */}
        <Text style={styles.sectionTitle}>3. RENTAL ITEMS</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colItem]}>Item</Text>
            <Text style={[styles.headerText, styles.colQty]}>Qty</Text>
            <Text style={[styles.headerText, styles.colDays]}>Days</Text>
            <Text style={[styles.headerText, styles.colRate]}>Rate/Day</Text>
            <Text style={[styles.headerText, styles.colTotal]}>Total</Text>
          </View>
          {orderItems.map((oi: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colItem}>{oi.inventory_items?.name ?? oi.item_id}</Text>
              <Text style={styles.colQty}>{oi.quantity}</Text>
              <Text style={styles.colDays}>{oi.rental_days}</Text>
              <Text style={styles.colRate}>{ghsFormat(oi.unit_rate)}</Text>
              <Text style={[styles.colTotal, styles.bold]}>{ghsFormat(oi.line_total ?? oi.unit_rate * oi.quantity * oi.rental_days)}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={{ color: '#6b7280' }}>Subtotal</Text>
            <Text>{ghsFormat(subtotal)}</Text>
          </View>
          {(order.delivery_fee ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: '#6b7280' }}>Delivery</Text>
              <Text>{ghsFormat(order.delivery_fee)}</Text>
            </View>
          )}
          {(order.setup_fee ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: '#6b7280' }}>Drop Off / Breakdown Fee</Text>
              <Text>{ghsFormat(order.setup_fee)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={{ color: '#6b7280' }}>VAT (15%)</Text>
            <Text>{ghsFormat(tax)}</Text>
          </View>
          {securityDeposit > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: '#6b7280' }}>Security Deposit</Text>
              <Text>{ghsFormat(securityDeposit)}</Text>
            </View>
          )}
          {additionalCharges > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: '#6b7280' }}>{order.additional_charges_description || 'Additional Charges'}</Text>
              <Text>{ghsFormat(additionalCharges)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.bold}>Total</Text>
            <Text style={styles.bold}>{ghsFormat(total)}</Text>
          </View>
        </View>

        <View style={styles.depositBox}>
          <Text style={[styles.bold, { fontSize: 10 }]}>{BOOKING_DEPOSIT_THRESHOLD_PCT}% payment must be made before booking is confirmed: {ghsFormat(deposit)}</Text>
          <Text style={{ fontSize: 9, color: '#1d4ed8', marginTop: 3 }}>
            Booking is confirmed upon receipt of deposit payment.
          </Text>
        </View>

        {/* Terms */}
        <Text style={styles.sectionTitle}>4. TERMS & CONDITIONS</Text>
        <Text style={styles.terms}>{terms}</Text>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Client Signature & Date</Text>
            <Text style={[styles.signatureLabel, { marginTop: 3 }]}>{customer?.full_name}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorised Signature & Date</Text>
            <Text style={[styles.signatureLabel, { marginTop: 3 }]}>{business?.business_name ?? 'Akoben Event Rentals'}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
