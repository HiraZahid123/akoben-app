import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false, // TLS on port 587
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
})

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  attachments?: { filename: string; path: string }[]
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
  const info = await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to,
    subject,
    html,
    attachments,
  })
  return info
}

// Email templates
export function quoteEmailHtml(params: {
  customerName: string
  quoteNumber: string
  total: number
  expiresAt: string
  viewUrl: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">Akoben Event Rentals</h1>
        <p style="color: #aaa; margin: 4px 0 0;">Cape Coast, Ghana</p>
      </div>
      <div style="padding: 32px 24px;">
        <p>Dear ${params.customerName},</p>
        <p>Thank you for your interest! Please find your rental quote below.</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0;"><strong>Quote Number:</strong> ${params.quoteNumber}</p>
          <p style="margin: 8px 0 0;"><strong>Total:</strong> ₵${params.total.toLocaleString()}</p>
          <p style="margin: 8px 0 0;"><strong>Valid Until:</strong> ${params.expiresAt}</p>
        </div>
        <p>To accept this quote or ask questions, please contact us or click the link below.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${params.viewUrl}" style="background: #185FA5; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Quote</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="color: #888; font-size: 12px;">Akoben Event Rentals • Cape Coast, Ghana<br>This quote expires on ${params.expiresAt}</p>
      </div>
    </div>
  `
}

export function invoiceEmailHtml(params: {
  customerName: string
  invoiceNumber: string
  total: number
  dueDate: string
  paystackLink?: string
  items?: { name: string; quantity: number; lineTotal: number }[]
  momoNumber?: string
}) {
  const itemsHtml = params.items && params.items.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="border-bottom: 2px solid #ddd; text-align: left;">
          <th style="padding: 8px 0;">Item</th>
          <th style="padding: 8px 0; text-align: center;">Qty</th>
          <th style="padding: 8px 0; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${params.items.map(i => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px 0;">${i.name}</td>
            <td style="padding: 8px 0; text-align: center;">${i.quantity}</td>
            <td style="padding: 8px 0; text-align: right;">₵${i.lineTotal.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">Akoben Event Rentals</h1>
        <p style="color: #aaa; margin: 4px 0 0;">Cape Coast, Ghana</p>
      </div>
      <div style="padding: 32px 24px;">
        <p>Dear ${params.customerName},</p>
        <p>Your invoice is ready. Please find the details below.</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0;"><strong>Invoice Number:</strong> ${params.invoiceNumber}</p>
          ${itemsHtml}
          <p style="margin: 8px 0 0;"><strong>Amount Due:</strong> ₵${params.total.toLocaleString()}</p>
          <p style="margin: 8px 0 0;"><strong>Due Date:</strong> ${params.dueDate}</p>
        </div>
        <p>You can pay via:</p>
        <ul>
          <li>Mobile Money (MTN MoMo / Vodafone Cash)</li>
          <li>Bank Transfer</li>
          <li>Cash on pickup</li>
          ${params.paystackLink ? '<li>Online payment (link below)</li>' : ''}
        </ul>
        ${params.momoNumber ? `<p><strong>Please use this MoMo number to make a payment:</strong> ${params.momoNumber}</p>` : ''}
        ${params.paystackLink ? `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${params.paystackLink}" style="background: #00C3F7; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">Pay Online Now</a>
        </div>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="color: #888; font-size: 12px;">Akoben Event Rentals • Cape Coast, Ghana</p>
      </div>
    </div>
  `
}

export function orderConfirmationEmailHtml(params: {
  customerName: string
  orderNumber: string
  eventName: string
  pickupDate: string
  returnDate: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">Akoben Event Rentals</h1>
        <p style="color: #aaa; margin: 4px 0 0;">Cape Coast, Ghana</p>
      </div>
      <div style="padding: 32px 24px;">
        <p>Dear ${params.customerName},</p>
        <p>Your rental order has been confirmed! 🎉</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0;"><strong>Order Number:</strong> ${params.orderNumber}</p>
          <p style="margin: 8px 0 0;"><strong>Event:</strong> ${params.eventName}</p>
          <p style="margin: 8px 0 0;"><strong>Pickup:</strong> ${params.pickupDate}</p>
          <p style="margin: 8px 0 0;"><strong>Return:</strong> ${params.returnDate}</p>
        </div>
        <p>If you have any questions, please contact us. We look forward to making your event special!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="color: #888; font-size: 12px;">Akoben Event Rentals • Cape Coast, Ghana</p>
      </div>
    </div>
  `
}
