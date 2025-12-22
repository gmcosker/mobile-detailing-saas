# Quick Start: Get Everything Working

This is a streamlined guide to get SMS, Stripe, and Email working ASAP.

---

## 📱 SMS: AWS SNS (10 minutes)

**Why AWS SNS:** Already coded, works with Gmail, reliable, cheap ($0.006/SMS)

### Steps:

1. **AWS Account** (2 min)
   - Go to https://aws.amazon.com/ (Gmail works!)
   - **FREE plan works perfectly** - includes 1,000 free SMS/month
   - Sign up → Add payment method
   - You get $200 credits + 1,000 free SMS/month for testing

2. **Get Credentials** (2 min)
   ```
   Option A (Recommended): IAM User
   → IAM Console → LEFT SIDEBAR: Click "Users"
   → Create user → Name: sms-service-user
   → Attach policy: AmazonSNSFullAccess
   → Create user → Click the new user
   → Security credentials tab → Create access key
   → Application running outside AWS → Create
   → Copy Access Key ID + Secret Access Key (save secret - you won't see it again!)
   
   Option B: Root User (quick but less secure - don't use this)
   → Your Name (top right) → Security Credentials
   → Create Access Key → Check "I understand..." → Create
   → Copy keys
   ```

3. **CRITICAL: Request SMS Limit** (1 min)
   ```
   AWS Console → SNS → Text messaging → Account preferences
   → Request increase → Set to $10/month
   → Approve (usually instant)
   ```

4. **Get Phone Number** (2 min)
   ```
   SNS → Phone numbers → Request phone number → US
   → Copy number (format: +15551234567)
   ```

5. **Add to `.env.local`** (1 min)
   ```bash
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=your_secret_here
   AWS_REGION=us-east-1
   AWS_SNS_PHONE_NUMBER=+15551234567
   ```

6. **Test** (2 min)
   - Restart dev server: `npm run dev`
   - Go to dashboard → SMS page
   - Send test SMS to your phone
   - ✅ Done!

---

## 💳 Stripe: SaaS Subscriptions (15 minutes)

### Steps:

1. **Create Stripe Account** (5 min)
   - https://stripe.com/
   - Get keys: Dashboard → Developers → API keys
   - Copy: `pk_test_...` and `sk_test_...`

2. **Create Subscription Products** (5 min)
   ```
   Products → Create Product
   
   Starter: $17/month → Copy price_xxxxx
   Professional: $79/month → Copy price_xxxxx
   Business: $149/month → Copy price_xxxxx
   ```

3. **Set Up Webhook** (3 min)
   ```
   Developers → Webhooks → Add endpoint
   URL: https://your-domain.vercel.app/api/webhooks/stripe
   Events: customer.subscription.*, invoice.payment_*
   → Copy webhook secret (whsec_...)
   ```

4. **Add to `.env.local`** (2 min)
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   STRIPE_STARTER_PRICE_ID=price_xxxxx
   STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
   STRIPE_BUSINESS_PRICE_ID=price_xxxxx
   
   NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your domain
   ```

5. **Test**
   - Sign up new account → Get 14-day trial
   - Go to upgrade page → Select plan
   - Complete Stripe Checkout
   - ✅ Done!

---

## 💰 Stripe Connect: Customer → Detailer Payments (20 minutes)

**What This Does:** When customers pay detailers, money goes to detailer's Stripe account, you take platform fee.

### Steps:

1. **Enable Connect** (5 min)
   ```
   Stripe Dashboard → Connect → Get Started
   → Express Accounts → Complete onboarding
   ```

2. **Code is Already Updated!** ✅
   - Connect accounts created on signup
   - Payment intents route to detailer accounts
   - Platform fee automatically deducted

3. **Test** (10 min)
   - Create detailer account (Connect account auto-created)
   - Create appointment with amount
   - Generate payment link
   - Complete payment as customer
   - Check:
     - Payment appears in detailer's Stripe dashboard
     - Platform fee appears in YOUR Stripe dashboard
   - ✅ Done!

**Note:** Detailers need to complete Stripe onboarding before receiving payments. You'll need to send them the onboarding link (code for this is in `connectService.createOnboardingLink()`).

---

## 📧 Email Capture → Kit (15 minutes)

### Steps:

1. **Get Kit API Credentials** (3 min)
   ```
   ConvertKit Dashboard → Settings → Advanced → API Secret
   → Copy API Secret
   → Note API Key (visible in URL or settings)
   ```

2. **Create Form in Kit** (3 min)
   ```
   Forms → Create Form
   → Name it "Free Guide"
   → Copy Form ID (number, like 1234567)
   ```

3. **Add to `.env.local`** (1 min)
   ```bash
   CONVERTKIT_API_KEY=your_api_key
   CONVERTKIT_API_SECRET=your_api_secret
   CONVERTKIT_FORM_ID=1234567
   ```

4. **Code is Already Done!** ✅
   - `src/lib/kit.ts` created
   - `src/app/api/leads/route.ts` updated
   - Emails automatically added to Kit

5. **Test** (5 min)
   - Go to homepage
   - Submit email in capture form
   - Check:
     - Supabase `leads` table (should have email)
     - ConvertKit dashboard (should have subscriber)
     - Subscriber should be tagged with 'free_guide'
   - ✅ Done!

---

## 🎯 Complete `.env.local` Template

Copy this and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# SMS (AWS SNS)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_SNS_PHONE_NUMBER=+15551234567

# Stripe - SaaS Subscriptions
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Stripe Connect (uses same keys as above, just enable Connect in dashboard)

# Email - ConvertKit
CONVERTKIT_API_KEY=xxx
CONVERTKIT_API_SECRET=xxx
CONVERTKIT_FORM_ID=1234567

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ✅ Final Checklist

- [ ] SMS: AWS SNS credentials added → Test SMS works
- [ ] Stripe SaaS: Products created → Test subscription works
- [ ] Stripe Connect: Enabled in dashboard → Test customer payment routes to detailer
- [ ] Kit: Form created → Test email capture adds to Kit

---

## 🐛 Troubleshooting

**SMS not working?**
- Check AWS SNS spending limit was increased (default $1 won't work)
- Verify phone number format: +15551234567
- Check AWS credentials are correct
- Look at console logs for specific errors

**Stripe Connect not working?**
- Verify Connect is enabled in Stripe dashboard
- Check detailer has `stripe_account_id` in database
- Ensure detailer completed Stripe onboarding
- Test with Stripe test mode first

**Kit not receiving emails?**
- Verify API key and secret are correct
- Check form ID matches ConvertKit dashboard
- Look at console logs for Kit API errors
- Test API directly: `curl` to ConvertKit API

---

## 🚀 You're Ready!

Once all three are set up:
1. SMS reminders work automatically
2. Detailers can accept customer payments
3. New leads automatically enter your email sequence

Need help? Check the detailed `SETUP_GUIDE.md` for more info.
