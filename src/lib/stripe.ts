import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance
let stripe: Stripe | null = null

function getStripeInstance(): Stripe | null {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey || secretKey.includes('your_stripe') || secretKey === 'sk_test_dummy') {
      console.log('⚠️ Stripe not configured - using demo mode')
      return null
    }
    
    try {
      stripe = new Stripe(secretKey, {
        apiVersion: '2024-06-20',
      })
    } catch (error) {
      console.error('❌ Failed to initialize Stripe:', error)
      return null
    }
  }
  return stripe
}

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy')
  }
  return stripePromise
}

// Payment processing utilities
export const paymentService = {
  // Create a payment intent for immediate payment
  async createPaymentIntent(
    amount: number, 
    currency: string = 'usd',
    applicationFeeAmount?: number,
    stripeAccountId?: string
  ): Promise<Stripe.PaymentIntent | null> {
    const stripeInstance = getStripeInstance()
    
    if (!stripeInstance) {
      // Demo mode - return a mock payment intent
      console.log('🎭 Demo mode: Creating mock payment intent')
      const paymentIntentId = `pi_demo_${Date.now()}`
      return {
        id: paymentIntentId,
        object: 'payment_intent',
        amount: Math.round(amount * 100),
        currency,
        status: 'requires_payment_method',
        client_secret: `${paymentIntentId}_secret_demo1234567890abcdef`,
        created: Math.floor(Date.now() / 1000),
        metadata: {
          type: 'mobile_detailing_service',
          demo: 'true'
        }
      } as any
    }

    try {
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        application_fee_amount: applicationFeeAmount ? Math.round(applicationFeeAmount * 100) : undefined,
        transfer_data: stripeAccountId ? {
          destination: stripeAccountId,
        } : undefined,
        metadata: {
          type: 'mobile_detailing_service',
        },
      })

      return paymentIntent
    } catch (error) {
      console.error('Error creating payment intent:', error)
      return null
    }
  },

  // Get a payment intent by ID
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
    const stripeInstance = getStripeInstance()
    
    if (!stripeInstance) {
      // Demo mode - return a mock payment intent
      console.log('🎭 Demo mode: Returning mock payment intent')
      return {
        id: paymentIntentId,
        object: 'payment_intent',
        amount: 2000,
        currency: 'usd',
        status: 'succeeded',
        client_secret: `${paymentIntentId}_secret_demo1234567890abcdef`,
        created: Math.floor(Date.now() / 1000),
        metadata: {
          type: 'mobile_detailing_service',
          demo: 'true'
        }
      } as any
    }

    try {
      const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId)
      return paymentIntent
    } catch (error) {
      console.error('Error retrieving payment intent:', error)
      return null
    }
  },

  // Create an invoice for later payment
  async createInvoice(
    customerId: string,
    amount: number,
    description: string,
    stripeAccountId?: string
  ): Promise<Stripe.Invoice | null> {
    try {
      // Create invoice item
      const invoiceItem = await stripe.invoiceItems.create({
        customer: customerId,
        amount: Math.round(amount * 100),
        currency: 'usd',
        description,
      }, {
        stripeAccount: stripeAccountId,
      })

      // Create invoice
      const invoice = await stripe.invoices.create({
        customer: customerId,
        collection_method: 'send_invoice',
        days_until_due: 7,
        metadata: {
          type: 'mobile_detailing_invoice',
        },
      }, {
        stripeAccount: stripeAccountId,
      })

      // Send invoice
      const sentInvoice = await stripe.invoices.sendInvoice(invoice.id, {
        stripeAccount: stripeAccountId,
      })

      return sentInvoice
    } catch (error) {
      console.error('Error creating invoice:', error)
      return null
    }
  },

  // Create or retrieve a customer
  async createOrGetCustomer(
    email: string,
    name: string,
    phone?: string,
    stripeAccountId?: string
  ): Promise<Stripe.Customer | null> {
    try {
      // Try to find existing customer
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      }, {
        stripeAccount: stripeAccountId,
      })

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0]
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name,
        phone,
        metadata: {
          source: 'mobile_detailing_app',
        },
      }, {
        stripeAccount: stripeAccountId,
      })

      return customer
    } catch (error) {
      console.error('Error creating/getting customer:', error)
      return null
    }
  },

  // Create a payment link for easy sharing
  async createPaymentLink(
    amount: number,
    description: string,
    applicationFeePercent: number = 2.9 // Platform fee percentage
  ): Promise<Stripe.PaymentLink | null> {
    try {
      // First create a product
      const product = await stripe.products.create({
        name: description,
        type: 'service',
      })

      // Create a price
      const price = await stripe.prices.create({
        unit_amount: Math.round(amount * 100),
        currency: 'usd',
        product: product.id,
      })

      // Calculate application fee
      const applicationFeeAmount = Math.round(amount * (applicationFeePercent / 100) * 100)

      // Create payment link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        application_fee_amount: applicationFeeAmount,
        metadata: {
          type: 'mobile_detailing_service',
          original_amount: amount.toString(),
          platform_fee_percent: applicationFeePercent.toString(),
        },
      })

      return paymentLink
    } catch (error) {
      console.error('Error creating payment link:', error)
      return null
    }
  },

  // Get payment status
  async getPaymentStatus(paymentIntentId: string): Promise<string | null> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      return paymentIntent.status
    } catch (error) {
      console.error('Error getting payment status:', error)
      return null
    }
  },

  // List recent payments
  async getRecentPayments(
    limit: number = 10,
    stripeAccountId?: string
  ): Promise<Stripe.PaymentIntent[]> {
    try {
      const payments = await stripe.paymentIntents.list({
        limit,
      }, {
        stripeAccount: stripeAccountId,
      })

      return payments.data
    } catch (error) {
      console.error('Error fetching payments:', error)
      return []
    }
  },

  // Calculate platform fee
  calculatePlatformFee(amount: number, feePercent: number = 2.9): number {
    return Math.round((amount * feePercent / 100) * 100) / 100
  },

  // Format currency
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }
}

// Stripe Connect utilities for onboarding detailers
export const connectService = {
  // Create a Connect account for a detailer
  async createConnectAccount(
    businessName: string,
    email: string,
    country: string = 'US'
  ): Promise<Stripe.Account | null> {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        business_profile: {
          name: businessName,
          product_description: 'Mobile auto detailing services',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })

      return account
    } catch (error) {
      console.error('Error creating Connect account:', error)
      return null
    }
  },

  // Create an onboarding link
  async createOnboardingLink(accountId: string): Promise<string | null> {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/refresh`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/complete`,
        type: 'account_onboarding',
      })

      return accountLink.url
    } catch (error) {
      console.error('Error creating onboarding link:', error)
      return null
    }
  },

  // Check account status
  async getAccountStatus(accountId: string): Promise<{
    detailsSubmitted: boolean
    chargesEnabled: boolean
    payoutsEnabled: boolean
  } | null> {
    try {
      const account = await stripe.accounts.retrieve(accountId)
      
      return {
        detailsSubmitted: account.details_submitted || false,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
      }
    } catch (error) {
      console.error('Error getting account status:', error)
      return null
    }
  }
}

export default stripe



