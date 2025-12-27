# AWS SMS Testing Guide

## ✅ Code is Now Fixed - All Twilio References Removed

The SMS service has been completely updated to use **AWS SNS only**. All Twilio code has been removed.

---

## Step 1: Verify Environment Variables

### Local (.env.local)
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_SNS_PHONE_NUMBER=+15551234567  # Optional: Your AWS phone number
AWS_SNS_SENDER_ID=DetailFlow       # Optional: Sender ID (business name)
```

### Vercel Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all 4 variables above
3. Make sure they're set for **Production**, **Preview**, and **Development**

---

## Step 2: Verify AWS SNS Setup

### Check SMS Spending Limit
1. Go to AWS Console → SNS → Text messaging (SMS) → Account preferences
2. Verify your **SMS spending limit** is set to at least **$10/month** (not the default $1)
3. If it's still $1, click "Request increase" and set to $10/month

### Verify Credentials Work
1. Go to AWS Console → IAM → Users
2. Find your SMS user (or root user if using root credentials)
3. Verify the access key is active
4. Test credentials using AWS CLI (optional):
   ```bash
   aws sns list-topics --region us-east-1
   ```

---

## Step 3: Test SMS Sending

### Option A: Test from Dashboard (Recommended)

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Log into your dashboard:**
   - Go to http://localhost:3002/dashboard
   - Log in with your test account

3. **Go to Customers page:**
   - Click on any customer
   - Click "Send Booking Invite" or "Send SMS"

4. **Check the terminal logs:**
   You should see:
   ```
   [SMS] AWS SNS client initialized successfully
   [SMS] Attempting to send SMS via AWS SNS to +1...
   [SMS] Successfully sent SMS via AWS SNS. Message ID: ...
   ```

5. **Check your phone:**
   - The SMS should arrive within 10-30 seconds
   - The sender will show as your business name or "DetailFlow"

### Option B: Test via API Directly

1. **Get your auth token:**
   - Log into dashboard
   - Open browser DevTools → Application → Cookies
   - Copy the `auth_token` value

2. **Send test SMS via curl:**
   ```bash
   curl -X POST http://localhost:3002/api/sms/send \
     -H "Content-Type: application/json" \
     -H "Cookie: auth_token=YOUR_TOKEN_HERE" \
     -d '{
       "phoneNumber": "+15551234567",
       "message": "Test SMS from DetailFlow - AWS SNS is working!",
       "customerId": "your-customer-id"
     }'
   ```

3. **Check response:**
   - Should return: `{"success": true, "messageId": "aws_...", "message": "SMS sent successfully"}`
   - Check your phone for the message

---

## Step 4: Test Different SMS Types

### Test Appointment Confirmation
1. Go to Schedule page
2. Click on an appointment
3. Click "Confirm"
4. SMS should be sent automatically
5. Check terminal logs and your phone

### Test Booking Invite
1. Go to Customers page
2. Click on a customer
3. Click "Send Booking Invite"
4. SMS should be sent with booking link
5. Check terminal logs and your phone

### Test Manual SMS
1. Go to SMS page (if available)
2. Enter phone number and message
3. Click "Send"
4. Check terminal logs and your phone

---

## Step 5: Verify in AWS Console

1. **Go to AWS SNS Console:**
   - https://console.aws.amazon.com/sns/
   - Click "Text messaging (SMS)" in left sidebar

2. **Check SMS usage:**
   - Click "Text messaging preferences"
   - Scroll to "SMS usage metrics"
   - You should see your sent messages

3. **Check CloudWatch logs (optional):**
   - Go to CloudWatch → Logs
   - Look for SNS delivery logs
   - Verify messages are being sent

---

## Troubleshooting

### Error: "AWS SNS credentials not configured"
**Fix:** Add environment variables to `.env.local` and restart server

### Error: "InvalidParameterException"
**Fix:** Phone number must be in E.164 format: `+1234567890` (with country code)

### Error: "ThrottlingException"
**Fix:** You're sending too fast. Wait 1 minute and try again.

### Error: "AuthorizationErrorException"
**Fix:** Your AWS credentials are wrong. Check `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### SMS not arriving
**Check:**
1. Phone number format is correct (`+1` for US)
2. AWS SNS spending limit is increased (not $1)
3. Check AWS SNS console for delivery status
4. Check terminal logs for error messages
5. Verify your phone can receive SMS

### "Demo mode" messages in logs
**Fix:** Your AWS credentials aren't being loaded. Check:
- `.env.local` file exists and has correct values
- Server was restarted after adding env vars
- Vercel env vars are set (if testing production)

---

## Expected Log Output (Success)

```
[SMS] AWS SNS client initialized successfully
[SMS] Detailer abc123 sending SMS to +15551234567
[SMS] Business: Your Business Name
[SMS] Attempting to send SMS via AWS SNS to +15551234567 (Detailer: abc123)
[SMS] Original phone number: "5551234567", Cleaned: "15551234567", Formatted: "+15551234567"
[SMS] Sender ID: DetailFlow
[SMS] Successfully sent SMS via AWS SNS. Message ID: abc123-def456-ghi789
[SMS] Response: {
  "MessageId": "abc123-def456-ghi789",
  "$metadata": {
    "httpStatusCode": 200,
    "requestId": "..."
  }
}
```

---

## Cost Estimate

- **Per SMS:** ~$0.00645 (less than 1 cent)
- **Free Tier:** 1,000 SMS/month free (Always Free)
- **Your Limit:** $10/month = ~1,550 SMS/month
- **Testing:** Send 10-20 test messages = ~$0.10

---

## Next Steps After Testing

1. ✅ Verify SMS arrives on your phone
2. ✅ Test appointment confirmation SMS
3. ✅ Test booking invite SMS
4. ✅ Check AWS SNS console for delivery metrics
5. ✅ Set up production environment variables in Vercel
6. ✅ Test on production deployment

---

## Support

If SMS still doesn't work after following this guide:
1. Check terminal logs for exact error messages
2. Verify AWS credentials in AWS Console
3. Check AWS SNS spending limit is increased
4. Test credentials with AWS CLI
5. Check phone number format (must be E.164: +1234567890)




