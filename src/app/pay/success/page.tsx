import { Suspense } from 'react'
import PaymentSuccessPage from '@/components/payments/PaymentSuccessPage'

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessPage />
    </Suspense>
  )
}
