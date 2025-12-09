'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import InvoiceGenerator from './InvoiceGenerator'
import PaymentProcessor from './PaymentProcessor'
import { paymentService } from '@/lib/stripe'
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Send,
  Eye,
  Calendar,
  ArrowLeft,
  CreditCard,
  Banknote,
  Receipt
} from 'lucide-react'

export default function PaymentsPage() {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          console.error('No auth token found')
          setLoading(false)
          return
        }

        // Fetch payment history
        const paymentsResponse = await fetch('/api/payments/history?limit=100', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json()
          if (paymentsData.success && paymentsData.payments) {
            // Transform payment data to match expected format
            const transformedPayments = paymentsData.payments.map((apt: any) => ({
              id: apt.stripe_payment_intent_id || apt.id,
              amount: apt.total_amount || 0,
              status: apt.payment_status === 'paid' ? 'succeeded' : apt.payment_status || 'pending',
              customer: apt.customers?.name || 'Unknown Customer',
              service: apt.service_type || 'Service',
              created: apt.created_at || apt.scheduled_date,
              description: `${apt.service_type} - Mobile Detailing Service`
            }))
            setPayments(transformedPayments)
          }
        }

        // Fetch completed appointments for invoice sending
        const appointmentsResponse = await fetch('/api/appointments?status=completed&limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json()
          if (appointmentsData.success && appointmentsData.appointments) {
            // Filter for appointments that might need invoices (completed but not paid)
            const invoiceAppointments = appointmentsData.appointments
              .filter((apt: any) => apt.payment_status !== 'paid')
              .map((apt: any) => ({
                id: apt.id,
                customerName: apt.customers?.name || 'Unknown Customer',
                customerEmail: apt.customers?.email || null,
                customerPhone: apt.customers?.phone || null,
                serviceType: apt.service_type || 'Service',
                scheduledDate: apt.scheduled_date,
                amount: apt.total_amount || 0,
                status: apt.status
              }))
            setAppointments(invoiceAppointments)
          }
        }
      } catch (error) {
        console.error('Error fetching payments data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate stats
  const totalEarnings = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const platformFees = totalEarnings * 0.029
  const netEarnings = totalEarnings - platformFees
  
  const pendingPayments = payments.filter(p => p.status === 'pending').length
  const thisWeekEarnings = payments
    .filter(p => p.status === 'succeeded' && new Date(p.created) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((sum, p) => sum + p.amount, 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
      case 'pending':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400'
      case 'failed':
        return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleInvoiceSent = (invoiceUrl: string) => {
    console.log('Invoice sent:', invoiceUrl)
    // In a real app, you might want to update the appointment status
    setSelectedAppointment(null)
  }

  // Show invoice generator
  if (selectedAppointment) {
    return (
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedAppointment(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Send Invoice</h2>
              <p className="text-sm text-muted-foreground">
                Create payment request for completed service
              </p>
            </div>
          </div>

          <InvoiceGenerator
            appointmentId={selectedAppointment.id}
            customerName={selectedAppointment.customerName}
            customerEmail={selectedAppointment.customerEmail}
            customerPhone={selectedAppointment.customerPhone}
            serviceType={selectedAppointment.serviceType}
            defaultAmount={selectedAppointment.amount}
            onInvoiceSent={handleInvoiceSent}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Payments</h2>
        <p className="text-muted-foreground">
          Manage invoices, track payments, and monitor earnings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 dark:bg-green-950 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {paymentService.formatCurrency(netEarnings)}
              </div>
              <div className="text-sm text-muted-foreground">Net Earnings</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {paymentService.formatCurrency(thisWeekEarnings)}
              </div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 dark:bg-orange-950 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{pendingPayments}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded-lg">
              <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {paymentService.formatCurrency(platformFees)}
              </div>
              <div className="text-sm text-muted-foreground">Platform Fees</div>
            </div>
          </div>
        </div>
      </div>


      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">
            Send invoices for completed appointments
          </p>
        </div>

        <div className="divide-y divide-border">
          {appointments.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No appointments available for invoicing</p>
              <p className="text-sm text-muted-foreground mt-2">
                Completed appointments that haven't been paid will appear here
              </p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium text-foreground">{appointment.customerName}</div>
                  <div className="text-sm text-muted-foreground">
                    {appointment.serviceType} • {appointment.scheduledDate} • {paymentService.formatCurrency(appointment.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {appointment.customerPhone}
                    {appointment.customerEmail && ` • ${appointment.customerEmail}`}
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedAppointment(appointment)}
                  size="sm"
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Invoice
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Payments</h3>
          <p className="text-sm text-muted-foreground">
            Track payment status and history
          </p>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payments found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Payments will appear here once customers complete their transactions
              </p>
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    payment.status === 'succeeded' 
                      ? 'bg-green-50 dark:bg-green-950' 
                      : payment.status === 'pending'
                      ? 'bg-orange-50 dark:bg-orange-950'
                      : 'bg-red-50 dark:bg-red-950'
                  }`}>
                    {payment.status === 'succeeded' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : payment.status === 'pending' ? (
                      <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">
                      {paymentService.formatCurrency(payment.amount)} - {payment.customer}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {payment.service} • {formatDate(payment.created)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Earnings Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gross Revenue:</span>
            <span className="text-foreground">{paymentService.formatCurrency(totalEarnings)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform Fees (2.9%):</span>
            <span className="text-red-600">-{paymentService.formatCurrency(platformFees)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between font-medium">
            <span className="text-foreground">Net Earnings:</span>
            <span className="text-green-600">{paymentService.formatCurrency(netEarnings)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}



