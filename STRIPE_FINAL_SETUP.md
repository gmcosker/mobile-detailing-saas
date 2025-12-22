# Stripe Integration - Final Setup Guide

## 🎯 Complete Checklist

### Step 1: Create Stripe Products & Prices (10 minutes)

**Go to Stripe Dashboard → Products → Create Product**

#### 1. Starter Plan
- **Name:** `DetailFlow Starter`
- **Description:** `Perfect for getting started with mobile detailing`
- **Pricing:**
  - Type: **Recurring**
  - Price: `$17.00`
  - Billing period: **Monthly**
- **After creating:** Copy the **Price ID** (starts with `price_...`)
- **Save as:** `STRIPE_STARTER_PRICE_ID`

#### 2. Professional Plan
- **Name:** `DetailFlow Professional`
- **Description:** `Most popular for growing businesses`
- **Pricing:**
  - Type: **Recurring**
  - Price: `$79.00`
  - Billing period: **Monthly**
- **After creating:** Copy the **Price ID**
- **Save as:** `STRIPE_PROFESSIONAL_PRICE_ID`

#### 3. Business Plan
- **Name:** `DetailFlow Business`
- **Description:** `For established businesses`
- **Pricing:**
  - Type: **Recurring**
  - Price: `$149.00`
  - Billing period: **Monthly**
- **After creating:** Copy the **Price ID**
- **Save as:** `STRIPE_BUSINESS_PRICE_ID`

#### 4. Lifetime Deal
- **Name:** `DetailFlow Lifetime Deal`
- **Description:** `Everything in Professional with lifetime access`
- **Pricing:**
  - Type: **One-time**
  - Price: `$300.00`
- **After creating:** Copy the **Price ID**
- **Save as:** `STRIPE_LIFETIME_PRICE_ID`

---

### Step 2: Get Stripe API Keys (2 minutes)

**Go to Stripe Dashboard → Developers → API keys**

1. **Secret Key:**
   - Copy `sk_test_...` (for testing) or `sk_live_...` (for production)
   - **Save as:** `STRIPE_SECRET_KEY`

2. **Publishable Key:**
   - Copy `pk_test_...` (for testing) or `pk_live_...` (for production)
   - **Save as:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

### Step 3: Set Up Webhook (5 minutes)

**Go to Stripe Dashboard → Developers → Webhooks → Add endpoint**

1. **Endpoint URL:**
   ```
   https://your-domain.vercel.app/api/webhooks/stripe
   ```
   (For local testing, use Stripe CLI: `stripe listen --forward-to localhost:3002/api/webhooks/stripe`)

2. **Select Events to Listen To:**
   - ✅ `checkout.session.completed` (for lifetime deals)
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

3. **After creating:** Copy the **Signing secret** (starts with `whsec_...`)
   - **Save as:** `STRIPE_WEBHOOK_SECRET`

---

### Step 4: Run Database Migration (2 minutes)

**Go to Supabase Dashboard → SQL Editor**

Run this migration to allow 'lifetime' as a subscription plan:

```sql
-- Add 'lifetime' to subscription_plan CHECK constraint
ALTER TABLE detailers 
DROP CONSTRAINT IF EXISTS detailers_subscription_plan_check;

ALTER TABLE detailers 
ADD CONSTRAINT detailers_subscription_plan_check 
CHECK (subscription_plan IN ('starter', 'professional', 'business', 'lifetime'));
```

---

### Step 5: Set Environment Variables (5 minutes)

#### For Local Development (`.env.local`):

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs
STRIPE_STARTER_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_BUSINESS_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_LIFETIME_PRICE_ID=price_xxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

#### For Production (Vercel):

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Add all the variables above (use `sk_live_...` and `pk_live_...` for production)
3. Set `NEXT_PUBLIC_APP_URL` to your production domain

---

### Step 6: Test the Integration (10 minutes)

#### Test 1: Subscription Checkout
1. Log into your app
2. Go to `/upgrade` page
3. Click "Select Professional" (or any monthly plan)
4. Should redirect to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
6. Complete payment
7. Should redirect to `/upgrade/success`
8. Check Stripe Dashboard → Customers → Subscriptions (should see active subscription)
9. Check your database → `detailers` table → `subscription_status` should be `'active'`

#### Test 2: Lifetime Deal
1. Go to `/upgrade` page
2. Click "Select Lifetime Deal"
3. Should redirect to Stripe Checkout (one-time payment)
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. Should redirect to `/upgrade/success`
7. Check database → `subscription_plan` should be `'lifetime'`, `subscription_status` should be `'active'`

#### Test 3: Webhook Events
1. Check Stripe Dashboard → Developers → Webhooks → Your endpoint
2. Should see events being received
3. Check logs for any errors

---

## 🔍 Troubleshooting

### Issue: "Failed to create checkout session"
- **Check:** `STRIPE_SECRET_KEY` is set correctly
- **Check:** Price IDs are correct (start with `price_...`)
- **Check:** Stripe account is activated

### Issue: Webhook not receiving events
- **Check:** Webhook URL is correct (must be HTTPS in production)
- **Check:** `STRIPE_WEBHOOK_SECRET` matches the webhook signing secret
- **Check:** Events are selected in webhook settings
- **For local testing:** Use Stripe CLI: `stripe listen --forward-to localhost:3002/api/webhooks/stripe`

### Issue: Subscription not updating in database
- **Check:** Webhook is receiving events (check Stripe Dashboard)
- **Check:** Webhook handler logs for errors
- **Check:** Database migration was run (lifetime plan constraint)

### Issue: "Invalid plan selected"
- **Check:** Price IDs match exactly (case-sensitive)
- **Check:** Environment variables are loaded (restart dev server after adding)

---

## 📋 Quick Reference

### Required Environment Variables:
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
STRIPE_LIFETIME_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

### Stripe Test Cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

### Webhook Events Handled:
- `checkout.session.completed` → Lifetime deals
- `customer.subscription.created` → New subscriptions
- `customer.subscription.updated` → Plan changes
- `customer.subscription.deleted` → Cancellations
- `invoice.payment_succeeded` → Renewals
- `invoice.payment_failed` → Failed payments

---

## ✅ Final Verification

Before going live, verify:

- [ ] All 4 products created in Stripe
- [ ] All Price IDs copied and added to environment variables
- [ ] Webhook endpoint configured with all required events
- [ ] Database migration run (lifetime plan support)
- [ ] Environment variables set in both `.env.local` and Vercel
- [ ] Test subscription checkout works
- [ ] Test lifetime deal checkout works
- [ ] Webhook events are being received
- [ ] Database updates correctly after payment
- [ ] Success page displays correctly

---

## 🚀 Going Live

When ready for production:

1. **Switch to Live Mode in Stripe Dashboard**
2. **Update environment variables:**
   - Use `sk_live_...` instead of `sk_test_...`
   - Use `pk_live_...` instead of `pk_test_...`
   - Create new webhook endpoint for production URL
   - Get new webhook secret for production
3. **Update webhook URL** to production domain
4. **Test with real card** (small amount)
5. **Monitor webhook events** in Stripe Dashboard

---

**Need help?** Check the webhook logs in Stripe Dashboard or your server logs for detailed error messages.

