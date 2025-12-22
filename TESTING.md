# Testing Guide

## End-to-End Test Flow

### 1. Public Booking Flow

**Test Account Setup:**
- Detailer ID: `test-detailer`
- Booking URL: `http://localhost:3000/book/test-detailer`

**Test Steps:**

1. **Load Booking Page**
   - Navigate to booking URL
   - Verify page loads without errors
   - Verify detailer business name displays
   - Verify services list displays (should show 4 services)

2. **Select Service**
   - Click on a service (e.g., "Basic Wash")
   - Verify price and duration display correctly
   - Click to proceed to date/time selection

3. **Select Date & Time**
   - Choose a future date (next 7 days)
   - Select an available time slot
   - Verify booked slots are grayed out
   - Click "Continue to Details"

4. **Customer Information**
   - Fill in required fields:
     - Name: "Test Customer"
     - Phone: "+15551234567"
     - Address: "123 Test St, Test City, ST 12345"
   - Optional: Email, Notes
   - Click "Book Appointment"

5. **Confirmation**
   - Verify confirmation screen displays
   - Verify all appointment details are correct
   - Verify appointment ID is returned

**Expected Result:**
- Appointment created in database with status "pending"
- Payment status set to "pending"
- Customer record created/updated
- Booking appears in dashboard schedule

### 2. Payment Flow

**Test Steps:**

1. **Access Payment Page**
   - Use appointment ID from booking
   - Navigate to: `/pay/{appointmentId}`

2. **Verify Payment Page**
   - Appointment details display correctly
   - Amount matches service price
   - Customer name displays

3. **Create Payment Intent**
   - Page should automatically create payment intent
   - Stripe payment form should load

4. **Complete Payment**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Submit payment

5. **Payment Confirmation**
   - Redirect to success page
   - Verify payment status updated to "paid"
   - Verify appointment status updated to "confirmed"

**Expected Result:**
- Payment intent created in Stripe
- Payment succeeds
- Appointment payment_status = "paid"
- Appointment status = "confirmed"

### 3. Dashboard Payment Link Generation

**Test Steps:**

1. **Access Schedule Page**
   - Log in to dashboard
   - Navigate to Schedule page

2. **Find Appointment**
   - Locate appointment with payment_status = "pending"
   - Verify payment status badge displays

3. **Generate Payment Link**
   - Click "Payment Link" button on appointment card
   - Verify link is generated
   - Verify link is copied to clipboard
   - Share link with customer

4. **Customer Uses Link**
   - Customer opens link in new tab
   - Completes payment
   - Verify payment status updates

**Expected Result:**
- Payment link created via Stripe Payment Links API
- Link is shareable
- Customer can complete payment
- Status updates correctly

### 4. SMS Reminder Flow

**Test Steps:**

1. **Create Appointment for Tomorrow**
   - Create appointment scheduled for tomorrow
   - Ensure reminder_sent = false

2. **Trigger Reminder (Manual Test)**
   - Go to SMS page
   - Send reminder manually for tomorrow's appointment
   - Or wait for automated reminder (24 hours before)

3. **Verify SMS Sent**
   - Check Twilio logs
   - Verify customer receives SMS
   - Verify reminder_sent flag updates

**Expected Result:**
- SMS sent to customer phone number
- Message includes appointment details
- reminder_sent = true after sending

## Manual Test Checklist

### Booking System
- [ ] Public booking page loads correctly
- [ ] Services display for active detailer
- [ ] Date/time selection works
- [ ] Booked slots are blocked
- [ ] Customer info validation works
- [ ] Booking creates appointment in database
- [ ] Confirmation screen displays correctly

### Payment System
- [ ] Payment page loads with appointment details
- [ ] Payment intent creates successfully
- [ ] Stripe payment form loads
- [ ] Payment completes successfully
- [ ] Payment status updates in database
- [ ] Appointment status updates to "confirmed"
- [ ] Payment link generation works
- [ ] Payment link is shareable

### Dashboard
- [ ] Schedule page displays appointments
- [ ] Payment status badges display correctly
- [ ] Payment link button appears for unpaid appointments
- [ ] Payment link generation copies to clipboard
- [ ] Appointment status can be updated
- [ ] Appointment cancellation works
- [ ] Reschedule functionality works

### SMS Notifications
- [ ] Manual SMS sending works
- [ ] Appointment confirmation SMS sends
- [ ] Reminder SMS sends (24h before)
- [ ] SMS templates render correctly
- [ ] Error handling works for failed SMS

### Error Handling
- [ ] Invalid detailer ID shows error
- [ ] Missing services shows appropriate message
- [ ] Double booking prevented
- [ ] Payment failures handled gracefully
- [ ] Network errors show user-friendly messages

## Test Accounts

### Stripe Test Cards

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

**Declined Payment:**
- Card: `4000 0000 0000 0002`
- Expiry: Any future date
- CVC: Any 3 digits

### Test Detailer

- Detailer ID: `test-detailer`
- Email: `test@example.com`
- Services: Basic Wash ($25), Wash & Wax ($45), Full Detail ($150), Interior Detail ($75)

### Test Customer

- Name: Test Customer
- Phone: +15551234567
- Email: test@customer.com (optional)
- Address: 123 Test St, Test City, ST 12345

## Automated Testing (Future)

Consider adding:
- Unit tests for database service functions
- Integration tests for API endpoints
- E2E tests with Playwright/Cypress
- Payment flow tests with Stripe test mode
