import { STANDARD_PAYMENT_TERMS_NOTICE } from '@/lib/utils'

export default function PaymentTermsNotice() {
  return (
    <div className="max-w-6xl px-6 pb-6 -mt-2">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3.5">
        <p className="text-xs text-blue-800 leading-relaxed">{STANDARD_PAYMENT_TERMS_NOTICE}</p>
      </div>
    </div>
  )
}
