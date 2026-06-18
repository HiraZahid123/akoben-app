'use client'

interface Props {
  paystackConfigured: boolean
}

export default function IntegrationsPanel({ paystackConfigured }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Integrations & Exports</h2>

      {/* Paystack */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">P</div>
            <div>
              <p className="font-medium text-gray-800">Paystack</p>
              <p className="text-xs text-gray-500">Accept online payments via card, bank transfer & mobile money</p>
            </div>
          </div>
          {paystackConfigured ? (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Connected</span>
          ) : (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Not configured</span>
          )}
        </div>
        {!paystackConfigured && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700 space-y-1">
            <p className="font-medium">To enable Paystack:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Create an account at <strong>paystack.com</strong></li>
              <li>Go to Settings → API Keys & Webhooks</li>
              <li>Copy your <strong>Secret Key</strong></li>
              <li>Add <code className="bg-amber-100 px-1 rounded">PAYSTACK_SECRET_KEY=sk_live_...</code> to your Hostinger environment variables</li>
            </ol>
          </div>
        )}
        {paystackConfigured && (
          <p className="text-xs text-gray-500">Payment links can be sent from any invoice page. Customers pay online and the invoice is automatically marked as paid.</p>
        )}
      </div>

      {/* Flutterwave */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">F</div>
            <div>
              <p className="font-medium text-gray-800">Flutterwave</p>
              <p className="text-xs text-gray-500">Alternative payment gateway (coming soon)</p>
            </div>
          </div>
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Coming soon</span>
        </div>
      </div>

      {/* Accounting exports */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <p className="font-medium text-gray-800">Accounting Exports</p>
          <p className="text-xs text-gray-500 mt-0.5">Export data as CSV to import into QuickBooks, Xero, Wave, or any accounting software.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/api/export/orders"
            download
            className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl">📋</span>
            <div>
              <p className="text-sm font-medium text-gray-800">Orders Export</p>
              <p className="text-xs text-gray-400">All orders with totals</p>
            </div>
          </a>
          <a
            href="/api/export/payments"
            download
            className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl">💰</span>
            <div>
              <p className="text-sm font-medium text-gray-800">Payments Export</p>
              <p className="text-xs text-gray-400">All received payments</p>
            </div>
          </a>
        </div>
        <p className="text-xs text-gray-400">
          To connect with Zapier: use these CSV export URLs as the data source in a Zapier Webhook step, or contact your accountant to set up the Xero/QuickBooks CSV import.
        </p>
      </div>
    </div>
  )
}
