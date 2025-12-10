# Subscription & Trial System Setup Guide

## Overview
This system implements a 14-day free trial for new accounts, followed by a paid subscription requirement. All new signups automatically get a 14-day trial.

## Database Setup

### Step 1: Run Migration
Run the migration file in your Supabase SQL Editor:

```sql
-- File: database/migrations/add_subscription_fields.sql
```

This adds the following fields to the `detailers` table:
- `trial_started_at` - When the trial started
- `trial_ends_at` - When the trial ends (14 days from start)
- `subscription_status` - 'trial', 'active', 'expired', or 'cancelled'
- `stripe_subscription_id` - Stripe subscription ID
- `stripe_customer_id` - Stripe customer ID
- `subscription_plan` - 'starter', 'professional', or 'business'
- `subscription_ends_at` - When the subscription period ends

## Stripe Setup

### Step 2: Create Products and Prices in Stripe Dashboard

1. Go to Stripe Dashboard → Products
2. Create three products with recurring prices:

   **Starter Plan:**
   - Name: "DetailFlow Starter"
   - Price: $17/month (recurring)
   - Copy the Price ID (starts with `price_...`)

   **Professional Plan:**
   - Name: "DetailFlow Professional"
   - Price: $79/month (recurring)
   - Copy the Price ID

   **Business Plan:**
   - Name: "DetailFlow Business"
   - Price: $149/month (recurring)
   - Copy the Price ID

### Step 3: Set Environment Variables

Add these to your `.env.local` and Vercel environment variables:

```env
# Stripe Price IDs (from Step 2)
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
STRIPE_BUSINESS_PRICE_ID=price_xxxxx

# App URL (for checkout redirects)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Features Implemented

### 1. Trial System
- ✅ New signups automatically get 14-day trial
- ✅ Trial dates set on account creation
- ✅ Trial banner shows days remaining
- ✅ Auto-expires after 14 days

### 2. Subscription Management
- ✅ Upgrade page with 3 pricing tiers
- ✅ Stripe Checkout integration
- ✅ Webhook handlers for subscription events
- ✅ Automatic subscription status updates

### 3. Paywall System
- ✅ Paywall modal shows when trial expires
- ✅ Blocks access to dashboard when expired
- ✅ Redirects to upgrade page

### 4. Route Protection
- ✅ Dashboard layout checks subscription status
- ✅ API routes return 402 if subscription expired
- ✅ Trial and active subscriptions have full access

## Testing Checklist

### Test Trial Flow:
1. ✅ Create new account → Should get 14-day trial
2. ✅ Check dashboard → Should see trial banner
3. ✅ Wait 14 days (or manually expire) → Should see paywall

### Test Upgrade Flow:
1. ✅ Click "Upgrade Now" → Should go to /upgrade page
2. ✅ Select a plan → Should redirect to Stripe Checkout
3. ✅ Complete checkout → Should update subscription status
4. ✅ Check dashboard → Should see active subscription

### Test Webhook Events:
1. ✅ `customer.subscription.created` → Updates status to 'active'
2. ✅ `customer.subscription.updated` → Updates plan/status
3. ✅ `customer.subscription.deleted` → Updates status to 'cancelled'
4. ✅ `invoice.payment_succeeded` → Renews subscription

## Important Notes

### Existing Accounts
- Accounts created before this update won't have trial dates
- They will have `subscription_status = null` or default to 'trial'
- Handle gracefully: treat as expired if no trial dates exist
- Consider running a migration to set trial dates for existing accounts

### Stripe Test Mode
- Use Stripe test mode for development
- Test cards: https://stripe.com/docs/testing
- Webhook testing: Use Stripe CLI or Dashboard webhook testing

### Webhook Endpoint
- Ensure `/api/webhooks/stripe` is configured in Stripe Dashboard
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3002/api/webhooks/stripe`

## Files Created/Modified

### New Files:
- `database/migrations/add_subscription_fields.sql`
- `src/lib/subscription.ts`
- `src/lib/subscription-middleware.ts`
- `src/components/subscription/TrialBanner.tsx`
- `src/components/subscription/PaywallModal.tsx`
- `src/app/upgrade/page.tsx`
- `src/app/api/subscriptions/create-checkout/route.ts`

### Modified Files:
- `src/app/api/auth/signup/route.ts` - Sets trial dates
- `src/app/api/webhooks/stripe/route.ts` - Handles subscription events
- `src/lib/stripe.ts` - Added subscription service
- `src/lib/database.ts` - Added update method
- `src/lib/supabase.ts` - Added subscription field types
- `src/components/dashboard/DashboardHome.tsx` - Added trial banner
- `src/components/layout/DashboardLayout.tsx` - Added paywall check
- `src/app/api/customers/route.ts` - Added subscription check (example)

## Next Steps

1. Run database migration
2. Create Stripe products/prices
3. Set environment variables
4. Test trial flow
5. Test upgrade flow
6. Configure webhook endpoint in Stripe
7. Test webhook events

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Stripe Dashboard for webhook events
3. Check Supabase logs for database errors
4. Verify environment variables are set correctly

