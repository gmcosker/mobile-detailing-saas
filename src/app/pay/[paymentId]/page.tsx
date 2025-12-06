import { notFound } from 'next/navigation'
import CustomerPaymentPage from '@/components/payments/CustomerPaymentPage'

interface PaymentPageProps {
  params: {
    paymentId: string
  }
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const { paymentId } = params

  if (!paymentId) {
    notFound()
  }

  return <CustomerPaymentPage paymentId={paymentId} />
}


