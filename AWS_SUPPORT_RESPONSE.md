# AWS Support Response - SMS Spending Limit Increase

Copy and paste this into your AWS Support case reply:

---

**Company name:** DetailFlow (Concept Testing Phase - No Legal Entity Yet)

**Company URL:** https://mobile-detailing-saas.vercel.app

**SMS Service use-case information:**

**SMS service or program name:** DetailFlow Appointment Notifications

**Company relationship to the SMS service:** 
DetailFlow is a SaaS platform (currently in concept testing phase) that provides business management software for mobile car detailing businesses. Our platform enables detailers (our SaaS customers) to send transactional SMS notifications to their car owner clients. These SMS messages are sent automatically when:
- A customer books an appointment through our platform
- An appointment is confirmed by the detailer
- A 24-hour reminder is sent before scheduled appointments
- Service completion notifications with payment links
- Appointment rescheduling or cancellation notifications

All SMS messages are transactional in nature and sent only to customers who have booked services with our detailer customers. Messages include appointment details, business names, and occasionally payment links. All messages include "Reply STOP to opt out" for compliance.

**SMS service or program desired launch date:** As soon as AWS approvals are complete (testing phase currently)

**Origination identity to be used:** Sender ID (business name)
- **Is the identity currently registered or unregistered?** Unregistered. We plan to use Sender ID with business names (e.g., "DetailFlow" or individual detailer business names). This is the simplest option for our testing phase.

**Expected messages per day:** 
- Testing phase: 20-50 messages/day
- Initial launch: 100-200 messages/day
- Growth projection: 500-1,000 messages/day within 6 months

**Expected messages per second:** 
- Peak: Less than 1 message/second
- Average: Much less than 1 message/second
- All messages are transactional and event-driven (appointment bookings, confirmations, reminders)

**URL(s) that will be present in your messages:**
- Primary booking URL: https://mobile-detailing-saas.vercel.app/book/[detailer-id]
- Payment links: https://mobile-detailing-saas.vercel.app/pay/[payment-id]
- Main platform URL: https://mobile-detailing-saas.vercel.app

**Domain relationship:**
The AWS account domain and the service URLs (mobile-detailing-saas.vercel.app) are the same entity. DetailFlow operates the SaaS platform and uses AWS SNS to send SMS notifications on behalf of our detailer customers. All SMS messages are sent from our platform's AWS account to support our SaaS service offering.

---

**Additional Context (optional to include):**
Our SMS service is fully compliant with TCPA requirements:
- All messages are transactional (appointment-related)
- Customers opt-in by booking appointments through our platform
- All messages include opt-out instructions ("Reply STOP to opt out")
- Messages are only sent to customers who have active business relationships with our detailer customers
- No marketing or promotional content is sent via SMS

We are requesting a spending limit increase to $10/month to support our initial launch and early growth phase.
