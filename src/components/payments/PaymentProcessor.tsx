'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  DollarSign
} from 'lucide-react'

interface PaymentProcessorProps {
  appointmentId: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  serviceType: string
  amount: number
  onPaymentSuccess?: (paymentId: string) => void
  onPaymentError?: (error: string) => void
}

export default function PaymentProcessor({
  appointmentId,
  customerName,
  customerEmail,
  customerPhone,
  serviceType,
  amount,
  onPaymentSuccess,
  onPaymentError
}: PaymentProcessorProps) {
  const [loading, setLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    setPaymentStatus('processing')
    setError(null)

    try {
      // Step 1: Create payment intent
      const intentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          appointmentId: appointmentId,
          customerId: customerPhone // Using phone as customer ID for demo
        })
      })

      const intentData = await intentResponse.json()

      if (!intentData.success) {
        throw new Error(intentData.error || 'Failed to create payment intent')
      }

      // Step 2: Simulate payment processing (in real app, this would use Stripe Elements)
      console.log('Payment intent created:', intentData.paymentIntentId)
      
      // For demo purposes, automatically confirm the payment
      // In production, this would happen after Stripe Elements processes the payment
      setTimeout(async () => {
        try {
          const confirmResponse = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: intentData.paymentIntentId,
              appointmentId: appointmentId
            })
          })

          const confirmData = await confirmResponse.json()

          if (confirmData.success) {
            setPaymentStatus('success')
            setPaymentId(intentData.paymentIntentId)
            onPaymentSuccess?.(intentData.paymentIntentId)
          } else {
            throw new Error(confirmData.error || 'Payment confirmation failed')
          }
        } catch (confirmError) {
          console.error('Payment confirmation error:', confirmError)
          setPaymentStatus('error')
          setError(confirmError.message)
          onPaymentError?.(confirmError.message)
        } finally {
          setLoading(false)
        }
      }, 2000) // Simulate 2-second payment processing

    } catch (error) {
      console.error('Payment error:', error)
      setPaymentStatus('error')
      setError(error.message)
      onPaymentError?.(error.message)
      setLoading(false)
    }
  }

  const platformFee = Math.round(amount * 0.029 + 0.30 * 100) / 100
  const detailerAmount = amount - platformFee

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Payment Processing</h3>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Service: {serviceType}</span>
          <span className="font-medium">${amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Platform Fee (2.9% + $0.30)</span>
          <span className="text-gray-600">${platformFee.toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>You Receive:</span>
          <span className="text-green-600">${detailerAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Status */}
      {paymentStatus === 'idle' && (
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Process payment for <strong>{customerName}</strong>
          </p>
          <Button 
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Process Payment (${amount.toFixed(2)})
          </Button>
        </div>
      )}

      {paymentStatus === 'processing' && (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
          <p className="text-gray-600">Processing payment...</p>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💳 Demo Mode: Payment will be automatically confirmed
            </p>
          </div>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-green-800">Payment Successful!</p>
            <p className="text-sm text-gray-600">Payment ID: {paymentId}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✅ ${detailerAmount.toFixed(2)} will be deposited to your account
            </p>
          </div>
        </div>
      )}

      {paymentStatus === 'error' && (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-red-800">Payment Failed</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
          <Button 
            onClick={handlePayment}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Demo Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800">
          🎭 <strong>Demo Mode:</strong> This is a demonstration. No real payments are processed. 
          To enable real payments, configure your Stripe keys in the environment variables.
        </p>
      </div>
    </div>
  )
}


