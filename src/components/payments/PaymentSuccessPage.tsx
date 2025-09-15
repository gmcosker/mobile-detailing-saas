'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  CheckCircle, 
  Calendar, 
  Phone, 
  Mail,
  ArrowRight,
  Download,
  Share2
} from 'lucide-react'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  
  const [paymentData, setPaymentData] = useState({
    amount: 150.00,
    serviceType: 'Full Detail',
    appointmentDate: '2024-01-20',
    appointmentTime: '10:00 AM',
    detailerName: 'Mike\'s Mobile Detailing',
    detailerPhone: '+1 (555) 123-4567',
    detailerEmail: 'mike@mobilesdetailing.com'
  })

  const handleDownloadReceipt = () => {
    // In production, this would generate and download a PDF receipt
    console.log('Downloading receipt for payment:', paymentId)
    alert('Receipt download would be implemented here')
  }

  const handleShareAppointment = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Appointment Confirmed',
        text: `Your ${paymentData.serviceType} appointment with ${paymentData.detailerName} is confirmed for ${paymentData.appointmentDate} at ${paymentData.appointmentTime}`,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `Your ${paymentData.serviceType} appointment with ${paymentData.detailerName} is confirmed for ${paymentData.appointmentDate} at ${paymentData.appointmentTime}`
      )
      alert('Appointment details copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Payment Successful</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmed!</h2>
          <p className="text-gray-600">
            Your payment of <span className="font-semibold">${paymentData.amount.toFixed(2)}</span> has been processed successfully.
          </p>
        </div>

        {/* Appointment Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">{paymentData.appointmentDate}</p>
                <p className="text-sm text-gray-600">{paymentData.appointmentTime}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-600">S</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{paymentData.serviceType}</p>
                <p className="text-sm text-gray-600">Mobile Detailing Service</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">{paymentData.detailerName}</p>
                <p className="text-sm text-gray-600">{paymentData.detailerPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>You'll receive a confirmation email shortly</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>A text reminder will be sent 24 hours before your appointment</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <p>Your detailer will arrive at the scheduled time and location</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleDownloadReceipt}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Receipt
          </button>

          <button
            onClick={handleShareAppointment}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share Appointment
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            Continue to Home
          </button>
        </div>

        {/* Contact Information */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="mb-2">Need to make changes to your appointment?</p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href={`tel:${paymentData.detailerPhone}`}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <Phone className="h-3 w-3" />
              Call {paymentData.detailerName}
            </a>
            <a 
              href={`mailto:${paymentData.detailerEmail}`}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <Mail className="h-3 w-3" />
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
