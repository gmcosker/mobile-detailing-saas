# AWS SNS SMS Setup Guide

## Quick Setup (10 minutes)

### Step 1: Sign up for AWS (if you don't have an account)
1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. **Accepts Gmail addresses** ✅
4. Enter payment info (you only pay for what you use, SMS is ~$0.00645 per message)
5. Verify your phone number

### Step 2: Get AWS Credentials
1. Log in to AWS Console: https://console.aws.amazon.com/
2. Click your name (top right) → **Security Credentials**
3. Scroll to **Access Keys** → Click **"Create access key"**
4. Choose **"Application running outside AWS"**
5. Copy:
   - **Access Key ID**
   - **Secret Access Key** (only shown once - copy it!)

### Step 3: Request SMS Sending Limit (Important!)
1. In AWS Console, go to **SNS** (Simple Notification Service)
2. Go to **Text messaging (SMS)** → **Account preferences**
3. Click **"Request increase"** for SMS spending limit
4. Set to at least **$10/month** (or higher)
5. Wait for approval (usually instant or within hours)

### Step 4: Get Phone Number (Optional)
- AWS SNS can send from a **sender ID** (your business name) or you can request a dedicated number
- For now, you can use sender ID which is free
- To get a number: SNS → Phone numbers → Request phone number

### Step 5: Add to .env.local
```bash
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
AWS_SNS_PHONE_NUMBER=+15551234567  # Or use sender ID
```

### Step 6: Restart Server
```bash
npm run dev
```

### Step 7: Test
- Go to Customers page
- Click on a customer
- Click "Send SMS Invite"
- Check your phone!

## Why AWS SNS?
- ✅ **Accepts Gmail** (no restrictions)
- ✅ **No approval delays** (just need to request SMS limit)
- ✅ **Reliable** (AWS infrastructure)
- ✅ **Pay-as-you-go** (~$0.006 per SMS)
- ✅ **Scalable** (handles any volume)

## Important Notes
- **SMS Spending Limit**: You MUST request an increase from the default $1/month limit
- **Cost**: ~$0.00645 per SMS in US
- **Region**: Use `us-east-1` for best compatibility

## Troubleshooting
- If SMS fails, check AWS SNS → Text messaging → Delivery logs
- Make sure you requested SMS spending limit increase
- Verify credentials are correct in `.env.local`

