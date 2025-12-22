# Deployment Guide

## Pre-Deployment Checklist

### Required Environment Variables

#### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Stripe Configuration (for payments)
```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### Twilio Configuration (for SMS)
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Application Configuration
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Database Setup

1. Run the database schema:
   ```sql
   -- Run database/schema.sql in Supabase SQL Editor
   -- Run database/services-schema.sql
   -- Run database/branding-schema.sql (if using branding)
   ```

2. Set up storage bucket for photos:
   ```bash
   npm run setup-storage
   ```

3. Seed test data (optional):
   ```bash
   npm run seed
   ```

### Health Check

Before deploying, verify everything is configured:

```bash
npm run health-check
```

This will verify:
- All required environment variables are set
- Supabase connectivity
- Service role key validity
- Database tables exist

## Vercel Deployment

1. **Connect Repository**
   - Go to Vercel dashboard
   - Import your Git repository
   - Select the `mobile-detailing-saas` directory as root

2. **Configure Environment Variables**
   - Add all required environment variables in Vercel project settings
   - Set them for Production, Preview, and Development environments

3. **Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `mobile-detailing-saas`
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

4. **Deploy**
   - Push to main branch to trigger deployment
   - Or manually trigger from Vercel dashboard

## Post-Deployment Verification

### Test Public Booking Flow

1. Get your detailer ID from database:
   ```sql
   SELECT detailer_id FROM detailers WHERE is_active = true;
   ```

2. Test booking page:
   ```
   https://your-domain.com/book/test-detailer
   ```

3. Complete a test booking:
   - Select a service
   - Choose date/time
   - Fill customer information
   - Submit booking
   - Verify appointment appears in dashboard

### Test Payment Flow

1. Create a test appointment
2. Generate payment link from schedule page
3. Complete payment on customer payment page
4. Verify payment status updates to "paid"

### Test SMS Notifications

1. Create an appointment for tomorrow
2. Verify reminder SMS is sent 24 hours before
3. Test manual SMS sending from SMS page

## Production Considerations

### Security

- ✅ Never commit `.env.local` or `.env` files
- ✅ Use environment variables for all secrets
- ✅ Enable Supabase RLS policies in production
- ✅ Use Stripe live keys (not test keys) in production
- ✅ Verify Twilio phone number is approved for production

### Performance

- ✅ Enable Next.js Image Optimization
- ✅ Set up CDN for static assets (Vercel handles this)
- ✅ Monitor API response times
- ✅ Set up error tracking (Sentry, etc.)

### Monitoring

- Set up Vercel Analytics
- Monitor Stripe webhook delivery
- Check Twilio message delivery logs
- Monitor Supabase database performance

## Troubleshooting

### Common Issues

**Booking page shows "Detailer not found"**
- Check that detailer exists and `is_active = true`
- Verify `detailer_id` matches URL parameter
- Check Supabase RLS policies allow public access

**Services not showing on booking page**
- Verify services exist for detailer
- Check `is_active = true` on services
- Ensure SUPABASE_SERVICE_ROLE_KEY is set (needed for public endpoints)

**Payment links not generating**
- Verify Stripe keys are correct
- Check Stripe account is activated
- Ensure payment link products are enabled in Stripe

**SMS not sending**
- Verify Twilio credentials
- Check phone number format (+country code)
- Verify Twilio account has sufficient balance
- Check Twilio webhook URL is configured (for status updates)

### Health Check Script

Run the health check to diagnose issues:

```bash
npm run health-check
```

## Rollback Plan

If deployment fails:

1. Revert to previous deployment in Vercel dashboard
2. Check deployment logs for errors
3. Verify environment variables match previous working version
4. Check database migrations haven't broken anything
