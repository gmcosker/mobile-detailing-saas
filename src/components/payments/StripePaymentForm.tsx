'use client'

import { useState, useEffect } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements as StripeElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Lock
} from 'lucide-react'

interface StripePaymentFormProps {
  clientSecret: string
  amount: number
  customerName: string
  serviceType: string
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo')

function PaymentForm({
  clientSecret,
  amount,
  customerName,
  serviceType,
  onPaymentSuccess,
  onPaymentError
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!stripe) {
      return
    }

    if (!clientSecret) {
      return
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('Payment succeeded!')
          onPaymentSuccess(paymentIntent.id)
          break
        case 'processing':
          setMessage('Your payment is processing.')
          break
        case 'requires_payment_method':
          setMessage('Your payment was not successful, please try again.')
          break
        default:
          setMessage('Something went wrong.')
          break
      }
    })
  }, [stripe, clientSecret, onPaymentSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pay/success`,
      },
      redirect: 'if_required'
    })

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'An error occurred.')
        onPaymentError(error.message || 'Payment failed')
      } else {
        setMessage('An unexpected error occurred.')
        onPaymentError('An unexpected error occurred')
      }
    } else {
      // Payment succeeded
      setMessage('Payment succeeded!')
      onPaymentSuccess('payment_succeeded')
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Service:</span>
            <span className="font-medium">{serviceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Customer:</span>
            <span className="font-medium">{customerName}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total:</span>
            <span>${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.includes('succeeded') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.includes('succeeded') ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock className="h-3 w-3" />
        <span>Secured by Stripe</span>
      </div>
    </form>
  )
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  // Check if we're in demo mode (client secret contains "demo")
  const isDemoMode = props.clientSecret.includes('demo')
  
  if (isDemoMode) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Demo Mode</h3>
          <p className="text-sm text-yellow-700 mb-4">
            This is a demonstration. No real payment will be processed.
          </p>
          <div className="bg-white rounded-lg p-4 border border-yellow-300">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{props.serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{props.customerName}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${props.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => props.onPaymentSuccess('demo_payment_success')}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            <CreditCard className="h-5 w-5 mr-2 inline" />
            Simulate Payment (Demo)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <StripeElements
        stripe={stripePromise}
        options={{
          clientSecret: props.clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#2563eb',
              colorBackground: '#ffffff',
              colorText: '#1f2937',
              colorDanger: '#dc2626',
              fontFamily: 'Inter, system-ui, sans-serif',
              spacingUnit: '4px',
              borderRadius: '8px',
            },
          },
        }}
      >
        <PaymentForm {...props} />
      </StripeElements>
    </div>
  )
}
