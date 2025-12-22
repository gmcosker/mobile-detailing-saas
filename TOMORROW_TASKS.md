# Tomorrow's Tasks - Game Plan

## 🎯 Task 1: Fix ConvertKit Nurture Sequence Emails

### Problem
Nurture sequence emails are not being sent when leads submit their email through the free guide form.

### What We've Done Today
- ✅ Created diagnostic endpoint: `/api/leads/test-kit`
- ✅ Improved error logging in `/api/leads/route.ts`
- ✅ Identified the ConvertKit integration code in `src/lib/kit.ts`

### Steps to Diagnose & Fix

#### Step 1: Test ConvertKit Connection
1. **Visit the diagnostic endpoint:**
   - Localhost: `http://localhost:3002/api/leads/test-kit`
   - Production: `https://your-domain.vercel.app/api/leads/test-kit`

2. **Check the response:**
   - Look for `success: true/false`
   - Check `diagnostics` object for missing env vars
   - Verify `formTest.formExists: true`
   - Note any error messages

#### Step 2: Verify Environment Variables
**In Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set for **Production**:
   - `CONVERTKIT_API_KEY` (should start with something like `xxxxx`)
   - `CONVERTKIT_FORM_ID` (should be a number like `1234567`)
   - `CONVERTKIT_API_SECRET` (optional, for advanced features)

**In `.env.local` (for localhost testing):**
- Same three variables should be set

#### Step 3: Check Server Logs
**In Vercel:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment → View Function Logs
3. Look for `[LEADS]` messages when someone submits an email
4. Check for:
   - `✅ Successfully added email to ConvertKit` (working)
   - `❌ Failed to add email to ConvertKit` (error)
   - `⚠️ ConvertKit not configured` (missing env vars)

#### Step 4: Verify ConvertKit Setup
1. **Log into ConvertKit dashboard**
2. **Check your form:**
   - Go to Forms → Find the form with ID matching `CONVERTKIT_FORM_ID`
   - Verify the form exists and is active
   - Check if it has a nurture sequence/automation attached

3. **Check API credentials:**
   - Go to Settings → Advanced → API Secret
   - Verify the API key matches what's in Vercel
   - Check if API key has expired or been regenerated

#### Step 5: Test End-to-End
1. **Submit a test email** through the free guide form on your site
2. **Check Vercel logs** for `[LEADS]` messages
3. **Check ConvertKit dashboard** → Subscribers → See if the email appears
4. **Verify nurture sequence** starts (check automation logs in ConvertKit)

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| `CONVERTKIT_API_KEY not set` | Add to Vercel Environment Variables |
| `CONVERTKIT_FORM_ID not set` | Add form ID to Vercel Environment Variables |
| `Form not found` | Verify form ID is correct in ConvertKit dashboard |
| `API key invalid` | Regenerate API key in ConvertKit and update Vercel |
| `Form has no automation` | Attach nurture sequence to the form in ConvertKit |

### Files to Check
- `src/lib/kit.ts` - ConvertKit service implementation
- `src/app/api/leads/route.ts` - Lead capture endpoint
- `src/app/api/leads/test-kit/route.ts` - Diagnostic endpoint (NEW)

---

## 🎯 Task 2: Test Stripe Checkout in Test Mode

### Context
We set up Stripe checkout with live mode, but you want to test the full checkout flow without paying real money. We need to switch to test mode temporarily.

### What We've Done Previously
- ✅ Stripe integration is complete with live mode
- ✅ All Price IDs are set up in live mode
- ✅ Webhook is configured for live mode
- ✅ Checkout flow works (but uses real money)

### Steps to Test in Test Mode

#### Step 1: Create Test Products in Stripe
1. **Switch Stripe Dashboard to Test Mode:**
   - Toggle "Test mode" switch in top right of Stripe dashboard
   - URL should show `test` in the path

2. **Create Test Products (same as live):**
   - Go to Products → Create Product
   - Create these 4 products:
     - **Starter**: $17/month (recurring)
     - **Professional**: $79/month (recurring)
     - **Business**: $149/month (recurring)
     - **Lifetime Deal**: $300 (one-time payment)
   - **Copy the Price IDs** (they'll be different from live, start with `price_`)

#### Step 2: Update Environment Variables (Temporarily)
**In `.env.local` (for localhost testing):**
```env
# Switch to test mode
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Update Price IDs to test mode Price IDs
STRIPE_STARTER_PRICE_ID=price_test_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_test_xxxxx
STRIPE_BUSINESS_PRICE_ID=price_test_xxxxx
STRIPE_LIFETIME_PRICE_ID=price_test_xxxxx

# Keep webhook secret for test mode (or create new test webhook)
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxx
```

**Important:** Do NOT update Vercel environment variables - keep those as live mode for production.

#### Step 3: Test Webhook (Optional, for local testing)
If you want to test webhooks locally:
1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3002/api/webhooks/stripe`
4. Copy the webhook secret it gives you to `.env.local`

#### Step 4: Test Checkout Flow
1. **Start dev server:** `npm run dev`
2. **Go to upgrade page:** `http://localhost:3002/upgrade`
3. **Click "Select Professional"** (or any plan)
4. **Use Stripe test card numbers:**
   - Success: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/25)
   - Any 3-digit CVC (e.g., 123)
   - Any ZIP code (e.g., 12345)

5. **Complete checkout** - should redirect to success page
6. **Check database** - verify subscription status updated
7. **Check Stripe dashboard** - verify payment appears in test mode

#### Step 5: Verify Everything Works
- ✅ Checkout redirects to Stripe
- ✅ Can complete payment with test card
- ✅ Redirects to success page
- ✅ Database updates subscription status
- ✅ Webhook processes payment (if testing webhooks)

#### Step 6: Switch Back to Live Mode
**After testing:**
1. **Revert `.env.local`** back to live mode keys
2. **Restart dev server**
3. **Keep Vercel in live mode** (don't change production)

### Test Card Numbers (Stripe Test Mode)

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

**All test cards:**
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### Files Involved
- `src/lib/stripe.ts` - Stripe service
- `src/app/api/subscriptions/create-checkout/route.ts` - Checkout endpoint
- `src/app/api/webhooks/stripe/route.ts` - Webhook handler
- `.env.local` - Environment variables (test mode)
- Vercel Environment Variables - Keep in live mode

### Important Notes
- ⚠️ **Test mode and live mode are completely separate** - test Price IDs won't work with live keys
- ⚠️ **Don't mix test and live** - use test keys with test Price IDs, live keys with live Price IDs
- ⚠️ **Vercel stays in live mode** - only test locally in `.env.local`
- ✅ **Test mode is free** - no real charges, no fees
- ✅ **Test webhooks** - can test webhook events in test mode

---

## 📋 Summary Checklist

### ConvertKit Fix:
- [ ] Run diagnostic endpoint: `/api/leads/test-kit`
- [ ] Check Vercel environment variables
- [ ] Verify ConvertKit form exists and has automation
- [ ] Test email submission and check logs
- [ ] Verify subscriber appears in ConvertKit
- [ ] Confirm nurture sequence starts

### Stripe Test Mode:
- [ ] Switch Stripe dashboard to test mode
- [ ] Create test products (4 products)
- [ ] Copy test Price IDs
- [ ] Update `.env.local` with test keys and Price IDs
- [ ] Test checkout with test card `4242 4242 4242 4242`
- [ ] Verify payment processes
- [ ] Check database updates
- [ ] Switch back to live mode in `.env.local`

---

## 🚀 Quick Start Tomorrow

1. **First, test ConvertKit:**
   - Visit: `http://localhost:3002/api/leads/test-kit`
   - Share results with me
   - We'll fix based on what we find

2. **Then, test Stripe:**
   - Create test products in Stripe
   - Update `.env.local` with test keys
   - Test checkout flow
   - Switch back to live when done

Both tasks are ready to go - just follow the steps above! 🎯

