'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StripePaymentForm from './StripePaymentForm'
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Shield,
  Clock
} from 'lucide-react'

interface PaymentData {
  id: string
  amount: number
  customerName: string
  serviceType: string
  appointmentDate: string
  appointmentTime: string
  detailerName: string
  detailerPhone: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
}

interface CustomerPaymentPageProps {
  paymentId: string
}

export default function CustomerPaymentPage({ paymentId }: CustomerPaymentPageProps) {
  const router = useRouter()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setLoading(true)
        
        // For demo purposes, create mock payment data
        // In production, this would fetch from your API
        const mockPaymentData: PaymentData = {
          id: paymentId,
          amount: 150.00,
          customerName: 'Jane Smith',
          serviceType: 'Full Detail',
          appointmentDate: '2024-01-20',
          appointmentTime: '10:00 AM',
          detailerName: 'Mike\'s Mobile Detailing',
          detailerPhone: '+1 (555) 123-4567',
          status: 'pending'
        }

        setPaymentData(mockPaymentData)

        // Create payment intent
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: mockPaymentData.amount,
            appointmentId: paymentId,
            customerId: 'customer-demo'
          })
        })

        const data = await response.json()

        if (data.success) {
          setClientSecret(data.clientSecret)
        } else {
          throw new Error(data.error || 'Failed to create payment intent')
        }

      } catch (err) {
        console.error('Error fetching payment data:', err)
        setError(err.message || 'Failed to load payment information')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentData()
  }, [paymentId])

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Confirm payment on server
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntentId,
          appointmentId: paymentId
        })
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to success page
        router.push(`/pay/success?paymentId=${paymentId}`)
      } else {
        throw new Error(data.error || 'Payment confirmation failed')
      }
    } catch (err) {
      console.error('Payment confirmation error:', err)
      setError('Payment succeeded but confirmation failed. Please contact support.')
    }
  }

  const handlePaymentError = (error: string) => {
    setError(error)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    )
  }

  if (error || !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Payment information not found'}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Complete Payment</h1>
              <p className="text-sm text-gray-600">{paymentData.detailerName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Service Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Service Type:</span>
              <span className="font-medium">{paymentData.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Appointment Date:</span>
              <span className="font-medium">{paymentData.appointmentDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Appointment Time:</span>
              <span className="font-medium">{paymentData.appointmentTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Detailer:</span>
              <span className="font-medium">{paymentData.detailerName}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-blue-600">${paymentData.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        {clientSecret ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            <StripePaymentForm
              clientSecret={clientSecret}
              amount={paymentData.amount}
              customerName={paymentData.customerName}
              serviceType={paymentData.serviceType}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Preparing payment form...</p>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Secure Payment</p>
              <p className="text-blue-800">
                Your payment information is encrypted and processed securely by Stripe. 
                We never store your card details.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Questions about this payment?</p>
          <p>Contact {paymentData.detailerName} at {paymentData.detailerPhone}</p>
        </div>
      </div>
    </div>
  )
}


