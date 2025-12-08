# Setting Up Twilio on Vercel

## Required Environment Variables

To enable SMS functionality on your Vercel-hosted app, you need to add these environment variables in your Vercel project settings:

### 1. Go to Vercel Dashboard
- Navigate to your project: `mobile-detailing-saas`
- Click on **Settings** → **Environment Variables**

### 2. Add These Three Variables:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Important Notes:**
- Replace the values with your actual Twilio credentials
- The phone number must include the country code (e.g., `+15551234567`)
- Make sure to add these to **Production**, **Preview**, and **Development** environments (or at least Production)

### 3. Redeploy
After adding the environment variables:
- Vercel will automatically trigger a new deployment, OR
- Go to **Deployments** tab and click **Redeploy** on the latest deployment

## Testing SMS Features

Once the environment variables are set and the app is redeployed, you can test:

1. **Appointment Confirmation SMS**
   - Go to Schedule page
   - Click "Confirm" on a pending appointment
   - Customer should receive SMS confirmation

2. **Manual SMS Sending**
   - Go to SMS page
   - Enter phone number and message
   - Click "Send SMS"

3. **Appointment Reminders**
   - Automated reminders are sent 24 hours before appointments
   - Check the SMS page for reminder status

## Verification

To verify Twilio is working:
1. Check Vercel logs (Runtime Logs) for any Twilio errors
2. Check your Twilio dashboard for sent messages
3. Test with a real phone number (make sure it's verified in Twilio if using trial account)

## Current Status

✅ Code is ready and deployed
⏳ Waiting for environment variables to be added in Vercel dashboard

