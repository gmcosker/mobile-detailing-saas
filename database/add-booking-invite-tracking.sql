-- Add column to track last booking invite SMS sent date
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_booking_invite_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_last_booking_invite_sent_at 
ON customers(last_booking_invite_sent_at);

