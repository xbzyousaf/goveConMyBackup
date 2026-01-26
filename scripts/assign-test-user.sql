-- Script to assign a real Replit user ID to a test profile
-- Usage: Replace 'REPLIT_USER_ID_HERE' with the actual user ID from Replit Auth
-- Replace 'TEST_PROFILE' with one of: test-user-startup-001, test-user-growth-002, test-user-scale-003

-- Update the user_maturity_profiles table
UPDATE user_maturity_profiles
SET user_id = 'REPLIT_USER_ID_HERE'
WHERE user_id = 'TEST_PROFILE';

-- Update the user_journeys table
UPDATE user_journeys
SET user_id = 'REPLIT_USER_ID_HERE'
WHERE user_id = 'TEST_PROFILE';

-- Verify the update
SELECT 
  user_id,
  maturity_stage,
  readiness_score,
  subscription_tier
FROM user_maturity_profiles
WHERE user_id = 'REPLIT_USER_ID_HERE';
