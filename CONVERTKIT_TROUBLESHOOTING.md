# ConvertKit Nurture Sequence Troubleshooting Guide

## Quick Diagnosis Steps

### Step 1: Test ConvertKit Connection
Visit this URL to test your ConvertKit setup:
- **Localhost:** `http://localhost:3002/api/leads/test-kit`
- **Production:** `https://your-domain.vercel.app/api/leads/test-kit`

This will show:
- ✅ If environment variables are set
- ✅ If API key is valid
- ✅ If form exists
- ❌ Any errors

### Step 2: Check Environment Variables

**In Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set for **Production**:
   - `CONVERTKIT_API_KEY` 
   - `CONVERTKIT_FORM_ID`
   - `CONVERTKIT_API_SECRET` (optional)

**Check your `.env.local` for localhost:**
```env
CONVERTKIT_API_KEY=your_api_key_here
CONVERTKIT_FORM_ID=your_form_id_here
```

### Step 3: Verify ConvertKit Form Setup

**In ConvertKit Dashboard:**
1. **Log into ConvertKit** → https://app.convertkit.com
2. **Go to Forms** → Find your form (ID should match `CONVERTKIT_FORM_ID`)
3. **Check if form has an Automation/Sequence:**
   - Click on your form
   - Look for "Automation" or "Sequence" tab
   - **CRITICAL:** The form MUST have a Visual Automation or Sequence attached for nurture emails to send
   - If no automation is attached, that's why emails aren't sending!

4. **Verify Automation is Active:**
   - Go to Automations → Find the automation linked to your form
   - Check that it's **Published** (not Draft)
   - Check that emails in the sequence are **Published** (not Draft)
   - Verify the first email sends **immediately** (0 days delay) or has a short delay

### Step 4: Check Server Logs

**In Vercel:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click latest deployment → **View Function Logs**
3. Look for `[LEADS]` messages when someone submits an email
4. Check for:
   - `✅ Successfully added email to ConvertKit` (working)
   - `❌ Failed to add email to ConvertKit` (error)
   - `⚠️ ConvertKit not configured` (missing env vars)

### Step 5: Test Email Submission

**Test endpoint:** `POST /api/leads/test-submit`
```bash
curl -X POST https://your-domain.vercel.app/api/leads/test-submit \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Or use the browser console:
```javascript
fetch('/api/leads/test-submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com' })
}).then(r => r.json()).then(console.log)
```

### Step 6: Verify Subscriber in ConvertKit

1. **Go to ConvertKit Dashboard** → Subscribers
2. **Search for the test email** you submitted
3. **Check:**
   - Is the subscriber in the system? ✅
   - What form did they subscribe to? (should match your form)
   - Are they in any automations? (should show the automation name)
   - What tags do they have? (should show 'free_guide', etc.)

## Common Issues & Solutions

### Issue 1: "Subscribers added but no emails sent"

**Cause:** Form doesn't have an automation/sequence attached

**Solution:**
1. Go to ConvertKit → Forms → Your Form
2. Click "Automation" tab
3. Create a Visual Automation or attach an existing Sequence
4. Make sure automation is **Published** (not Draft)
5. Make sure all emails in sequence are **Published**

### Issue 2: "Environment variables not set"

**Symptoms:** Logs show `⚠️ ConvertKit not configured`

**Solution:**
1. Add `CONVERTKIT_API_KEY` to Vercel Environment Variables
2. Add `CONVERTKIT_FORM_ID` to Vercel Environment Variables
3. **Redeploy** your app after adding variables

### Issue 3: "API key invalid"

**Symptoms:** Test endpoint shows `formTest.ok: false`

**Solution:**
1. Go to ConvertKit → Settings → Advanced → API Secret
2. Copy your API Key
3. Update `CONVERTKIT_API_KEY` in Vercel
4. Redeploy

### Issue 4: "Form ID doesn't exist"

**Symptoms:** Test endpoint shows `formExists: false`

**Solution:**
1. Go to ConvertKit → Forms
2. Find your form and click on it
3. The form ID is in the URL: `https://app.convertkit.com/forms/1234567/...`
4. Update `CONVERTKIT_FORM_ID` in Vercel with the correct ID
5. Redeploy

### Issue 5: "First email not sending immediately"

**Symptoms:** Subscriber added but first email delayed

**Solution:**
1. Go to ConvertKit → Automations → Your Automation
2. Click on the first email in the sequence
3. Change delay from "1 day" to "0 days" or "immediately"
4. Save and republish

### Issue 6: "Emails in Draft mode"

**Symptoms:** Automation exists but emails not sending

**Solution:**
1. Go to ConvertKit → Automations → Your Automation
2. Check each email in the sequence
3. Make sure all are **Published** (green checkmark), not Draft
4. If any are Draft, click "Publish" on each one

## How to Verify It's Working

1. **Submit a test email** through your free guide form
2. **Check Vercel logs** - should see `✅ Successfully added email to ConvertKit`
3. **Check ConvertKit dashboard** - subscriber should appear within seconds
4. **Check subscriber details** - should show they're in your automation
5. **Wait for first email** - should arrive immediately or within the delay you set

## Testing Checklist

- [ ] Environment variables set in Vercel
- [ ] Test endpoint shows `success: true`
- [ ] Form exists in ConvertKit
- [ ] Form has an automation/sequence attached
- [ ] Automation is Published (not Draft)
- [ ] All emails in sequence are Published
- [ ] First email sends immediately (0 days delay)
- [ ] Subscriber appears in ConvertKit after submission
- [ ] Subscriber shows as enrolled in automation

## Still Not Working?

1. **Check ConvertKit support** - They can see if emails are queued but not sending
2. **Check spam folder** - First email might be in spam
3. **Verify email address** - Make sure you're checking the right email
4. **Check automation logs** - ConvertKit shows delivery status for each email

## API Endpoints Created

- `GET /api/leads/test-kit` - Test ConvertKit connection
- `POST /api/leads/test-submit` - Test submitting an email

Use these to diagnose issues quickly!

