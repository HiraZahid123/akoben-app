import PageHeader from '@/components/layout/PageHeader'
import HelpAccordion from './HelpAccordion'
import {
  ClipboardList, MessageSquare, Package, Receipt, Calendar, Truck,
  PackageCheck, Container, Tag, Archive, BarChart3, CreditCard,
  Bookmark, Lightbulb, type LucideIcon,
} from 'lucide-react'

const sections: { id: string; title: string; icon: LucideIcon; content?: string; steps?: { title: string; body: string }[] }[] = [
  {
    id: 'overview',
    title: 'System Overview',
    icon: ClipboardList,
    content: `Akoben Event Rentals is a full rental management system built for your business in Cape Coast, Ghana. It covers the complete lifecycle of every rental job — from quoting to delivery to return.

The system is designed around a simple flow:

  1. Create a Quote → send to customer
  2. Convert to Order → once customer agrees
  3. Generate Invoice → collect payment
  4. Book Event → once 50% deposit is paid
  5. Pull Order → check items out on event day
  6. Return Order → check items back in after event

Every step is tracked so you always know what's out, what's been paid, and what's coming up.`,
  },
  {
    id: 'quotes',
    title: 'Quotes',
    icon: MessageSquare,
    steps: [
      { title: 'Create a Quote', body: 'Go to Quotes → New Quote. Fill in the customer details, event name, event date, pickup and return dates. Add the rental items and quantities. Fill in venue details (name, region, address) and the delivery/setup fee if applicable.' },
      { title: 'Send to Customer', body: 'Once the quote is saved, open it and click "Send to Customer" (Email) or the WhatsApp button. This sends the quote details to the customer. The status changes to Sent.' },
      { title: 'Mark as Accepted', body: 'When the customer agrees to the quote, open it and click "Mark Accepted". This locks the quote and enables the Convert to Order button.' },
      { title: 'Convert to Order', body: 'Click "Convert to Order" — this creates a new Order and links it to the quote. The quote will show a "Converted to Order" badge.' },
      { title: 'Resend a Quote', body: 'You can resend the quote via Email or WhatsApp at any time using the buttons at the top right. This is useful if you make edits to the quote after sending.' },
    ],
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: Package,
    steps: [
      { title: 'Create an Order', body: 'Go to Orders → New Order. Select the customer, fill in event details, add rental items. You can also create an order directly by converting an accepted quote.' },
      { title: 'Order Statuses', body: 'Draft — order is being prepared. Sent — order sent to customer. Confirmed — customer confirmed / payment received. Returned — all items returned. Cancelled — order was cancelled.' },
      { title: 'Edit an Order', body: 'Open the order and click Edit. If you add or remove items, the linked invoice will automatically update its subtotal and total.' },
      { title: 'Availability Check', body: 'The order detail page shows a live availability column for each item. If any item shows "Only N available", that means some units are currently out on another order. You can remove that item from the order if needed.' },
      { title: 'Email & WhatsApp', body: 'Use the Email or WhatsApp buttons (top right of any order) to send order details to the customer at any time.' },
    ],
  },
  {
    id: 'invoices',
    title: 'Invoices',
    icon: Receipt,
    steps: [
      { title: 'Invoice is Auto-Created', body: 'When you create an order, an invoice is automatically generated with the same items and totals. You do not need to create invoices manually.' },
      { title: 'Invoice Statuses', body: 'Unpaid — no payment received yet. Partially Paid — some payment received, balance remains. Fully Paid — total amount collected. Overdue — payment due date has passed. Sent — invoice has been emailed. Void — invoice cancelled.' },
      { title: 'Record a Payment', body: 'Open the invoice and click "Record Payment". Enter the amount received, select the payment method (Cash, MTN MoMo, Vodafone Cash, Telecel Cash, Bank Transfer, Cheque, or Card), and enter a reference number. Click Save. The balance updates automatically.' },
      { title: 'Partial Payments', body: 'You can record multiple partial payments. Each payment is logged with date, method, amount and reference. The running balance is always shown correctly.' },
      { title: 'Book Event Button', body: 'Once the customer has paid at least 50% of the invoice total, a "Book Event" button appears. Clicking it confirms the booking, adds the event to the Calendar, and unlocks the Pull Order button.' },
      { title: 'Pull Order Button', body: 'Appears after the event is booked. Click it to go to the Pull Order page where you scan items out to the customer on event day.' },
      { title: 'Return Order Button', body: 'Appears next to Pull Order after booking. Use it after the event to scan items back in and update inventory.' },
    ],
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: Calendar,
    content: `The Calendar tab shows all booked events across their full rental period (from pickup date to return date).

Each event block shows the customer name and event name. Events are only shown after the "Book Event" button has been clicked on the invoice — unconfirmed orders do not appear here.

Use the calendar to quickly see which days are busy and avoid double-booking.`,
  },
  {
    id: 'pull',
    title: 'Pull Order (Check Out)',
    icon: Truck,
    steps: [
      { title: 'When to Pull', body: 'Pull Order is used on the day items leave your store for the event. Go to the invoice, click "Pull Order".' },
      { title: 'Scan Items Out', body: 'On the Pull Order page you will see all items on the order. Use a barcode scanner (or type the barcode/unit number) to scan each item. The Scanned Checkout Qty updates as you scan.' },
      { title: 'Manual Adjustment', body: 'If you do not have a scanner, use the + and − buttons to manually set the checkout quantity for each item.' },
      { title: 'Confirm Pull', body: 'Click "Confirm Pull" when all items are scanned. This marks those inventory units as "Out", logs the checkout to the Delivery tab, and the items will show as unavailable for other orders.' },
    ],
  },
  {
    id: 'return',
    title: 'Return Order (Check In)',
    icon: PackageCheck,
    steps: [
      { title: 'When to Return', body: 'Return Order is used when the customer brings items back. Go to Delivery tab and click "Return Order" next to the order, or click "Return Order" on the invoice.' },
      { title: 'Scan Items In', body: 'Scan each returning item\'s barcode. The Scanned Check-in Qty updates as you scan. Only items that were previously checked out will be accepted.' },
      { title: 'Set Condition', body: 'For each scanned-in item, select the condition: Good (returns to available inventory), Damaged, or Needs Repair (moves to maintenance, not available for booking).' },
      { title: 'Confirm Return', body: 'Click "Confirm Return". All good-condition items are immediately available for new orders. Damaged/repair items are flagged in inventory for review. The order status changes to Returned.' },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery Tab',
    icon: Container,
    content: `The Delivery tab is your log of all item movements.

Check-Out Logs — grouped by order number, shows every item that was scanned out via Pull Order. Each group has a "Return Order" button for easy access.

Check-In Logs — shows every item scanned back in via Return Order, including the condition recorded at return.

Use this tab to quickly verify what's out in the field and what has come back.`,
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: Tag,
    steps: [
      { title: 'Add an Item', body: 'Go to Inventory → New Item. Fill in the name, category, SKU, and daily rental rate. Save the item.' },
      { title: 'Add Units', body: 'Each item can have multiple physical units (e.g., 10 chairs of the same model). Open the item and add units with individual barcodes or unit numbers. Each unit is tracked separately.' },
      { title: 'Unit Statuses', body: 'Available — ready to rent. Out — currently on an active order. Maintenance — damaged or under repair, not available for booking.' },
      { title: 'Availability', body: 'The availability count shown on the Order page is the number of units currently in "Available" status. If you have 10 chairs but 4 are out, only 6 are shown as available.' },
    ],
  },
  {
    id: 'backoffice',
    title: 'Back Office',
    icon: Archive,
    content: `The Back Office tab is a document store for your business files.

Upload documents such as rental agreements, customer contracts, forms, templates, and policies. Files are stored securely and can be downloaded at any time.

Categories: Agreements, Contracts, Forms, Templates, Policies, Other.

To upload: click "Upload Document", select your file, give it a name and category. To download: click the download icon next to any document. To delete: click the delete link (you will be asked to confirm).`,
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: BarChart3,
    content: `The Reports tab gives you a financial summary of payments collected.

Daily Report — select a specific date to see all payments received that day. Shows total revenue, number of orders, and average payment.

Monthly Report — select a month and year to see the full month's payment history with totals.

All figures are based on actual payments recorded in the system.`,
  },
  {
    id: 'payments',
    title: 'Payment Methods',
    icon: CreditCard,
    content: `The system supports the following payment methods:

• Cash
• MTN Mobile Money (MoMo)
• Vodafone Cash
• Telecel Cash
• Bank Transfer
• Cheque
• Card

Select the correct method when recording a payment so your records stay accurate.`,
  },
  {
    id: 'statuses',
    title: 'Status Reference',
    icon: Bookmark,
    content: `ORDER STATUSES
• Draft — being prepared, not yet sent
• Sent — sent to customer, awaiting confirmation
• Confirmed — customer confirmed / booking locked
• Returned — all items back in inventory
• Cancelled — order was cancelled
• Overdue — return date has passed, items not yet returned

INVOICE STATUSES
• Unpaid — no payment received
• Partially Paid — deposit or partial payment received
• Fully Paid — complete payment collected
• Overdue — payment overdue
• Sent — invoice emailed to customer
• Void — invoice cancelled

INVENTORY UNIT STATUSES
• Available — ready for rental
• Out — currently with a customer
• Maintenance — not available (damaged or under repair)`,
  },
  {
    id: 'tips',
    title: 'Tips & Best Practices',
    icon: Lightbulb,
    content: `1. Always book the event (click "Book Event") once a 50% deposit is received — this adds it to the Calendar and prevents double-booking.

2. Run the Pull Order scan before the customer picks up items. Never skip scanning — it keeps your inventory accurate.

3. Record partial payments as they come in. The system tracks the running balance automatically, so you always know what's owed.

4. If an item comes back damaged, use the "Damaged" or "Needs Repair" condition on Return Order. The unit will be removed from available inventory until you manually fix it in Inventory.

5. Use the Back Office tab to store your signed rental agreements. Upload a signed copy after each booking for easy reference.

6. Check the Calendar before creating new orders to avoid scheduling conflicts.

7. The Delivery tab gives you a full audit trail of what went out and when — useful if there's ever a dispute about missing items.`,
  },
]

export default function HelpPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Help & Guide"
        subtitle="How to use Akoben Event Rentals — step by step"
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Quick nav */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-3">Jump to section</p>
            <div className="flex flex-wrap gap-2">
              {sections.map(s => {
                const Icon = s.icon
                return (
                  <a key={s.id} href={`#${s.id}`}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1 bg-white border border-orange-200 text-orange-700 rounded-full hover:bg-orange-100 transition-colors">
                    <Icon size={12} /> {s.title}
                  </a>
                )
              })}
            </div>
          </div>

          {sections.map(section => (
            <HelpAccordion key={section.id} id={section.id} title={section.title} icon={section.icon} content={section.content} steps={section.steps} />
          ))}

          <div className="text-center text-xs text-gray-400 pt-4 pb-8">
            Akoben Event Rentals — Built by Compiling Logics
          </div>
        </div>
      </div>
    </div>
  )
}
