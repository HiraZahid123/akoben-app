import PageHeader from '@/components/layout/PageHeader'
import BarcodeScanner from './BarcodeScanner'

export default function ScannerPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Barcode Scanner"
        subtitle="Scan items to check out or check in"
      />
      <div className="flex-1 overflow-auto p-6">
        <BarcodeScanner />
      </div>
    </div>
  )
}
