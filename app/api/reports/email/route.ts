import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import ReportPDF from '@/lib/pdf/ReportPDF'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { to, title, subtitle, columns, rows } = await req.json()
    if (!to || !title || !columns || !rows) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const buffer = await renderToBuffer(createElement(ReportPDF, { title, subtitle, columns, rows }) as any)

    await sendEmail({
      to,
      subject: `${title} — Akoben Event Rentals`,
      html: `<p>Please find attached: <strong>${title}</strong></p><p>${subtitle ?? ''}</p>`,
      attachments: [{ filename: `${title.replace(/\s+/g, '-').toLowerCase()}.pdf`, content: buffer }],
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Report email error:', error)
    return NextResponse.json({ error: error.message ?? 'Failed to send report' }, { status: 500 })
  }
}
