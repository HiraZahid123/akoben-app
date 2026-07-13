// Client-safe email template helpers (no nodemailer imports)

const PAYMENT_TERMS_NOTICE_HTML =
  'A 50% deposit is required to confirm and book your reservation. The remaining 100% balance is ' +
  'due on the day of pick-up. The security deposit will be refunded once all rented items are ' +
  'returned in good condition with no missing pieces.'

function itemsTableHtml(items?: { name: string; quantity: number; lineTotal: number }[]) {
  if (!items || items.length === 0) return ''
  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <thead>
        <tr style="border-bottom:2px solid #e2e8f0;text-align:left;">
          <th style="padding:8px 0;">Item</th>
          <th style="padding:8px 0;text-align:center;">Qty</th>
          <th style="padding:8px 0;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(i => `
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px 0;">${i.name}</td>
            <td style="padding:8px 0;text-align:center;">${i.quantity}</td>
            <td style="padding:8px 0;text-align:right;">₵${i.lineTotal.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

function feeLinesHtml(fees: { label: string; amount: number }[]) {
  return fees.filter(f => f.amount > 0).map(f => `
    <p style="margin:8px 0 0;"><strong>${f.label}:</strong> ₵${f.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
  `).join('')
}

export function quoteEmailHtml(params: {
  customerName: string
  quoteNumber: string
  total: number
  expiresAt: string
  viewUrl: string
  items?: { name: string; quantity: number; lineTotal: number }[]
  deliveryFee?: number
  setupFee?: number
  securityDeposit?: number
  additionalChargesDescription?: string | null
  additionalChargesAmount?: number
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0f172a;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Akoben Event Rentals</h1>
        <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">Cape Coast, Ghana</p>
      </div>
      <div style="padding:32px 24px;">
        <p>Dear ${params.customerName},</p>
        <p>Thank you for your interest! Please find your itemized rental quote below.</p>
        <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #e2e8f0;">
          <p style="margin:0;"><strong>Quote Number:</strong> ${params.quoteNumber}</p>
          ${itemsTableHtml(params.items)}
          ${feeLinesHtml([
            { label: 'Delivery', amount: params.deliveryFee ?? 0 },
            { label: 'Drop Off / Breakdown Fee', amount: params.setupFee ?? 0 },
            { label: 'Security Deposit', amount: params.securityDeposit ?? 0 },
            { label: params.additionalChargesDescription || 'Additional Charges', amount: params.additionalChargesAmount ?? 0 },
          ])}
          <p style="margin:8px 0 0;"><strong>Total:</strong> ₵${params.total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
          <p style="margin:8px 0 0;"><strong>Valid Until:</strong> ${params.expiresAt}</p>
        </div>
        <p style="font-size:13px;color:#475569;">${PAYMENT_TERMS_NOTICE_HTML}</p>
        <p>To accept this quote or ask questions, please contact us or reply to this email.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${params.viewUrl}" style="background:#2563eb;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">View Itemized Quote</a>
        </div>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
        <p style="color:#94a3b8;font-size:12px;">Akoben Event Rentals &bull; Cape Coast, Ghana</p>
      </div>
    </div>`
}

export function invoiceEmailHtml(params: {
  customerName: string
  invoiceNumber: string
  total: number
  dueDate: string
  paystackLink?: string
  items?: { name: string; quantity: number; lineTotal: number }[]
  momoNumber?: string
  deliveryFee?: number
  setupFee?: number
  securityDeposit?: number
  additionalChargesDescription?: string | null
  additionalChargesAmount?: number
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0f172a;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Akoben Event Rentals</h1>
        <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">Cape Coast, Ghana</p>
      </div>
      <div style="padding:32px 24px;">
        <p>Dear ${params.customerName},</p>
        <p>Your invoice is ready. Please see the itemized details below.</p>
        <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #e2e8f0;">
          <p style="margin:0;"><strong>Invoice:</strong> ${params.invoiceNumber}</p>
          ${itemsTableHtml(params.items)}
          ${feeLinesHtml([
            { label: 'Delivery', amount: params.deliveryFee ?? 0 },
            { label: 'Drop Off / Breakdown Fee', amount: params.setupFee ?? 0 },
            { label: 'Security Deposit', amount: params.securityDeposit ?? 0 },
            { label: params.additionalChargesDescription || 'Additional Charges', amount: params.additionalChargesAmount ?? 0 },
          ])}
          <p style="margin:8px 0 0;"><strong>Amount Due:</strong> ₵${params.total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
          <p style="margin:8px 0 0;"><strong>Due Date (Pick-up Day):</strong> ${params.dueDate}</p>
        </div>
        <p style="font-size:13px;color:#475569;">${PAYMENT_TERMS_NOTICE_HTML}</p>
        <p><strong>Pay via:</strong> MTN Mobile Money, Vodafone Cash, Bank Transfer, or Cash on pickup.</p>
        ${params.momoNumber ? `<p><strong>Please use this MoMo number to make a payment:</strong> ${params.momoNumber}</p>` : ''}
        ${params.paystackLink ? `
        <div style="text-align:center;margin:32px 0;">
          <a href="${params.paystackLink}" style="background:#00c3f7;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Pay Online Now</a>
        </div>` : ''}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
        <p style="color:#94a3b8;font-size:12px;">Akoben Event Rentals &bull; Cape Coast, Ghana</p>
      </div>
    </div>`
}

export function orderEmailHtml(params: {
  customerName: string
  orderNumber: string
  eventName: string
  total: number
  items?: { name: string; quantity: number; lineTotal: number }[]
  deliveryFee?: number
  setupFee?: number
  securityDeposit?: number
  additionalChargesDescription?: string | null
  additionalChargesAmount?: number
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0f172a;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Akoben Event Rentals</h1>
        <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">Cape Coast, Ghana</p>
      </div>
      <div style="padding:32px 24px;">
        <p>Dear ${params.customerName},</p>
        <p>Your order <strong>${params.orderNumber}</strong> for <strong>${params.eventName}</strong> has been updated. Please see the itemized breakdown below.</p>
        <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #e2e8f0;">
          <p style="margin:0;"><strong>Order:</strong> ${params.orderNumber}</p>
          ${itemsTableHtml(params.items)}
          ${feeLinesHtml([
            { label: 'Delivery', amount: params.deliveryFee ?? 0 },
            { label: 'Drop Off / Breakdown Fee', amount: params.setupFee ?? 0 },
            { label: 'Security Deposit', amount: params.securityDeposit ?? 0 },
            { label: params.additionalChargesDescription || 'Additional Charges', amount: params.additionalChargesAmount ?? 0 },
          ])}
          <p style="margin:8px 0 0;"><strong>Total:</strong> ₵${params.total.toLocaleString('en-GH', { minimumFractionDigits: 2 })}</p>
        </div>
        <p style="font-size:13px;color:#475569;">${PAYMENT_TERMS_NOTICE_HTML}</p>
        <p>Please contact us if you have any questions. Thank you for booking with Akoben Event Rentals!</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
        <p style="color:#94a3b8;font-size:12px;">Akoben Event Rentals &bull; Cape Coast, Ghana</p>
      </div>
    </div>`
}

export function orderConfirmationEmailHtml(params: {
  customerName: string
  orderNumber: string
  eventName: string
  pickupDate: string
  returnDate: string
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0f172a;padding:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Akoben Event Rentals</h1>
        <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">Cape Coast, Ghana</p>
      </div>
      <div style="padding:32px 24px;">
        <p>Dear ${params.customerName},</p>
        <p>Your rental order has been confirmed!</p>
        <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #e2e8f0;">
          <p style="margin:0;"><strong>Order:</strong> ${params.orderNumber}</p>
          <p style="margin:8px 0 0;"><strong>Event:</strong> ${params.eventName}</p>
          <p style="margin:8px 0 0;"><strong>Pickup:</strong> ${params.pickupDate}</p>
          <p style="margin:8px 0 0;"><strong>Return:</strong> ${params.returnDate}</p>
        </div>
        <p>We look forward to making your event special. Contact us with any questions!</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
        <p style="color:#94a3b8;font-size:12px;">Akoben Event Rentals &bull; Cape Coast, Ghana</p>
      </div>
    </div>`
}
