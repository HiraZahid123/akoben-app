'use client'

import { useEffect, useRef, useState } from 'react'
import { Printer } from 'lucide-react'

interface Props {
  barcode: string
  label: string
  unitNumber?: string | null
}

export default function BarcodePrintButton({ barcode, label, unitNumber }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    import('jsbarcode').then(({ default: JsBarcode }) => {
      if (svgRef.current) {
        JsBarcode(svgRef.current, barcode, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 8,
        })
        setReady(true)
      }
    })
  }, [barcode])

  function handlePrint() {
    if (!svgRef.current) return
    const svgHtml = svgRef.current.outerHTML
    const win = window.open('', '_blank', 'width=400,height=300')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode — ${label}</title>
        <style>
          body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
          .label-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; text-align: center; }
          .unit-num { font-size: 11px; color: #666; margin-bottom: 6px; }
          @media print { @page { size: 3in 1.5in; margin: 0; } body { min-height: unset; padding: 8px; } }
        </style>
      </head>
      <body>
        <div class="label-name">${label}</div>
        ${unitNumber ? `<div class="unit-num">${unitNumber}</div>` : ''}
        ${svgHtml}
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="flex items-center gap-2">
      <svg ref={svgRef} className="hidden" />
      <button
        onClick={handlePrint}
        disabled={!ready}
        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium disabled:opacity-40"
        title="Print barcode label"
      >
        <Printer size={12} /> Print
      </button>
    </div>
  )
}
