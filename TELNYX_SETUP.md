# Plivo SMS Setup Guide

## Quick Setup (5 minutes)

### Step 1: Sign up for Plivo
1. Go to https://www.plivo.com/
2. Click "Sign Up" (free account, **accepts Gmail**, instant approval)
3. Verify your email

### Step 2: Get API Credentials
1. Log in to Plivo Console: https://console.plivo.com/
2. Go to **Settings** → **API** (or look for "Auth ID & Auth Token")
3. Copy:
   - **Auth ID** (looks like `MA...` or `PL...`)
   - **Auth Token** (long string)

### Step 3: Get Phone Number
1. In Plivo Console, go to **Numbers** → **Buy Numbers**
2. Select:
   - Country: United States
   - Type: SMS-enabled
3. Purchase a number (often free/low cost for testing)
4. Copy the phone number (e.g., `+15551234567`)

### Step 4: Add to .env.local
```bash
PLIVO_AUTH_ID=your_auth_id_here
PLIVO_AUTH_TOKEN=your_auth_token_here
PLIVO_PHONE_NUMBER=+15551234567
```

### Step 5: Restart Server
```bash
npm run dev
```

### Step 6: Test
- Go to Customers page
- Click on a customer
- Click "Send SMS Invite"
- Check your phone!

## Why Plivo?
- ✅ **Instant approval** (no waiting, accepts Gmail)
- ✅ **SMS-focused** (not voice/AI focused)
- ✅ **Developer-friendly** API
- ✅ **Reliable** SMS delivery
- ✅ **Good pricing** for startups

## Troubleshooting
- If you get errors, check that your Auth ID, Auth Token, and phone number are correct in `.env.local`
- Make sure you restarted the server after adding credentials
- Check Plivo Console → **Logs** → **Messages** to see sent messages

