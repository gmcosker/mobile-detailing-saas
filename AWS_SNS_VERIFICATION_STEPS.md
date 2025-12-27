# AWS SNS Setup Verification - Step by Step

Let's verify your AWS SNS setup is correct. Follow each step and confirm with me.

---

## Step 1: Verify AWS Credentials (IAM User)

### Go to IAM Console:
1. Open: https://console.aws.amazon.com/iam/
2. Click **"Users"** in the left sidebar
3. Find your SMS user (or the user you created for SMS)

**Questions:**
- ✅ Do you see a user listed? (What's the username?)
- ✅ Is the user **Active** (green checkmark)?

### Check Access Keys:
1. Click on your user name
2. Click the **"Security credentials"** tab
3. Scroll to **"Access keys"** section

**Questions:**
- ✅ Do you see an **Access key ID** listed? (Should start with `AKIA...`)
- ✅ Is the status **"Active"**?
- ✅ Do you have the **Secret access key** saved? (You won't see it again if you don't)

**If you don't have the secret key:**
- You'll need to create a new access key
- Click **"Create access key"**
- Choose **"Application running outside AWS"**
- **SAVE THE SECRET KEY IMMEDIATELY** - you can't see it again

---

## Step 2: Verify IAM Permissions

### Check User Permissions:
1. Still on your user page
2. Click the **"Permissions"** tab
3. Check what policies are attached

**Questions:**
- ✅ Do you see **"AmazonSNSFullAccess"** or **"AmazonSNSReadOnlyAccess"**?
- ✅ Or do you see a custom policy?

**If no SNS permissions:**
- Click **"Add permissions"** → **"Attach policies directly"**
- Search for **"AmazonSNSFullAccess"**
- Check the box and click **"Add permissions"**

---

## Step 3: Verify AWS Region

### Check Your Region:
1. Look at the top-right corner of AWS Console
2. You should see a region selector (e.g., "N. Virginia", "us-east-1")

**Questions:**
- ✅ What region is selected? (Should be **us-east-1** or **N. Virginia**)
- ✅ Does your `.env.local` have `AWS_REGION=us-east-1`?

**If different region:**
- Either change your `.env.local` to match
- Or change AWS console region to `us-east-1`

---

## Step 4: Verify SMS Spending Limit (CRITICAL)

### Go to SNS Console:
1. Open: https://console.aws.amazon.com/sns/
2. Click **"Text messaging (SMS)"** in the left sidebar
3. Click **"Account preferences"** (or "Preferences")

### Check Spending Limit:
Look for **"SMS spending limit"** or **"Account spending limit"**

**Questions:**
- ✅ What is your current spending limit? (Should be at least **$10**, NOT $1)
- ✅ Is it set to **$1.00 USD**? (This is the default and won't work!)

**If limit is $1:**
1. Click **"Request increase"** or **"Edit"**
2. Enter new limit: **$10.00** (or higher)
3. Click **"Request"** or **"Save"**
4. Wait for approval (usually instant, but can take a few hours)

---

## Step 5: Verify Phone Number or Sender ID

### Option A: Using Sender ID (Recommended for Testing)
1. In SNS Console → **"Text messaging (SMS)"** → **"Preferences"**
2. Scroll to **"Default sender ID"** or **"Origination identity"**

**Questions:**
- ✅ Do you see a **"Default sender ID"** field?
- ✅ What value is set? (Can be your business name like "DetailFlow")

**If using Sender ID:**
- Your `.env.local` should have: `AWS_SNS_SENDER_ID=DetailFlow` (or your business name)
- You DON'T need a phone number for this
- SMS will show as coming from "DetailFlow" (or your business name)

### Option B: Using Phone Number
1. In SNS Console → **"Text messaging (SMS)"** → **"Phone numbers"**
2. Click **"Request phone number"** (if you don't have one)

**Questions:**
- ✅ Do you have a phone number listed?
- ✅ What is the phone number? (Format: +15551234567)
- ✅ Is it **Active**?

**If you need a phone number:**
1. Click **"Request phone number"**
2. Select country: **United States**
3. Select type: **Long code** (cheaper) or **Short code** (more expensive)
4. Click **"Request"**
5. Wait for approval (can take a few hours to days)
6. Copy the phone number to `.env.local`: `AWS_SNS_PHONE_NUMBER=+15551234567`

---

## Step 6: Verify Environment Variables

### Check Your `.env.local` File:
Open your `.env.local` file and verify you have:

```bash
AWS_ACCESS_KEY_ID=AKIA...          # Should start with AKIA
AWS_SECRET_ACCESS_KEY=xxx...       # Long random string
AWS_REGION=us-east-1               # Should match AWS console region
AWS_SNS_SENDER_ID=DetailFlow       # Optional: Your business name
# OR
AWS_SNS_PHONE_NUMBER=+15551234567  # Optional: If using phone number
```

**Questions:**
- ✅ Do you have `AWS_ACCESS_KEY_ID`? (Does it match the one in AWS console?)
- ✅ Do you have `AWS_SECRET_ACCESS_KEY`? (Do you have it saved?)
- ✅ Do you have `AWS_REGION=us-east-1`?
- ✅ Do you have either `AWS_SNS_SENDER_ID` OR `AWS_SNS_PHONE_NUMBER`?

---

## Step 7: Test Credentials (Optional but Recommended)

### Test with AWS CLI (if installed):
```bash
aws sns list-topics --region us-east-1
```

**Expected:** Should return a list (even if empty) without errors

**If you get "Access Denied" or "Invalid credentials":**
- Your credentials are wrong
- Check the Access Key ID matches
- Verify the Secret Access Key is correct

---

## Summary Checklist

Before testing SMS, verify:

- [ ] IAM user exists and is active
- [ ] Access key ID is active (starts with AKIA)
- [ ] Secret access key is saved
- [ ] User has SNS permissions (AmazonSNSFullAccess)
- [ ] Region is set to us-east-1 (in AWS console and .env.local)
- [ ] SMS spending limit is at least $10 (NOT $1)
- [ ] Either Sender ID or Phone Number is configured
- [ ] All environment variables are in .env.local
- [ ] Server will be restarted after any changes

---

## Next Steps After Verification

Once we've verified everything:
1. Restart your dev server: `npm run dev`
2. Test sending an SMS from the dashboard
3. Check terminal logs for success/errors
4. Check your phone for the message

---

## Common Issues

**"Spending limit is $1"**
→ Request increase to $10 minimum

**"No SNS permissions"**
→ Attach AmazonSNSFullAccess policy to your IAM user

**"Wrong region"**
→ Make sure AWS console region matches AWS_REGION in .env.local

**"Phone number is placeholder"**
→ Use Sender ID instead (easier, no approval needed)

**"Credentials don't work"**
→ Create new access key and update .env.local




