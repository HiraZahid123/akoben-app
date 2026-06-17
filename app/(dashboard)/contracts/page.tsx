import PageHeader from '@/components/layout/PageHeader'

export default function ContractsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Contracts" subtitle="Rental agreements" />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Contracts Coming Soon</h2>
          <p className="text-sm text-gray-500">
            Rental contract generation with PDF export will be available in the next update.
          </p>
        </div>
      </div>
    </div>
  )
}
