'use client'

export default function PrintButton() {
  return (
    <button onClick={() => window.print()}
      className="print:hidden px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors">
      🖨 Print
    </button>
  )
}
