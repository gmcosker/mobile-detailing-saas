'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { smsService, smsTemplates } from '@/lib/sms'
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Car,
  DollarSign,
  Bell,
  Navigation,
  Copy,
  Check
} from 'lucide-react'

interface SMSManagerProps {
  customerName: string
  customerPhone: string
  businessName?: string
  appointmentDetails?: {
    serviceType: string
    date: string
    time: string
    amount?: number
    paymentLink?: string
  }
}

type MessageType = 'reminder' | 'confirmation' | 'onmyway' | 'complete' | 'payment' | 'custom'

export default function SMSManager({ 
  customerName, 
  customerPhone, 
  businessName = 'Premium Auto Detailing',
  appointmentDetails 
}: SMSManagerProps) {
  const [selectedType, setSelectedType] = useState<MessageType>('reminder')
  const [customMessage, setCustomMessage] = useState('')
  const [eta, setEta] = useState('15')
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; messageId?: string; error?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const messageTypes = [
    {
      type: 'reminder' as MessageType,
      label: 'Appointment Reminder',
      icon: Bell,
      description: '24-hour reminder',
      color: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
    },
    {
      type: 'confirmation' as MessageType,
      label: 'Appointment Confirmation',
      icon: CheckCircle,
      description: 'Booking confirmed',
      color: 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'
    },
    {
      type: 'onmyway' as MessageType,
      label: 'On My Way',
      icon: Navigation,
      description: 'En route notification',
      color: 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400'
    },
    {
      type: 'complete' as MessageType,
      label: 'Service Complete',
      icon: Car,
      description: 'Job finished',
      color: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
    },
    {
      type: 'payment' as MessageType,
      label: 'Payment Reminder',
      icon: DollarSign,
      description: 'Invoice follow-up',
      color: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
    },
    {
      type: 'custom' as MessageType,
      label: 'Custom Message',
      icon: MessageSquare,
      description: 'Write your own',
      color: 'bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-400'
    }
  ]

  const generateMessage = (): string => {
    if (!appointmentDetails && selectedType !== 'custom') {
      return 'Appointment details required for this message type'
    }

    switch (selectedType) {
      case 'reminder':
        return appointmentDetails ? smsTemplates.appointmentReminder(
          customerName,
          appointmentDetails.serviceType,
          appointmentDetails.date,
          appointmentDetails.time,
          businessName
        ) : ''
      
      case 'confirmation':
        return appointmentDetails ? smsTemplates.appointmentConfirmation(
          customerName,
          appointmentDetails.serviceType,
          appointmentDetails.date,
          appointmentDetails.time,
          businessName
        ) : ''
      
      case 'onmyway':
        return smsTemplates.onMyWay(customerName, businessName, eta)
      
      case 'complete':
        return smsTemplates.serviceComplete(
          customerName, 
          businessName, 
          appointmentDetails?.paymentLink
        )
      
      case 'payment':
        return appointmentDetails?.amount ? smsTemplates.paymentReminder(
          customerName,
          appointmentDetails.amount.toString(),
          appointmentDetails.paymentLink || '#',
          businessName
        ) : 'Payment amount required'
      
      case 'custom':
        return customMessage
      
      default:
        return ''
    }
  }

  const handleSendSMS = async () => {
    const message = generateMessage()
    if (!message || message.includes('required')) {
      alert('Please complete the message details')
      return
    }

    setSending(true)
    try {
      // Send SMS via API
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: customerPhone,
          message: message
        })
      })

      const result = await response.json()
      setLastResult(result)
      
      if (result.success) {
        // Reset form after successful send
        if (selectedType === 'custom') {
          setCustomMessage('')
        }
        // Show success message
        console.log('SMS sent successfully!')
      } else {
        console.error(`Failed to send SMS: ${result.error}`)
      }
    } catch (error) {
      console.error('SMS send error:', error)
      setLastResult({
        success: false,
        error: 'Failed to send message'
      })
      alert('Failed to send SMS. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const copyMessage = async () => {
    const message = generateMessage()
    if (message && !message.includes('required')) {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const currentMessage = generateMessage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Send SMS</h3>
        <p className="text-sm text-muted-foreground">
          Send automated messages to {customerName} ({smsService.formatPhoneNumber(customerPhone)})
        </p>
      </div>

      {/* Message Type Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Message Type</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {messageTypes.map((type) => {
            const Icon = type.icon
            const isSelected = selectedType === type.type
            
            return (
              <button
                key={type.type}
                onClick={() => setSelectedType(type.type)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-foreground hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1 rounded ${type.color}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="font-medium text-xs">{type.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Special Inputs */}
      {selectedType === 'onmyway' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Estimated Arrival (minutes)</label>
          <input
            type="number"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
            min="1"
            max="120"
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
            placeholder="15"
          />
        </div>
      )}

      {selectedType === 'custom' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Custom Message</label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type your custom message..."
            maxLength={160}
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground h-24 resize-none"
          />
          <div className="text-xs text-muted-foreground text-right">
            {customMessage.length}/160 characters
          </div>
        </div>
      )}

      {/* Message Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Message Preview</label>
          <Button
            onClick={copyMessage}
            variant="ghost"
            size="sm"
            className="gap-2 h-8"
            disabled={!currentMessage || currentMessage.includes('required')}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm text-foreground whitespace-pre-wrap">
            {currentMessage || 'Select a message type to preview'}
          </div>
        </div>
      </div>

      {/* Send Button */}
      <Button
        onClick={handleSendSMS}
        disabled={sending || !currentMessage || currentMessage.includes('required')}
        className="w-full gap-2"
      >
        {sending ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send SMS
          </>
        )}
      </Button>

      {/* Result Display */}
      {lastResult && (
        <div className={`rounded-lg p-4 border ${
          lastResult.success 
            ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {lastResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <span className={`font-medium ${
              lastResult.success 
                ? 'text-green-800 dark:text-green-200' 
                : 'text-red-800 dark:text-red-200'
            }`}>
              {lastResult.success ? 'Message Sent!' : 'Send Failed'}
            </span>
          </div>
          <p className={`text-sm mt-1 ${
            lastResult.success 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-red-700 dark:text-red-300'
          }`}>
            {lastResult.success 
              ? `SMS delivered to ${smsService.formatPhoneNumber(customerPhone)}${lastResult.messageId ? ` (ID: ${lastResult.messageId})` : ''}`
              : lastResult.error || 'Unknown error occurred'
            }
          </p>
        </div>
      )}

      {/* SMS Tips */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-2">SMS Best Practices</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Send reminders 24 hours before appointments</li>
          <li>• Keep messages under 160 characters when possible</li>
          <li>• Always include your business name</li>
          <li>• Include "Reply STOP to opt out" for marketing messages</li>
          <li>• Send "On My Way" messages 15-30 minutes before arrival</li>
        </ul>
      </div>
    </div>
  )
}



