'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors">
      <Printer size={14} /> Print
    </button>
  )
}
