-- Fix User Limits RLS Policies
-- Remove admin policies that cause permission errors with auth.users table

-- Drop existing admin policies that cause permission errors
DROP POLICY IF EXISTS "Admins can view all limits" ON user_limits;
DROP POLICY IF EXISTS "Admins can update all limits" ON user_limits;
DROP POLICY IF EXISTS "Admins can view all usage history" ON usage_history;

-- The basic user policies should work fine:
-- "Users can view own limits" - allows users to see their own limits
-- "Users can update own limits" - allows users to update their own limits  
-- "Users can insert own limits" - allows users to create their own limits
-- "Users can view own usage history" - allows users to see their own history
-- "Users can insert own usage history" - allows users to create their own history

-- Admin access will be handled directly in the database as requested
-- No additional RLS policies needed for admin functionality 