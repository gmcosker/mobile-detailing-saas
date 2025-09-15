'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { paymentService } from '@/lib/stripe'
import { 
  DollarSign, 
  Send, 
  Link2, 
  Copy, 
  Check,
  Calculator,
  CreditCard,
  Mail
} from 'lucide-react'

interface InvoiceGeneratorProps {
  appointmentId: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  serviceType: string
  defaultAmount?: number
  onInvoiceSent?: (invoiceUrl: string) => void
}

export default function InvoiceGenerator({
  appointmentId,
  customerName,
  customerEmail,
  customerPhone,
  serviceType,
  defaultAmount = 0,
  onInvoiceSent
}: InvoiceGeneratorProps) {
  const [amount, setAmount] = useState(defaultAmount.toString())
  const [description, setDescription] = useState(`${serviceType} - Mobile Detailing Service`)
  const [loading, setLoading] = useState(false)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sendMethod, setSendMethod] = useState<'email' | 'link'>('email')

  const platformFeePercent = 2.9
  const amountNum = parseFloat(amount) || 0
  const platformFee = paymentService.calculatePlatformFee(amountNum, platformFeePercent)
  const detailerAmount = amountNum - platformFee

  const handleGenerateInvoice = async () => {
    if (!amount || amountNum <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      if (sendMethod === 'email' && customerEmail) {
        // Create traditional invoice sent via email
        const customer = await paymentService.createOrGetCustomer(
          customerEmail,
          customerName,
          customerPhone
        )

        if (!customer) {
          throw new Error('Failed to create customer')
        }

        const invoice = await paymentService.createInvoice(
          customer.id,
          amountNum,
          description
        )

        if (invoice) {
          setInvoiceUrl(invoice.hosted_invoice_url || null)
          onInvoiceSent?.(invoice.hosted_invoice_url || '')
        }
      } else {
        // Create payment link for sharing
        const paymentLink = await paymentService.createPaymentLink(
          amountNum,
          description,
          platformFeePercent
        )

        if (paymentLink) {
          setInvoiceUrl(paymentLink.url)
          onInvoiceSent?.(paymentLink.url)
        }
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      alert('Failed to generate invoice. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (invoiceUrl) {
      await navigator.clipboard.writeText(invoiceUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const sendViaText = () => {
    if (invoiceUrl) {
      const message = `Hi ${customerName}, here's your invoice for ${serviceType}: ${invoiceUrl}`
      const smsUrl = `sms:${customerPhone}?body=${encodeURIComponent(message)}`
      window.open(smsUrl, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Send Invoice</h3>
        <p className="text-sm text-muted-foreground">
          Generate and send a payment request to {customerName}
        </p>
      </div>

      {/* Customer Info */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="space-y-2 text-sm">
          <div><strong>Customer:</strong> {customerName}</div>
          <div><strong>Phone:</strong> {customerPhone}</div>
          {customerEmail && <div><strong>Email:</strong> {customerEmail}</div>}
          <div><strong>Service:</strong> {serviceType}</div>
        </div>
      </div>

      {/* Send Method Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Send Method</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSendMethod('email')}
            disabled={!customerEmail}
            className={`p-3 rounded-lg border text-left transition-colors ${
              sendMethod === 'email' && customerEmail
                ? 'border-primary bg-primary/10 text-primary'
                : customerEmail
                ? 'border-border bg-card text-foreground hover:border-primary/50'
                : 'border-border bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4" />
              <span className="font-medium">Email Invoice</span>
            </div>
            <p className="text-xs">
              {customerEmail ? 'Traditional invoice via email' : 'Email required'}
            </p>
          </button>

          <button
            onClick={() => setSendMethod('link')}
            className={`p-3 rounded-lg border text-left transition-colors ${
              sendMethod === 'link'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-foreground hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="h-4 w-4" />
              <span className="font-medium">Payment Link</span>
            </div>
            <p className="text-xs">Share via text or any app</p>
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Amount</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Service description..."
          className="w-full p-3 border border-border rounded-lg bg-background text-foreground h-20 resize-none"
        />
      </div>

      {/* Fee Breakdown */}
      {amountNum > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Fee Breakdown</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Amount:</span>
              <span className="text-foreground">{paymentService.formatCurrency(amountNum)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee ({platformFeePercent}%):</span>
              <span className="text-red-600">-{paymentService.formatCurrency(platformFee)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-medium">
              <span className="text-foreground">You Receive:</span>
              <span className="text-green-600">{paymentService.formatCurrency(detailerAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      {!invoiceUrl ? (
        <Button
          onClick={handleGenerateInvoice}
          disabled={loading || !amount || amountNum <= 0}
          className="w-full gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Generate {sendMethod === 'email' ? 'Invoice' : 'Payment Link'}
            </>
          )}
        </Button>
      ) : (
        /* Success State */
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-200">
                {sendMethod === 'email' ? 'Invoice Sent!' : 'Payment Link Created!'}
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              {sendMethod === 'email' 
                ? `Invoice sent to ${customerEmail}`
                : 'Share this link with your customer'
              }
            </p>
          </div>

          {/* Link Actions */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-2">Payment Link:</div>
            <div className="flex gap-2">
              <input
                value={invoiceUrl}
                readOnly
                className="flex-1 p-2 text-sm border border-border rounded bg-muted text-muted-foreground"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Share Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={sendViaText}
              variant="outline"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send via Text
            </Button>
            <Button
              onClick={() => window.open(invoiceUrl, '_blank')}
              variant="outline"
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Preview
            </Button>
          </div>

          {/* Reset */}
          <Button
            onClick={() => {
              setInvoiceUrl(null)
              setCopied(false)
            }}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            Create Another Invoice
          </Button>
        </div>
      )}
    </div>
  )
}



