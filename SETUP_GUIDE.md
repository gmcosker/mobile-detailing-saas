# Complete Setup Guide: SMS, Stripe, and Email

This guide covers everything you need to get SMS, Stripe payments (both SaaS subscriptions AND customer-to-detailer payments), and email nurture sequences working.

---

## 📱 SMS Setup (Multiple Provider Options)

You've had trouble with SMS providers. Here are three reliable options, ranked by ease:

### Option 1: AWS SNS (Recommended - Already Implemented)

**Why AWS SNS:**
- ✅ Already coded in your app (`src/lib/sms.ts`)
- ✅ Accepts Gmail addresses
- ✅ No approval delays (just request SMS limit increase)
- ✅ Very reliable (AWS infrastructure)
- ✅ Cheap: ~$0.006 per SMS

**Setup Steps:**

1. **Sign up for AWS** (if needed)
   - Go to https://aws.amazon.com/
   - **You can use the FREE plan** - it works perfectly for SMS testing
   - Free tier includes: 1,000 SMS/month free forever (Always Free tier)
   - Plus $200 in credits to get started
   - Create account (Gmail works fine)
   - Add payment method (you only pay for what you use beyond free tier)

2. **Get AWS Credentials** (Recommended: Use IAM User, not root user)
   
   **Option A: IAM User (Recommended - More Secure)**
   ```
   Step 1: Create IAM User
   1. You're already in IAM (good!)
   2. In LEFT SIDEBAR → Click "Users" (under "Access management")
   3. Click blue "Create user" button
   4. User name: sms-service-user
   5. Click "Next"
   
   Step 2: Set Permissions
   6. Select "Attach policies directly"
   7. In search box, type: AmazonSNSFullAccess
   8. Check the box next to "AmazonSNSFullAccess"
   9. Click "Next"
   
   Step 3: Review & Create
   10. Review → Click "Create user"
   
   Step 4: Create Access Keys
   11. Click on the user you just created (sms-service-user)
   12. Click "Security credentials" tab
   13. Scroll to "Access keys" section
   14. Click "Create access key"
   15. Select "Application running outside AWS" → Next
   16. Description (optional): "SMS service for mobile detailing app"
   17. Click "Create access key"
   18. IMPORTANT: Copy BOTH the Access Key ID and Secret Access Key
      (You won't see the secret again!)
   ```
   
   **Option B: Root User (Quick but less secure - not recommended)**
   ```
   AWS Console → Your Name → Security Credentials
   → Access Keys → Create Access Key
   → Check "I understand..." → Create access key
   → Copy Access Key ID and Secret Access Key
   ```
   
   ⚠️ Root keys have unlimited permissions. IAM user is safer for production.

3. **Exit SMS Sandbox & Request Production Access** (CRITICAL FOR PRODUCTION!)
   
   **⚠️ IMPORTANT:** Your account is likely in SMS sandbox mode. Sandbox mode only allows sending SMS to manually verified phone numbers - this is NOT suitable for production where detailers add new customers constantly.
   
   **You MUST exit sandbox mode** to send SMS to any phone number automatically (no verification needed). This is a one-time account-level approval - once approved, you can send to ANY phone number.
   
   **Step 1: Request Production Access (Exit Sandbox) - DO THIS FIRST**
   
   Create a Support case via AWS Support Center:
   
   **Step 1: Request via AWS Support**
   1. AWS Console → Search "Support" → Open **AWS Support Center**
   2. Click **"Create case"**
   3. **If you see "Service limit increase" option:** Select it, then choose "SNS Text Messaging"
   
   **If you see a description field instead (current interface):**
   Type this in the description field:
   
   ```
   Request: Exit SMS Sandbox (Production Access) - REQUIRED FOR PRODUCTION USE
   
   Service: Amazon SNS (Simple Notification Service)
   Limit Type: SMS Text Messaging - Exit SMS Sandbox
   Region: us-east-1
   
   Use Case:
   I operate a SaaS platform (DetailFlow) where mobile detailing business owners (detailers) add customers and send SMS notifications automatically. 
   
   **Critical Requirement**: Detailers add new customer phone numbers constantly. Manual phone number verification is NOT feasible. I need production access to send SMS to any phone number automatically without individual verification.
   
   Message Type: Transactional
   Message Types:
   - Appointment confirmations
   - Appointment reminders (24 hours before service)
   - Service completion notifications
   - Payment reminders
   - Booking invitations
   
   Target Country: United States
   Opt-In Process: Customers provide phone numbers when booking appointments through our application or when detailers add them as customers. All messages are transactional notifications related to services customers have requested.
   
   Sample Message Templates:
   - "Hi [Customer Name]! Your [Service Type] appointment with [Business Name] is confirmed for [Date] at [Time]. We'll send a reminder 24 hours before."
   - "Hi [Customer Name]! This is a reminder that your [Service Type] appointment with [Business Name] is scheduled for tomorrow ([Date]) at [Time]."
   
   This is for a legitimate business use case sending only transactional messages. Customers explicitly provide phone numbers when booking services or being added as customers by detailers.
   ```
   
   **Step 2: Request Spending Limit Increase** (If you haven't already)
   
   ⚠️ **Note**: If you already submitted a spending limit increase request (which you did earlier), you can skip this step. Just wait for both approvals:
   - Exit SMS Sandbox approval
   - Spending limit increase approval
   
   If you haven't requested the spending limit increase yet, create a separate support case (or add to the sandbox exit case) with:
   ```
   Request: Service limit increase for SMS spending
   Limit Type: SMS Text Messaging - Account Spend Threshold Increase
   Current Limit: $1/month (default)
   Requested New Limit: $10/month (or higher based on expected volume)
   ```
   
   4. Submit the case (usually approved within hours, sometimes instantly)
   
   **Step 2: Configure Limit After Approval** (choose one method)
   
   **Option A: Via Console** (if console works)
   1. Go back to SNS → Text messaging (SMS)
   2. Click **"Edit preferences"** button (under "Delivery status logs")
   3. Find **"Account spend limit"** field
   4. Enter your approved limit (e.g., `10`)
   5. Click **"Save changes"**
   
   **Option B: Via AWS CLI/API** (if console has errors - recommended backup)
   ```bash
   # Install AWS CLI if needed: https://aws.amazon.com/cli/
   aws sns set-sms-attributes \
     --attributes MonthlySpendLimit=10 \
     --region us-east-1
   ```
   
   Or use AWS SDK in Node.js:
   ```javascript
   const { SNSClient, SetSMSAttributesCommand } = require('@aws-sdk/client-sns');
   const client = new SNSClient({ region: 'us-east-1' });
   await client.send(new SetSMSAttributesCommand({
     attributes: { MonthlySpendLimit: '10' }
   }));
   ```
   
   **⚠️ Critical Notes:** 
   - **EXIT SANDBOX IS REQUIRED**: Without exiting sandbox, you can ONLY send to manually verified numbers. This is NOT workable for production where detailers add new customers constantly. You MUST exit sandbox mode.
   - **Once Approved**: You can send SMS to ANY phone number automatically - no verification needed per number. Detailers can add customers and send SMS immediately.
   - **Spending Limit**: The default $1/month limit is too low (only ~155 SMS at $0.006/SMS). Request $10/month minimum, or higher based on expected volume.
   
   **After Both Are Approved:** 
   - ✅ Send SMS to any US phone number automatically
   - ✅ No phone number verification needed
   - ✅ Detailers can add customers and send SMS immediately
   - ✅ Works seamlessly for production use

4. **Get Phone Number** (Optional - can use Sender ID)
   ```
   SNS → Phone numbers → Request phone number
   → Choose US number
   → Copy the number (format: +15551234567)
   ```

5. **Add to Environment Variables**
   ```bash
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_SNS_PHONE_NUMBER=+15551234567
   ```

6. **Test**
   ```bash
   npm run dev
   # Go to SMS page in dashboard and send test SMS
   ```

---

### Option 2: Twilio (Alternative - Code Ready)

**Why Twilio:**
- ✅ Code already exists in docs (but AWS SNS is primary)
- ✅ Very reliable
- ⚠️ Requires phone number verification (may reject some accounts)
- Cost: ~$0.0075 per SMS

**Setup:**

1. Sign up: https://www.twilio.com/
2. Get phone number from Twilio
3. Get Account SID and Auth Token
4. Add to `.env.local`:
   ```bash
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+15551234567
   ```

Note: You'd need to switch `src/lib/sms.ts` to use Twilio instead of AWS SNS if AWS doesn't work.

---

### Option 3: Resend (Newer Option - Need to Implement)

**Why Resend:**
- ✅ Modern API
- ✅ Good developer experience
- ⚠️ Requires implementation (not yet coded)
- Cost: ~$0.0025 per SMS (cheapest option)

Would need to implement this if AWS/Twilio don't work.

---

## 💳 Stripe Setup (Two-Part: SaaS Subscriptions + Customer Payments)

You need TWO different Stripe setups:

### Part 1: SaaS Subscriptions (You → Detailers)

This is for detailers to pay YOU for using the platform.

**Current Status:** ✅ Partially implemented

**Setup Steps:**

1. **Create Stripe Account**
   - Go to https://stripe.com/
   - Create account
   - Get your API keys:
     - Publishable key: `pk_live_...` or `pk_test_...`
     - Secret key: `sk_live_...` or `sk_test_...`

2. **Create Subscription Products**
   ```
   Stripe Dashboard → Products → Create Product
   
   Create 3 products:
   
   Starter Plan:
   - Name: "DetailFlow Starter"
   - Price: $17/month (recurring)
   - Copy Price ID (price_xxxxx)
   
   Professional Plan:
   - Name: "DetailFlow Professional"  
   - Price: $79/month (recurring)
   - Copy Price ID
   
   Business Plan:
   - Name: "DetailFlow Business"
   - Price: $149/month (recurring)
   - Copy Price ID
   ```

3. **Set Up Webhook** (CRITICAL for subscriptions)
   ```
   Stripe Dashboard → Developers → Webhooks
   → Add endpoint
   → URL: https://your-domain.com/api/webhooks/stripe
   → Select events:
     - customer.subscription.created
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.payment_succeeded
     - invoice.payment_failed
   → Copy webhook signing secret (whsec_...)
   ```

4. **Add Environment Variables**
   ```bash
   # Stripe for SaaS subscriptions
   STRIPE_SECRET_KEY=sk_live_...  # Your platform account
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Subscription price IDs
   STRIPE_STARTER_PRICE_ID=price_xxxxx
   STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
   STRIPE_BUSINESS_PRICE_ID=price_xxxxx
   
   # App URL (for redirects)
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

5. **Test Subscription Flow**
   - Detailer signs up → Gets 14-day trial
   - After trial → Redirected to upgrade page
   - Selects plan → Stripe Checkout
   - Payment succeeds → Subscription active

---

### Part 2: Stripe Connect (Detailers → Customers)

This is for customers to pay detailers, with you taking a platform fee.

**Current Status:** ⚠️ Code exists but NOT fully wired up

**The Problem:**
- Currently, payments go to YOUR Stripe account
- Need to route to detailer's Stripe Connect account
- You take platform fee (e.g., 2.9%)

**What Needs to Happen:**

1. **Enable Stripe Connect in Your Account**
   ```
   Stripe Dashboard → Connect → Get Started
   → Choose "Express Accounts" (recommended)
   → Complete Connect onboarding
   ```

2. **Update Payment Intent Creation**

   Currently in `src/app/api/payments/create-intent/route.ts`:
   ```typescript
   // Current: No Connect account ID
   const paymentIntent = await paymentService.createPaymentIntent(
     amount,
     currency,
     platformFee,
     undefined, // ❌ stripeAccountId is undefined
     metadata
   )
   ```

   **Need to:**
   - Get detailer's `stripe_account_id` from database
   - Pass it to `createPaymentIntent()`
   - Stripe will route payment to detailer, you keep platform fee

3. **Create Connect Account for Each Detailer**

   When detailer signs up:
   - Create Stripe Connect Express account
   - Store `stripe_account_id` in `detailers` table
   - Send detailer onboarding link to complete setup

4. **Update Code** (I'll provide this below)

---

## 📧 Email Capture & Kit Integration

**Current Status:** ✅ Email capture works, ❌ Kit integration missing

**What's Working:**
- ✅ Email capture form on homepage (`/api/leads`)
- ✅ Emails saved to `leads` table in Supabase
- ✅ Lead source tracking

**What's Missing:**
- ❌ Integration with Kit (ConvertKit API)
- ❌ Automatic addition to Kit when email captured
- ❌ Tagging/segmentation in Kit

**Setup Steps:**

1. **Get Kit API Credentials**
   ```
   ConvertKit Dashboard → Settings → Advanced → API Secret
   → Copy API Secret (starts with your_api_secret_...)
   
   Also note your API Key (visible in URL or settings)
   ```

2. **Create Form in Kit**
   - Go to Forms in ConvertKit
   - Create form for "Free Guide" signups
   - Copy Form ID (number)

3. **Add Environment Variables**
   ```bash
   CONVERTKIT_API_KEY=your_api_key
   CONVERTKIT_API_SECRET=your_api_secret
   CONVERTKIT_FORM_ID=1234567  # Your free guide form ID
   ```

4. **Update Leads API** (I'll provide code below)

---

## 🔧 Code Changes Needed

### 1. Wire Up Stripe Connect for Customer Payments

Update `src/app/api/payments/create-intent/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd', appointmentId, customerId } = await request.json()

    // Get appointment to find detailer
    const appointment = await appointmentService.getById(appointmentId)
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Get detailer's Stripe Connect account
    const supabase = getSupabaseClient()
    const { data: detailer } = await supabase
      .from('detailers')
      .select('stripe_account_id')
      .eq('id', appointment.detailer_id)
      .single()

    if (!detailer?.stripe_account_id) {
      return NextResponse.json(
        { success: false, error: 'Detailer has not set up payments yet' },
        { status: 400 }
      )
    }

    // Calculate platform fee (you keep this)
    const platformFee = paymentService.calculatePlatformFee(amount, 2.9)
    
    const metadata = appointmentId ? { appointmentId } : undefined
    
    // Pass detailer's Stripe account ID
    const paymentIntent = await paymentService.createPaymentIntent(
      amount,
      currency,
      platformFee,
      detailer.stripe_account_id, // ✅ This routes to detailer
      metadata
    )
    
    // ... rest of code
  }
}
```

### 2. Create Connect Account on Signup

Update `src/app/api/auth/signup/route.ts` to create Connect account:

```typescript
// After creating detailer record
const connectAccount = await connectService.createConnectAccount(
  detailerData.business_name,
  detailerData.email,
  'US'
)

if (connectAccount) {
  // Store Connect account ID
  await supabase
    .from('detailers')
    .update({ stripe_account_id: connectAccount.id })
    .eq('id', detailerData.id)
  
  // Create onboarding link for detailer
  const onboardingLink = await connectService.createOnboardingLink(connectAccount.id)
  // Store or email this link to detailer
}
```

### 3. Add Kit Integration to Leads API

Create `src/lib/kit.ts`:

```typescript
// ConvertKit API integration
export const kitService = {
  async addSubscriber(email: string, formId: string, tags?: string[]) {
    const apiKey = process.env.CONVERTKIT_API_KEY
    const apiSecret = process.env.CONVERTKIT_API_SECRET
    
    if (!apiKey || !apiSecret) {
      console.warn('[KIT] ConvertKit not configured')
      return { success: false, error: 'Kit not configured' }
    }

    try {
      const response = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          email,
          tags: tags || [],
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add subscriber')
      }

      return { success: true, subscriber: data.subscription }
    } catch (error: any) {
      console.error('[KIT] Error adding subscriber:', error)
      return { success: false, error: error.message }
    }
  },
}
```

Update `src/app/api/leads/route.ts`:

```typescript
import { kitService } from '@/lib/kit'

// After saving to database:
const { data, error } = await supabase
  .from('leads')
  .upsert(...)
  .select()
  .single()

// Add to Kit
const formId = process.env.CONVERTKIT_FORM_ID
if (formId) {
  await kitService.addSubscriber(email, formId, ['free_guide'])
}

return NextResponse.json({ success: true, lead: data })
```

---

## ✅ Quick Start Checklist

### SMS (Choose One)
- [ ] AWS SNS: Get credentials + request SMS limit increase
- [ ] OR Twilio: Sign up + get phone number
- [ ] Add credentials to `.env.local`
- [ ] Test SMS sending from dashboard

### Stripe SaaS Subscriptions
- [ ] Create Stripe account
- [ ] Create 3 subscription products (Starter/Pro/Business)
- [ ] Set up webhook endpoint
- [ ] Add all keys to `.env.local`
- [ ] Test subscription flow

### Stripe Connect (Customer → Detailer Payments)
- [ ] Enable Connect in Stripe Dashboard
- [ ] Update payment intent code (see above)
- [ ] Create Connect accounts on signup (see above)
- [ ] Test customer payment → detailer receives funds

### Kit Email Integration
- [ ] Get ConvertKit API credentials
- [ ] Create form in Kit
- [ ] Create `src/lib/kit.ts` (see code above)
- [ ] Update `src/app/api/leads/route.ts` (see code above)
- [ ] Test email capture → verify in Kit

---

## 🧪 Testing

### Test SMS
1. Go to dashboard → SMS page
2. Enter test phone number
3. Send test message
4. Verify receipt

### Test Stripe Subscriptions
1. Sign up new detailer account
2. Complete 14-day trial
3. Upgrade to paid plan
4. Verify subscription active in Stripe

### Test Connect Payments
1. Create appointment
2. Generate payment link
3. Complete payment as customer
4. Verify:
   - Detailer receives payment in their Stripe account
   - Platform fee deducted (visible in your Stripe dashboard)

### Test Kit Integration
1. Submit email on homepage
2. Check Supabase `leads` table (should have email)
3. Check ConvertKit dashboard (should have subscriber)
4. Verify subscriber tagged correctly

---

## 📞 Need Help?

If you run into issues:
1. Check console logs for specific errors
2. Verify all environment variables are set
3. Test each integration separately
4. Check provider dashboards (AWS/Twilio, Stripe, Kit) for delivery status
